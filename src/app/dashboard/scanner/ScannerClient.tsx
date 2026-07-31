"use client"

import { useState, useRef, useEffect } from "react"
import { 
  ScanLine, 
  UserCheck, 
  AlertCircle, 
  Clock, 
  Sparkles, 
  UserX, 
  ShieldAlert, 
  AlertTriangle, 
  ArrowRight, 
  Keyboard 
} from "lucide-react"
import { playSuccessSound, playErrorSound } from "@/lib/audio"

interface CheckIn {
  name: string
  time: string
  service: string
  type: string
  remaining: number
}

type ScanState = 
  | "IDLE" 
  | "RESOLVING" 
  | "CHOOSING" 
  | "MAKEUP_PROMPT" 
  | "CONFIRMING" 
  | "RESULT"

export default function ScannerClient() {
  const [state, setState] = useState<ScanState>("IDLE")
  const [scannedId, setScannedId] = useState("")
  const [isFocused, setIsFocused] = useState(true)
  const [recentCheckIns, setRecentCheckIns] = useState<CheckIn[]>([])
  
  // Scanned client data
  const [clientData, setClientData] = useState<any | null>(null)
  const [scanStates, setScanStates] = useState<any[]>([])
  const [scanNonce, setScanNonce] = useState("")
  const [selectedState, setSelectedState] = useState<any | null>(null)
  const [requiresChoice, setRequiresChoice] = useState(false)
  const [scanError, setScanError] = useState<string | null>(null)
  
  // Results display
  const [resultMessage, setResultMessage] = useState<{
    type: "success" | "error"
    text: string
    clientName?: string
    itemName?: string
    remaining?: number
    actionType?: string
  } | null>(null)

  const inputRef = useRef<HTMLInputElement>(null)
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  // Auto focus input to catch barcode scanner gun input
  useEffect(() => {
    inputRef.current?.focus()
    const interval = setInterval(() => {
      if (
        state === "IDLE" && 
        document.activeElement !== inputRef.current
      ) {
        inputRef.current?.focus()
      }
    }, 1200)
    return () => clearInterval(interval)
  }, [state])

  // Reset to IDLE after timeout in RESULT state
  useEffect(() => {
    if (state === "RESULT") {
      timerRef.current = setTimeout(() => {
        handleCancel()
      }, 10000) // 10 seconds auto-reset
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [state])

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept if user is typing in the scan input manually
      if (document.activeElement === inputRef.current && state === "IDLE") {
        return
      }

      if (e.key === "Escape") {
        handleCancel()
        e.preventDefault()
        return
      }

      if (state === "CHOOSING") {
        const num = parseInt(e.key)
        if (!isNaN(num) && num >= 1 && num <= scanStates.length) {
          const selected = scanStates[num - 1]
          handleSelectEnrollment(selected)
          e.preventDefault()
        }
      }

      if (state === "MAKEUP_PROMPT") {
        if (e.key.toLowerCase() === "m") {
          handleConfirmAction("CHECK_IN_MAKEUP")
          e.preventDefault()
        } else if (e.key.toLowerCase() === "o") {
          handleConfirmAction("CHECK_IN_OFF_SCHEDULE")
          e.preventDefault()
        }
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [state, scanStates, selectedState])

  function handleCardClick() {
    if (state === "IDLE") {
      inputRef.current?.focus()
    }
  }

  function handleCancel() {
    setState("IDLE")
    setScannedId("")
    setClientData(null)
    setScanStates([])
    setSelectedState(null)
    setScanNonce("")
    setScanError(null)
    if (timerRef.current) clearTimeout(timerRef.current)
    setTimeout(() => inputRef.current?.focus(), 50)
  }

  async function handleScanSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!scannedId.trim()) return

    setState("RESOLVING")
    setScanError(null)
    setResultMessage(null)

    try {
      const res = await fetch("/api/scan/resolve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: scannedId.trim() })
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || "خطأ في قراءة الكود")
      }

      setClientData(data.client)
      setScanStates(data.states)
      setScanNonce(data.scanNonce)
      setRequiresChoice(data.requiresChoice)

      if (data.states.length === 0) {
        throw new Error("المشتركة لا تملك أي اشتراكات مؤكدة حالياً")
      }

      // Fast-track: Single option and it doesn't require program choice or makeup prompt
      if (!data.requiresChoice && data.recommendedId) {
        const recommended = data.states.find(
          (s: any) => s.enrollmentId === data.recommendedId
        )
        if (recommended) {
          // If it is regular check-in, confirm it immediately
          if (recommended.allowedActions.includes("CHECK_IN")) {
            await executeConfirm(recommended.enrollmentId, "CHECK_IN", data.scanNonce, data.client.name)
          } else {
            // Needs prompt (e.g. off schedule day or payments blockers)
            setSelectedState(recommended)
            if (recommended.blockers.length > 0 && !recommended.allowedActions.some((a: any) => a.startsWith("CHECK_IN"))) {
              // Blocked completely
              setState("CHOOSING")
            } else {
              setState("MAKEUP_PROMPT")
            }
          }
        } else {
          setState("CHOOSING")
        }
      } else {
        // Choice is required
        setState("CHOOSING")
      }

    } catch (err: any) {
      playErrorSound()
      setResultMessage({
        type: "error",
        text: err.message || "حدث خطأ أثناء فحص الكود"
      })
      setState("RESULT")
    }
  }

  function handleSelectEnrollment(enrollState: any) {
    setSelectedState(enrollState)
    
    // Check if it requires a makeup prompt (off-schedule day)
    const canCheckIn = enrollState.allowedActions.includes("CHECK_IN")
    const needsPrompt = 
      enrollState.allowedActions.includes("CHECK_IN_MAKEUP") || 
      enrollState.allowedActions.includes("CHECK_IN_OFF_SCHEDULE")

    if (canCheckIn && !needsPrompt) {
      handleConfirmAction("CHECK_IN", enrollState.enrollmentId)
    } else if (needsPrompt) {
      setState("MAKEUP_PROMPT")
    } else {
      // Just confirm so the backend handles the blockers validation
      handleConfirmAction("CHECK_IN", enrollState.enrollmentId)
    }
  }

  async function handleConfirmAction(action: string, enrollmentId?: string) {
    const eId = enrollmentId || selectedState?.enrollmentId
    if (!eId || !scanNonce) return

    setState("CONFIRMING")
    await executeConfirm(eId, action, scanNonce, clientData?.name)
  }

  async function executeConfirm(
    enrollmentId: string, 
    action: string, 
    nonce: string,
    clientName: string
  ) {
    try {
      const res = await fetch("/api/scan/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scanNonce: nonce,
          enrollmentId,
          action
        })
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || "فشل تسجيل الحضور")
      }

      playSuccessSound()
      
      let actionText = "حضور أساسي"
      if (action === "CHECK_IN_MAKEUP") actionText = "حضور تعويضي"
      if (action === "CHECK_IN_OFF_SCHEDULE") actionText = "حضور استثنائي"

      setResultMessage({
        type: "success",
        text: `تم تسجيل الدخول بنجاح!`,
        clientName: clientName,
        itemName: data.state.title,
        remaining: data.state.sessions.remaining,
        actionType: actionText
      })

      // Add to recent feed
      const newCheckIn: CheckIn = {
        name: clientName,
        time: new Date().toLocaleTimeString("ar-EG", { 
          hour: "2-digit", 
          minute: "2-digit", 
          second: "2-digit" 
        }),
        service: data.state.title,
        type: actionText,
        remaining: data.state.sessions.remaining
      }
      setRecentCheckIns(prev => [newCheckIn, ...prev].slice(0, 5))

    } catch (err: any) {
      playErrorSound()
      setResultMessage({
        type: "error",
        text: err.message || "حدث خطأ أثناء تسجيل الدخول"
      })
    } finally {
      setState("RESULT")
    }
  }

  return (
    <div className="max-w-5xl mx-auto mt-6 space-y-8 text-right font-sans">
      
      {/* Top Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-black text-foreground mb-2 tracking-tight">ماسح الحضور والدخول السريع (QR)</h2>
          <p className="text-foreground/70 font-medium">تسجيل حضور المشتركات تلقائياً بمسح الكود أو إدخال رقم الهاتف.</p>
        </div>
        <div className="bg-secondary/40 border border-border px-4 py-2 rounded-xl flex items-center gap-2 text-xs text-foreground/60 font-semibold shadow-2xs">
          <Keyboard size={14} className="text-primary" />
          <span>اختصارات لوحة المفاتيح مفعلة ⌨️</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Recent Check-Ins Feed */}
        <div className="bg-card p-6 rounded-[2.5rem] border border-border shadow-sm h-fit space-y-4 lg:col-span-1">
          <div className="flex items-center justify-end gap-2 border-b border-border pb-4">
            <h3 className="text-base font-black text-foreground">سجل الدخول الأخير (الجلسة الحالية)</h3>
            <Clock size={18} className="text-foreground/45" />
          </div>

          {recentCheckIns.length === 0 ? (
            <div className="py-12 text-center text-foreground/40 font-semibold flex flex-col items-center justify-center">
              <ScanLine size={32} className="mb-2 opacity-50" />
              لم يتم تسجيل دخول أي عضوة بعد.
            </div>
          ) : (
            <div className="space-y-4">
              {recentCheckIns.map((ci, idx) => (
                <div key={idx} className="p-4 bg-background border border-border rounded-2xl flex items-center justify-between gap-4 animate-in slide-in-from-top-3 duration-300">
                  <div className="text-left shrink-0">
                    <span className="text-[10px] font-black text-foreground/40 block">{ci.time}</span>
                    <span className="text-[9px] font-black bg-pink-50 text-primary border border-pink-100 px-2 py-0.5 rounded-md mt-1 inline-block">
                      متبقي: {ci.remaining}
                    </span>
                  </div>

                  <div className="text-right min-w-0">
                    <h4 className="font-black text-sm text-foreground truncate">{ci.name}</h4>
                    <p className="text-[10px] text-foreground/50 truncate font-semibold mt-0.5">{ci.service}</p>
                    <span className="text-[9px] text-slate-500 font-bold">{ci.type}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Main Scan Area */}
        <div 
          onClick={handleCardClick}
          className="lg:col-span-2 bg-card rounded-[2.5rem] p-8 md:p-12 border border-border shadow-[0_8px_40px_rgba(236,72,153,0.03)] text-center relative overflow-hidden cursor-pointer hover:border-primary/20 transition-all duration-300 flex flex-col justify-center min-h-[420px]"
        >
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none"></div>
          
          {state === "IDLE" && (
            <div className="relative z-10 flex flex-col items-center justify-center space-y-6 animate-in fade-in duration-300">
              {/* Status indicator */}
              {isFocused ? (
                <span className="text-green-500 bg-green-50 border border-green-100 px-4 py-1.5 rounded-full text-xs font-black flex items-center gap-1.5 animate-pulse">
                  <span className="w-2 h-2 rounded-full bg-green-500"></span>
                  القارئ متصل وجاهز للمسح 🟢
                </span>
              ) : (
                <span className="text-amber-500 bg-amber-50 border border-amber-100 px-4 py-1.5 rounded-full text-xs font-black flex items-center gap-1.5 animate-bounce">
                  <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                  اضغطي في أي مكان هنا لتنشيط القارئ ⚠️
                </span>
              )}

              {/* Glowing Scan Logo */}
              <div className={`w-28 h-28 bg-primary/10 rounded-full flex items-center justify-center text-primary border border-primary/20 transition-all ${isFocused ? 'ring-4 ring-primary/10 scale-105' : ''}`}>
                <ScanLine size={48} className="animate-pulse" />
              </div>

              <div className="max-w-md space-y-2">
                <h2 className="text-3xl font-black text-foreground tracking-tight">
                  ماسح الدخول السريع
                </h2>
                <p className="text-sm text-foreground/60 font-semibold leading-relaxed">
                  وجهي جهاز الباركود نحو كود الـ QR المعروض في هاتف العميلة، أو اكتبِ <strong className="text-primary">رقم الهاتف</strong> يدوياً بالأسفل ثم اضغطي Enter.
                </p>
              </div>

              {/* Scan Form */}
              <form onSubmit={handleScanSubmit} className="w-full max-w-xs mx-auto">
                <input 
                  ref={inputRef}
                  type="text" 
                  value={scannedId}
                  onChange={(e) => setScannedId(e.target.value)}
                  placeholder="QR Code / رقم الموبايل..." 
                  className="w-full text-center px-4 py-4 bg-background border-2 border-primary/30 focus:border-primary rounded-2xl focus:outline-none focus:ring-4 focus:ring-primary/20 text-xl font-bold tracking-widest text-foreground transition-all placeholder:text-foreground/30 dir-ltr"
                  autoComplete="off"
                  onFocus={() => setIsFocused(true)}
                  onBlur={() => setIsFocused(false)}
                />
                <button type="submit" className="hidden">Scan</button>
              </form>
            </div>
          )}

          {state === "RESOLVING" && (
            <div className="relative z-10 flex flex-col items-center justify-center space-y-6 animate-in fade-in duration-300">
              <div className="w-20 h-20 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
              <h2 className="text-2xl font-black text-foreground">جاري فحص الكود وقراءة البيانات...</h2>
              <p className="text-sm text-foreground/60 font-semibold">نقوم بالتحقق من الاشتراكات وحسابات الدفع والتاريخ.</p>
            </div>
          )}

          {state === "CHOOSING" && clientData && (
            <div className="relative z-10 w-full text-right space-y-6 animate-in zoom-in-95 duration-300">
              <div className="flex items-center justify-between border-b border-border pb-4">
                <button 
                  onClick={handleCancel}
                  className="text-xs text-foreground/50 hover:text-foreground flex items-center gap-1 border border-border px-3 py-1.5 rounded-xl bg-background hover:bg-secondary/40 font-bold transition-all cursor-pointer"
                >
                  <ArrowRight size={14} />
                  <span>إلغاء والعودة</span>
                </button>
                <div className="text-right">
                  <h3 className="text-xl font-black text-foreground">{clientData.name}</h3>
                  <p className="text-xs text-foreground/50 font-semibold mt-0.5">{clientData.phone}</p>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="text-sm font-black text-foreground/70">اختر البرنامج لتسجيل الحضور:</h4>
                <p className="text-xs text-foreground/45 font-bold">يمكنك الاختيار بالضغط على البطاقة أو ضغط الرقم المقابل في لوحة المفاتيح (1..9).</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[300px] overflow-y-auto p-1">
                {scanStates.map((st, idx) => {
                  const hasBlockers = st.blockers.length > 0
                  const isRecommended = st.recommended
                  
                  return (
                    <div 
                      key={st.enrollmentId}
                      onClick={() => handleSelectEnrollment(st)}
                      className={`relative border p-5 rounded-3xl text-right transition-all flex flex-col justify-between cursor-pointer hover:scale-[1.02] ${
                        isRecommended 
                          ? 'border-primary bg-primary/5 ring-2 ring-primary/20 shadow-xs' 
                          : hasBlockers 
                            ? 'border-border bg-slate-50/50 opacity-70 hover:opacity-100' 
                            : 'border-border bg-background hover:border-primary/40'
                      }`}
                    >
                      {/* Keyboard shortcut bubble */}
                      <span className="absolute top-3 left-3 bg-secondary text-foreground/60 border border-border/80 w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black">
                        {idx + 1}
                      </span>

                      <div>
                        <div className="flex items-center justify-start gap-2 mb-2">
                          <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-md ${
                            st.kind === 'PROGRAM' ? 'bg-pink-100 text-primary' : 'bg-purple-100 text-purple-600'
                          }`}>
                            {st.kind === 'PROGRAM' ? 'برنامج' : st.kind === 'WORKSHOP' ? 'ورشة' : 'فعالية'}
                          </span>
                          {isRecommended && (
                            <span className="text-[9px] font-black bg-green-500 text-white px-2 py-0.5 rounded-md">
                              موصى به ★
                            </span>
                          )}
                        </div>

                        <h5 className="font-black text-base text-foreground mb-1 leading-snug">{st.title}</h5>
                        
                        <div className="text-xs text-foreground/60 font-semibold space-y-1 mt-2">
                          <p>المتبقي: {st.sessions.remaining} حصة (من أصل {st.sessions.total})</p>
                          <p>تاريخ الانتهاء: {st.period.endDate || "غير محدد"}</p>
                          {st.money.due > 0 && (
                            <p className="text-amber-600 font-bold">المتبقي المالي: {st.money.due} ج.م</p>
                          )}
                        </div>
                      </div>

                      {/* Blockers & Warnings indicators */}
                      <div className="mt-4 pt-3 border-t border-border/60 flex flex-wrap gap-1.5">
                        {st.blockers.map((bl: string) => (
                          <span key={bl} className="text-[9px] font-bold bg-red-100 text-red-600 px-2 py-0.5 rounded-md flex items-center gap-1">
                            <AlertCircle size={10} />
                            {bl === "EXPIRED" && "منتهي الصلاحية"}
                            {bl === "SESSIONS_EXHAUSTED" && "نفدت الحصص"}
                            {bl === "PAYMENT_LIMIT" && "تجاوز حد الدفع"}
                            {bl === "ALREADY_CHECKED_IN" && "سجل اليوم بالفعل"}
                            {bl === "NOT_CONFIRMED" && "غير مؤكد الدفع"}
                            {bl === "CANCELLED" && "ملغي"}
                          </span>
                        ))}
                        {st.blockers.length === 0 && st.warnings.map((wr: string) => (
                          <span key={wr} className="text-[9px] font-bold bg-amber-50 text-amber-600 border border-amber-100 px-2 py-0.5 rounded-md flex items-center gap-1">
                            <AlertTriangle size={10} />
                            {wr === "OFF_SCHEDULE_DAY" && "يوم غير مجدول"}
                            {wr === "OUTSIDE_TIME_WINDOW" && "خارج توقيت الحصة"}
                            {wr === "EXPIRES_SOON" && "ينتهي قريباً"}
                            {wr === "PARTIAL_PAYMENT" && "دفع جزئي"}
                          </span>
                        ))}
                        {st.blockers.length === 0 && st.warnings.length === 0 && (
                          <span className="text-[9px] font-bold bg-green-50 text-green-600 border border-green-100 px-2 py-0.5 rounded-md">
                            جاهز للدخول ✓
                          </span>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {state === "MAKEUP_PROMPT" && selectedState && clientData && (
            <div className="relative z-10 max-w-lg mx-auto w-full text-right space-y-6 animate-in zoom-in-95 duration-300 bg-background border border-border p-6 rounded-[2rem] shadow-xs">
              <div className="flex items-center gap-3 border-b border-border pb-4">
                <div className="p-2.5 bg-amber-100 text-amber-600 rounded-2xl"><AlertTriangle size={24} /></div>
                <div>
                  <h3 className="text-lg font-black text-foreground">تنبيه: اليوم ليس من أيام الحصص المعتادة</h3>
                  <p className="text-xs text-foreground/50 font-bold mt-1">
                    العميلة: <strong className="text-foreground">{clientData.name}</strong> · البرنامج: <strong className="text-foreground">{selectedState.title}</strong>
                  </p>
                </div>
              </div>

              <div className="text-sm font-semibold text-foreground/75 leading-relaxed space-y-2">
                <p>اليوم ليس مسجلاً في جدول حصص هذا البرنامج.</p>
                {selectedState.schedule.weekly.length > 0 && (
                  <p className="text-xs text-primary font-bold">
                    أيام البرنامج المعتادة: {selectedState.schedule.weekly.map((w: any) => {
                      const days = ["الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"]
                      return `${days[w.dayOfWeek]} (${w.start}–${w.end})`
                    }).join(" ، ")}
                  </p>
                )}
                <p className="text-xs text-foreground/50 font-bold">
                  الحصص التعويضية المستخدمة: {selectedState.sessions.makeupUsed} من أصل {selectedState.sessions.makeupAllowed} مسموحة.
                </p>
              </div>

              <div className="grid grid-cols-3 gap-3 pt-2">
                <button
                  onClick={() => handleConfirmAction("CHECK_IN_MAKEUP")}
                  disabled={selectedState.sessions.makeupUsed >= selectedState.sessions.makeupAllowed}
                  className="bg-primary text-white hover:bg-primary-hover px-4 py-3.5 rounded-2xl font-black text-xs transition-all flex flex-col items-center justify-center gap-1 hover:scale-[1.02] cursor-pointer disabled:opacity-50 disabled:pointer-events-none"
                >
                  <span className="text-sm">حصة تعويضية</span>
                  <span className="text-[10px] opacity-75 font-normal">اضغط مفتاح M</span>
                </button>
                <button
                  onClick={() => handleConfirmAction("CHECK_IN_OFF_SCHEDULE")}
                  className="bg-secondary text-foreground hover:bg-secondary-hover border border-border px-4 py-3.5 rounded-2xl font-black text-xs transition-all flex flex-col items-center justify-center gap-1 hover:scale-[1.02] cursor-pointer"
                >
                  <span className="text-sm">حضور استثنائي</span>
                  <span className="text-[10px] opacity-75 font-normal">اضغط مفتاح O</span>
                </button>
                <button
                  onClick={handleCancel}
                  className="bg-background border border-border text-foreground hover:bg-secondary/40 px-4 py-3.5 rounded-2xl font-black text-xs transition-all flex flex-col items-center justify-center gap-1 hover:scale-[1.02] cursor-pointer"
                >
                  <span className="text-sm">إلغاء</span>
                  <span className="text-[10px] opacity-75 font-normal">اضغط Esc</span>
                </button>
              </div>
            </div>
          )}

          {state === "CONFIRMING" && (
            <div className="relative z-10 flex flex-col items-center justify-center space-y-6 animate-in fade-in duration-300">
              <div className="w-20 h-20 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
              <h2 className="text-2xl font-black text-foreground">جاري تسجيل حضور المشتركة...</h2>
              <p className="text-sm text-foreground/60 font-semibold">نقوم بحفظ السجلات وتحديث العدّادات في قاعدة البيانات.</p>
            </div>
          )}

          {state === "RESULT" && resultMessage && (
            <div className="relative z-10 w-full max-w-xl mx-auto space-y-6 animate-in zoom-in-95 duration-300 text-right">
              
              {resultMessage.type === "success" ? (
                <div className="bg-green-500/10 border border-green-500/30 rounded-[2.5rem] p-8 space-y-6 flex flex-col items-center text-center">
                  <div className="p-4 bg-green-500 text-white rounded-full shadow-md animate-bounce"><UserCheck size={38} /></div>
                  
                  <div className="space-y-2">
                    <h3 className="text-2xl font-black text-green-700">عملية دخول ناجحة</h3>
                    <p className="text-xl font-bold text-slate-800 mt-2">{resultMessage.clientName}</p>
                    <p className="text-sm font-semibold text-slate-600">{resultMessage.itemName}</p>
                    <div className="flex items-center justify-center gap-2 mt-2">
                      <span className="bg-green-100 text-green-700 border border-green-200 px-3 py-1 rounded-md text-xs font-black">
                        نوع الدخول: {resultMessage.actionType}
                      </span>
                      {resultMessage.remaining !== undefined && (
                        <span className="bg-pink-50 text-primary border border-pink-100 px-3 py-1 rounded-md text-xs font-black">
                          الحصص المتبقية: {resultMessage.remaining}
                        </span>
                      )}
                    </div>
                  </div>

                  <p className="text-xs text-foreground/45 font-bold">سيعود النظام تلقائياً لوضع الاستعداد خلال 10 ثوانٍ، أو اضغط Enter للعودة الفورية.</p>
                </div>
              ) : (
                <div className="bg-red-500/10 border border-red-500/30 rounded-[2.5rem] p-8 space-y-6 flex flex-col items-center text-center">
                  <div className="p-4 bg-red-500 text-white rounded-full shadow-md animate-pulse"><ShieldAlert size={38} /></div>
                  
                  <div className="space-y-2">
                    <h3 className="text-2xl font-black text-red-700">فشل عملية الدخول</h3>
                    <p className="text-sm font-semibold text-red-600 mt-2 leading-relaxed">{resultMessage.text}</p>
                  </div>

                  <p className="text-xs text-foreground/45 font-bold">اضغط Esc للعودة ومسح الكود مرة أخرى.</p>
                </div>
              )}

              <div className="flex justify-center">
                <button
                  onClick={handleCancel}
                  className="bg-primary hover:bg-primary-hover text-white px-8 py-3 rounded-2xl font-black text-xs shadow-md transition-all cursor-pointer"
                >
                  العودة لوضع الاستعداد (Enter / Esc)
                </button>
              </div>

            </div>
          )}

        </div>

      </div>

    </div>
  )
}
