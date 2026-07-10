"use client"

import { useState, useRef, useEffect } from "react"
import { ScanLine, UserCheck, AlertCircle, Clock, Sparkles, UserX, ShieldAlert } from "lucide-react"
import { playSuccessSound, playErrorSound } from "@/lib/audio"

interface CheckIn {
  name: string
  time: string
  service: string
  remaining: number
}

export default function ScannerClient() {
  const [scannedId, setScannedId] = useState("")
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{type: 'success' | 'error', text: string} | null>(null)
  const [isFocused, setIsFocused] = useState(true)
  const [recentCheckIns, setRecentCheckIns] = useState<CheckIn[]>([])
  
  const inputRef = useRef<HTMLInputElement>(null)

  // Auto focus input to catch barcode scanner gun input
  useEffect(() => {
    inputRef.current?.focus()
    const interval = setInterval(() => {
      if (document.activeElement !== inputRef.current) {
        // Only auto focus if the user is not actively typing in another field (e.g. general search)
        // Since there is no other inputs on this page, it's safe to refocus
        inputRef.current?.focus()
      }
    }, 1200)
    return () => clearInterval(interval)
  }, [])

  const handleCardClick = () => {
    inputRef.current?.focus()
  }

  const handleScan = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!scannedId) return

    setLoading(true)
    setMessage(null)

    try {
      const res = await fetch(`/api/scan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientId: scannedId })
      })

      const data = await res.json()
      
      if (!res.ok) {
        throw new Error(data.error || "خطأ في قراءة الكود")
      }

      const successText = `تم تسجيل حضور: ${data.name} في (${data.itemName}) بنجاح. ${data.remaining !== undefined && data.remaining !== null ? `متبقي لها ${data.remaining} حصة.` : ''}`
      setMessage({ type: 'success', text: successText })
      
      // Add to recent check-ins
      const newCheckIn: CheckIn = {
        name: data.name,
        time: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        service: data.itemName || "اشتراك",
        remaining: data.remaining ?? 0
      }
      setRecentCheckIns(prev => [newCheckIn, ...prev].slice(0, 5))

      // Play success sound
      playSuccessSound()

    } catch (err: any) {
      setMessage({ type: 'error', text: err.message })
      playErrorSound()
    } finally {
      setScannedId("")
      setLoading(false)
      inputRef.current?.focus()
    }
  }

  return (
    <div className="max-w-5xl mx-auto mt-6 space-y-8 text-right">
      
      {/* Top Header */}
      <div>
        <h2 className="text-3xl font-black text-foreground mb-2 tracking-tight">ماسح الحضور والدخول السريع (QR)</h2>
        <p className="text-foreground/70 font-medium">تسجيل حضور المشتركات تلقائياً بمسح الكود أو إدخال رقم الهاتف.</p>
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
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Main Scan Area */}
        <div 
          onClick={handleCardClick}
          className="lg:col-span-2 bg-card rounded-[2.5rem] p-8 md:p-12 border border-border shadow-[0_8px_40px_rgba(236,72,153,0.03)] text-center relative overflow-hidden cursor-pointer hover:border-primary/20 transition-all duration-300"
        >
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none"></div>
          
          <div className="relative z-10 flex flex-col items-center justify-center space-y-6">
            
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
            <div className={`w-28 h-28 bg-primary/10 rounded-full flex items-center justify-center text-primary shadow-inner border border-primary/20 ${isFocused ? 'ring-4 ring-primary/10 animate-pulse' : ''}`}>
              <ScanLine size={48} />
            </div>

            <div className="max-w-md space-y-2">
              <h2 className="text-3xl font-black text-[#121212] tracking-tight">
                ماسح الدخول السريع
              </h2>
              <p className="text-sm text-foreground/60 font-semibold leading-relaxed">
                وجهي جهاز الباركود نحو كود الـ QR المعروض في هاتف العميلة، أو اكتبِ <strong className="text-primary">رقم الهاتف</strong> يدوياً بالأسفل ثم اضغطي Enter.
              </p>
            </div>

            {/* Hidden / Focused Input Container */}
            <form onSubmit={handleScan} className="w-full max-w-xs mx-auto">
              <input 
                ref={inputRef}
                type="text" 
                value={scannedId}
                onChange={(e) => setScannedId(e.target.value)}
                placeholder="QR Code / رقم الموبايل..." 
                className="w-full text-center px-4 py-4 bg-background border-2 border-primary/40 focus:border-primary rounded-2xl focus:outline-none focus:ring-4 focus:ring-primary/20 text-xl font-bold tracking-widest text-foreground transition-all placeholder:text-foreground/30 dir-ltr"
                disabled={loading}
                autoComplete="off"
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
              />
              <button type="submit" className="hidden">Scan</button>
            </form>

            {loading && <p className="text-primary text-sm font-black animate-pulse">جاري التحقق وتسجيل الحضور...</p>}

            {/* Response Message Toast-like Container */}
            {message && (
              <div className={`w-full max-w-lg p-5 rounded-[2rem] border flex items-center gap-4 text-right animate-in zoom-in duration-300 ${message.type === 'success' ? 'bg-green-500/10 border-green-500/30 text-green-600' : 'bg-red-500/10 border-red-500/30 text-red-600'}`}>
                {message.type === 'success' ? (
                  <div className="p-3 bg-green-500 text-white rounded-2xl shadow-md"><UserCheck size={24} /></div>
                ) : (
                  <div className="p-3 bg-red-500 text-white rounded-2xl shadow-md"><ShieldAlert size={24} /></div>
                )}
                <div>
                  <h4 className="font-black text-sm">{message.type === 'success' ? 'عملية دخول ناجحة' : 'خطأ في عملية الدخول'}</h4>
                  <p className="font-bold text-xs mt-1 leading-relaxed opacity-90">{message.text}</p>
                </div>
              </div>
            )}
            
          </div>
        </div>

      </div>

    </div>
  )
}
