"use client"

import React, { useState, useTransition } from "react"
import { 
  Phone, 
  Mail, 
  FileText, 
  Calendar, 
  Clock, 
  ArrowRight, 
  Edit3, 
  Trash2, 
  X, 
  AlertTriangle, 
  Sparkles, 
  CheckCircle, 
  Printer, 
  DollarSign, 
  TrendingUp, 
  Activity, 
  ShieldAlert,
  RotateCcw,
  AlertCircle
} from "lucide-react"
import Link from "next/link"
import { updateClient, deleteClient } from "@/actions/client"
import { useRouter } from "next/navigation"

interface ClientProfileManagerProps {
  client: any
  canEdit?: boolean
  canDelete?: boolean
}

export default function ClientProfileManager({ 
  client,
  canEdit = true,
  canDelete = true
}: ClientProfileManagerProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  
  // Modal States
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [isQrOpen, setIsQrOpen] = useState(false)
  
  // Tab State
  const [activeTab, setActiveTab] = useState<"subs" | "timeline" | "payments">("subs")
  
  // Form States
  const [name, setName] = useState(client.name)
  const [phone, setPhone] = useState(client.phone)
  const [email, setEmail] = useState(client.email || "")
  const [notes, setNotes] = useState(client.notes || "")
  const [errorMsg, setErrorMsg] = useState("")

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg("")

    if (!name || !phone) {
      setErrorMsg("الاسم ورقم الهاتف مطلوبان.")
      return
    }

    startTransition(async () => {
      try {
        const res = await updateClient(client.id, { name, phone, email, notes })
        if (res.success) {
          setIsEditOpen(false)
          router.refresh()
        }
      } catch (err: any) {
        setErrorMsg(err.message || "حدث خطأ أثناء حفظ البيانات.")
      }
    })
  }

  const handleDeleteSubmit = async () => {
    setErrorMsg("")
    startTransition(async () => {
      try {
        const res = await deleteClient(client.id)
        if (res.success) {
          setIsDeleteOpen(false)
          router.push("/dashboard/clients")
        }
      } catch (err: any) {
        setErrorMsg(err.message || "حدث خطأ أثناء حذف الحساب.")
      }
    })
  }

  const handlePrintCard = () => {
    window.print()
  }

  const kpis = client.kpis || {
    activeSubscriptions: 0,
    totalSessionsAttended: 0,
    lifetimeValue: 0,
    outstandingBalance: 0,
    lastVisit: null,
    riskFlag: "OK"
  }

  return (
    <div className="space-y-8 text-right font-sans print:p-0">
      
      {/* Print Styles CSS Injection */}
      <style jsx global>{`
        @media print {
          body {
            background: white !important;
            color: black !important;
          }
          #dashboard-sidebar, 
          #dashboard-header, 
          .print-hidden, 
          button, 
          a {
            display: none !important;
          }
          .print-card-container {
            display: block !important;
            visibility: visible !important;
            position: absolute;
            left: 50%;
            top: 50%;
            transform: translate(-50%, -50%);
            width: 320px;
            border: 2px solid #D13F7A;
            border-radius: 20px;
            padding: 24px;
            text-align: center;
            background: white;
            box-shadow: none !important;
          }
          .print-card-container * {
            visibility: visible !important;
          }
        }
        @media screen {
          .print-card-container {
            display: none;
          }
        }
      `}</style>

      {/* Hidden printable card container */}
      <div className="print-card-container text-center space-y-4">
        <div className="border-b border-pink-100 pb-3 flex flex-col items-center">
          <div className="w-12 h-12 bg-pink-50 rounded-full flex items-center justify-center font-black text-primary text-xl mb-1">S</div>
          <h2 className="text-sm font-black text-slate-800">Soly's Space</h2>
          <p className="text-[7px] text-primary font-bold tracking-widest">MEMBERSHIP CARD</p>
        </div>
        <div className="flex justify-center p-2 bg-white rounded-xl">
          {client.qrSvgDataUrl ? (
            <img src={client.qrSvgDataUrl} alt="QR Code" className="w-36 h-36" />
          ) : (
            <div className="w-36 h-36 border-2 border-dashed border-pink-200 flex items-center justify-center text-xs text-foreground/45">QR Code</div>
          )}
        </div>
        <div className="space-y-1">
          <h3 className="font-black text-base text-slate-800">{client.name}</h3>
          <p className="text-xs text-slate-500 font-semibold" dir="ltr">{client.phone}</p>
        </div>
        <div className="text-[7px] text-slate-400 font-bold border-t border-slate-100 pt-3">
          الرجاء إبراز هذا الكارت عند الدخول لتسجيل الحضور تلقائياً.
        </div>
      </div>

      {/* Top Navigation & Action Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 print-hidden">
        
        {/* Actions (Edit / Delete / QR Card) */}
        <div className="flex items-center gap-3 w-full sm:w-auto order-1 sm:order-2">
          <button
            onClick={() => setIsQrOpen(true)}
            className="flex-1 sm:flex-initial bg-primary hover:bg-primary-hover text-white px-5 py-3 rounded-2xl font-black text-sm transition-all shadow-md hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
          >
            <Printer size={16} />
            <span>كارت العضوية QR</span>
          </button>

          {canEdit && (
            <button
              onClick={() => setIsEditOpen(true)}
              className="flex-1 sm:flex-initial bg-foreground hover:bg-foreground/90 text-white px-5 py-3 rounded-2xl font-black text-sm transition-all shadow-sm hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
            >
              <Edit3 size={16} />
              تعديل البيانات
            </button>
          )}
          
          {canDelete && (
            <button
              onClick={() => setIsDeleteOpen(true)}
              className="flex-1 sm:flex-initial bg-red-50 hover:bg-red-100 text-red-600 border border-red-100 px-5 py-3 rounded-2xl font-black text-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Trash2 size={16} />
              حذف الحساب
            </button>
          )}
        </div>

        {/* Back Link */}
        <Link 
          href="/dashboard/clients" 
          className="inline-flex items-center gap-2 text-foreground/50 hover:text-primary transition-colors font-bold order-2 sm:order-1"
        >
          <ArrowRight size={18} />
          العودة لقائمة العميلات
        </Link>
      </div>

      {/* Main Profile Info Card */}
      <div className="bg-card p-8 rounded-[2.5rem] border border-border shadow-sm relative overflow-hidden flex flex-col md:flex-row justify-between items-start md:items-center gap-6 print-hidden">
        <div className="absolute -top-12 -left-12 w-32 h-32 bg-primary/5 rounded-full blur-3xl"></div>
        
        <div className="flex flex-col sm:flex-row items-center gap-5 z-10 w-full md:w-auto">
          {/* Large Avatar */}
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-primary to-pink-500 p-[1.5px] shadow-lg shadow-pink-200/20 shrink-0">
            <div className="w-full h-full bg-card rounded-3xl flex items-center justify-center font-black text-3xl text-primary select-none">
              {client.name.trim().charAt(0)}
            </div>
          </div>

          {/* Details */}
          <div className="text-center sm:text-right space-y-2">
            <div className="flex flex-col sm:flex-row items-center gap-2">
              <h2 className="text-3xl font-extrabold text-foreground">{client.name}</h2>
              {kpis.riskFlag === "CHURNED" && (
                <span className="bg-red-100 text-red-700 border border-red-200 text-[10px] font-black px-2.5 py-0.5 rounded-full flex items-center gap-1">
                  <ShieldAlert size={12} />
                  منقطعة ⚠️
                </span>
              )}
              {kpis.riskFlag === "AT_RISK" && (
                <span className="bg-amber-100 text-amber-700 border border-amber-200 text-[10px] font-black px-2.5 py-0.5 rounded-full flex items-center gap-1">
                  <AlertTriangle size={12} />
                  معرضة للانقطاع
                </span>
              )}
            </div>
            <div className="flex flex-wrap justify-center sm:justify-start gap-4 text-xs font-semibold text-foreground/60">
              <span className="flex items-center gap-1.5" dir="ltr">
                {client.phone} <Phone size={14} className="text-primary" />
              </span>
              {client.email && (
                <span className="flex items-center gap-1.5">
                  {client.email} <Mail size={14} className="text-primary" />
                </span>
              )}
              <span className="flex items-center gap-1.5">
                انضمت {new Date(client.createdAt).toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' })} <Calendar size={14} className="text-primary" />
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* KPI Stats Strip */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 print-hidden">
        <div className="bg-card p-5 rounded-2xl border border-border shadow-xs">
          <p className="text-foreground/50 text-xs font-bold mb-1.5 flex items-center justify-end gap-1.5">
            الاشتراكات النشطة
            <Activity size={12} className="text-primary" />
          </p>
          <p className="text-2xl font-black text-foreground">{kpis.activeSubscriptions}</p>
        </div>
        
        <div className="bg-card p-5 rounded-2xl border border-border shadow-xs">
          <p className="text-foreground/50 text-xs font-bold mb-1.5 flex items-center justify-end gap-1.5">
            إجمالي الحضور
            <CheckCircle size={12} className="text-green-500" />
          </p>
          <p className="text-2xl font-black text-green-600">{kpis.totalSessionsAttended}</p>
        </div>

        <div className="bg-card p-5 rounded-2xl border border-border shadow-xs">
          <p className="text-foreground/50 text-xs font-bold mb-1.5 flex items-center justify-end gap-1.5">
            المتبقي المالي
            <DollarSign size={12} className="text-amber-500" />
          </p>
          <p className={`text-2xl font-black ${kpis.outstandingBalance > 0 ? "text-amber-600" : "text-foreground"}`}>
            {kpis.outstandingBalance} ج.م
          </p>
        </div>

        <div className="bg-card p-5 rounded-2xl border border-border shadow-xs">
          <p className="text-foreground/50 text-xs font-bold mb-1.5 flex items-center justify-end gap-1.5">
            lifetime Value (LTV)
            <TrendingUp size={12} className="text-pink-500" />
          </p>
          <p className="text-2xl font-black text-primary">{kpis.lifetimeValue} ج.م</p>
        </div>

        <div className="bg-card p-5 rounded-2xl border border-border shadow-xs col-span-2 md:col-span-1">
          <p className="text-foreground/50 text-xs font-bold mb-1.5 flex items-center justify-end gap-1.5">
            آخر زيارة حضور
            <Clock size={12} className="text-slate-400" />
          </p>
          <p className="text-sm font-black text-foreground pt-1.5">
            {kpis.lastVisit ? new Date(kpis.lastVisit).toLocaleDateString('ar-EG', { month: 'short', day: 'numeric', year: 'numeric' }) : "لا يوجد حضور"}
          </p>
        </div>
      </div>

      {/* Tabs and Content Section */}
      <div className="space-y-6 print-hidden">
        
        {/* Tab controller */}
        <div className="border-b border-border flex items-center gap-6">
          <button 
            onClick={() => setActiveTab("subs")}
            className={`pb-3 font-black text-sm border-b-2 cursor-pointer transition-all ${
              activeTab === "subs" ? "border-primary text-primary" : "border-transparent text-foreground/50 hover:text-foreground"
            }`}
          >
            الاشتراكات وتفاصيلها ({client.enrollments.length})
          </button>
          <button 
            onClick={() => setActiveTab("timeline")}
            className={`pb-3 font-black text-sm border-b-2 cursor-pointer transition-all ${
              activeTab === "timeline" ? "border-primary text-primary" : "border-transparent text-foreground/50 hover:text-foreground"
            }`}
          >
            خط الحضور الزمني ({client.timeline?.length || 0})
          </button>
        </div>

        {/* Tab contents */}
        {activeTab === "subs" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {client.enrollments.length === 0 ? (
              <div className="bg-card p-8 text-center text-foreground/45 border border-border rounded-3xl col-span-2">
                لا توجد حجوزات أو اشتراكات مسجلة.
              </div>
            ) : (
              client.enrollments.map((enr: any) => {
                const item = enr.program || enr.workshop || enr.event
                if (!item) return null

                const scanState = client.scanStates?.find((s: any) => s.enrollmentId === enr.id)
                const hasBlockers = scanState?.blockers.length > 0
                const remaining = scanState?.sessions.remaining ?? 0
                const total = scanState?.sessions.total ?? 8
                const used = scanState?.sessions.used ?? 0
                const percent = Math.min(100, Math.round((used / total) * 100))

                return (
                  <div 
                    key={enr.id}
                    className={`bg-card p-6 rounded-[2rem] border shadow-sm space-y-4 flex flex-col justify-between ${
                      enr.status === 'CONFIRMED' && !scanState?.blockers.includes('EXPIRED')
                        ? 'border-primary/20 bg-pink-50/2'
                        : 'border-border opacity-85'
                    }`}
                  >
                    <div>
                      {/* Subscription badge headers */}
                      <div className="flex items-center justify-between gap-4 border-b border-border/60 pb-3">
                        <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full border ${
                          enr.status === 'CONFIRMED' ? 'bg-green-50 text-green-600 border-green-100' :
                          enr.status === 'PENDING' ? 'bg-orange-50 text-orange-600 border-orange-100' :
                          'bg-red-50 text-red-600 border-red-100'
                        }`}>
                          {enr.status === 'CONFIRMED' ? 'نشِط ●' : enr.status === 'PENDING' ? 'انتظار الدفع' : 'ملغي'}
                        </span>
                        
                        <div className="text-right">
                          <h4 className="font-black text-base text-foreground leading-snug">{item.name}</h4>
                          <span className="text-[9px] font-bold text-foreground/45 mt-0.5 block">
                            {enr.program ? "برنامج تدريبي" : enr.workshop ? "ورشة عمل" : "فعالية"}
                          </span>
                        </div>
                      </div>

                      {/* Info lines */}
                      <div className="text-xs font-semibold text-foreground/75 space-y-2 mt-4">
                        {/* Attendance Counter */}
                        {enr.program && (
                          <div className="space-y-1.5">
                            <div className="flex justify-between items-center text-[10px] font-bold text-foreground/50">
                              <span>المتبقي {remaining} حصة</span>
                              <span>حضور {used} من {total} (مستهلك {percent}%)</span>
                            </div>
                            <div className="w-full bg-secondary h-2.5 rounded-full overflow-hidden border border-border/20">
                              <div 
                                className="bg-primary h-full rounded-full transition-all" 
                                style={{ width: `${percent}%` }}
                              ></div>
                            </div>
                          </div>
                        )}

                        <div className="grid grid-cols-2 gap-4 pt-2">
                          <div>
                            <span className="text-foreground/40 block">تاريخ الاشتراك:</span>
                            <span className="font-bold">{enr.startDate ? new Date(enr.startDate).toLocaleDateString('ar-EG') : new Date(enr.createdAt).toLocaleDateString('ar-EG')}</span>
                          </div>
                          <div>
                            <span className="text-foreground/40 block">تاريخ الانتهاء:</span>
                            <span className="font-bold">{enr.endDate ? new Date(enr.endDate).toLocaleDateString('ar-EG') : "غير محدد"}</span>
                          </div>
                        </div>

                        {/* Schedules (for programs) */}
                        {enr.program && scanState?.schedule.weekly && scanState.schedule.weekly.length > 0 && (
                          <div className="pt-2 border-t border-border/50">
                            <span className="text-foreground/40 block">جدول الحصص المعتاد:</span>
                            <span className="font-bold text-primary">
                              {scanState.schedule.weekly.map((w: any) => {
                                const days = ["الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"]
                                return `${days[w.dayOfWeek]} (${w.start}–${w.end})`
                              }).join(" ، ")}
                            </span>
                          </div>
                        )}

                        {/* Financials details */}
                        <div className="grid grid-cols-2 gap-4 pt-2 border-t border-border/50">
                          <div>
                            <span className="text-foreground/40 block">سعر الحجز:</span>
                            <span className="font-bold">{enr.totalAmount} ج.م</span>
                          </div>
                          <div>
                            <span className="text-foreground/40 block">المسدد:</span>
                            <span className={`font-bold ${enr.amountPaid < enr.totalAmount ? "text-amber-600" : "text-green-600"}`}>
                              {enr.amountPaid || 0} ج.م
                            </span>
                          </div>
                        </div>

                        {/* Carried Sessions (Preloaded count) */}
                        {enr.carriedSessions > 0 && (
                          <div className="text-[10px] font-bold text-foreground/45 pt-1.5">
                            تم ترحيل {enr.carriedSessions} حصة حضور سابقة من الأنظمة القديمة في بداية هذا الاشتراك.
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Blockers or Warnings details if active */}
                    {scanState && (scanState.blockers.length > 0 || scanState.warnings.length > 0) && (
                      <div className="mt-4 pt-3 border-t border-border/50 space-y-1.5">
                        {scanState.blockers.map((b: string) => (
                          <div key={b} className="bg-red-50 border border-red-100 text-red-600 p-2 rounded-xl text-[10px] font-bold flex items-center justify-start gap-1.5">
                            <AlertCircle size={12} />
                            <span>
                              {b === "EXPIRED" && "هذا الاشتراك منتهٍ الصلاحية بالتاريخ."}
                              {b === "SESSIONS_EXHAUSTED" && "تم استنفاد جميع الحصص المتاحة."}
                              {b === "PAYMENT_LIMIT" && `موانع دفع: الحصص المدفوعة نفدت (${scanState.money.allowedByPayment} حصص).`}
                              {b === "ALREADY_CHECKED_IN" && "تم تسجيل الحضور اليوم بالفعل."}
                              {b === "CANCELLED" && "هذا الحجز ملغي."}
                            </span>
                          </div>
                        ))}
                        {scanState.blockers.length === 0 && scanState.warnings.map((w: string) => (
                          <div key={w} className="bg-amber-50 border border-amber-100 text-amber-600 p-2 rounded-xl text-[10px] font-bold flex items-center justify-start gap-1.5">
                            <AlertTriangle size={12} />
                            <span>
                              {w === "OFF_SCHEDULE_DAY" && "تنبيه: اليوم ليس من أيام الحصص المجدولة."}
                              {w === "OUTSIDE_TIME_WINDOW" && "تنبيه: اليوم مجدول ولكن الحضور خارج وقت الحصة."}
                              {w === "EXPIRES_SOON" && `ينتهي قريباً (متبقي ${scanState.period.daysLeft} أيام).`}
                              {w === "PARTIAL_PAYMENT" && `دفع جزئي: متبقي مبلغ مستحق قدره ${scanState.money.due} ج.م.`}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })
            )}
          </div>
        )}

        {activeTab === "timeline" && (
          <div className="bg-card p-6 md:p-8 rounded-[2.5rem] border border-border shadow-sm">
            {!client.timeline || client.timeline.length === 0 ? (
              <p className="text-center text-foreground/45 font-semibold py-8">لم يتم تسجيل حضور فعلي للعميلة بعد.</p>
            ) : (
              <div className="relative border-r border-pink-100 pr-6 space-y-6">
                {client.timeline.map((item: any) => (
                  <div key={item.id} className="relative text-right space-y-1">
                    {/* Glowing bullet point */}
                    <span className={`absolute -right-[31px] top-1.5 w-2.5 h-2.5 rounded-full border bg-card ${
                      item.type === "MAKEUP" ? "border-amber-400 ring-4 ring-amber-100" :
                      item.type === "OFF_SCHEDULE" ? "border-purple-400 ring-4 ring-purple-100" :
                      "border-green-400 ring-4 ring-green-100"
                    }`}></span>

                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-black text-sm text-foreground">{item.itemName}</h4>
                        <span className={`text-[9px] font-black px-2 py-0.5 rounded-md border ${
                          item.type === "MAKEUP" ? "bg-amber-50 text-amber-600 border-amber-100" :
                          item.type === "OFF_SCHEDULE" ? "bg-purple-50 text-purple-600 border-purple-100" :
                          "bg-green-50 text-green-600 border-green-100"
                        }`}>
                          {item.typeText}
                        </span>
                      </div>
                      <span className="text-[10px] text-foreground/40 font-bold leading-none">
                        {new Date(item.date).toLocaleString('ar-EG', { 
                          weekday: 'long', 
                          year: 'numeric', 
                          month: 'short', 
                          day: 'numeric', 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </span>
                    </div>

                    {item.note && (
                      <p className="text-xs text-foreground/50 font-medium bg-secondary p-3 rounded-2xl inline-block mt-1">
                        {item.note}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Client Notes Card */}
      <div className="bg-card p-6 md:p-8 rounded-[2.5rem] border border-border shadow-sm text-right space-y-4 print-hidden">
        <div className="flex items-center justify-end gap-2 border-b border-border pb-4">
          <h3 className="text-lg font-black text-foreground">ملاحظات هامة للعميلة</h3>
          <FileText size={20} className="text-primary" />
        </div>
        
        {client.notes ? (
          <div className="bg-secondary border border-border/50 p-6 rounded-3xl text-foreground/80 font-medium text-base leading-relaxed whitespace-pre-line relative">
            <div className="absolute top-4 left-4 text-pink-200 opacity-20 text-4xl select-none font-serif">"</div>
            {client.notes}
          </div>
        ) : (
          <p className="text-foreground/45 text-sm font-semibold py-4 text-center">
            لا توجد ملاحظات مسجلة للعميلة حالياً.
          </p>
        )}
      </div>

      {/* Edit Modal */}
      {isEditOpen && (
        <div className="fixed inset-0 bg-foreground/40 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-in fade-in duration-300">
          <div className="bg-card w-full max-w-xl rounded-[2.5rem] border border-border shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 text-right">
            
            <div className="p-6 border-b border-border/50 flex justify-between items-center bg-gradient-to-l from-pink-50/20 to-transparent">
              <button
                onClick={() => setIsEditOpen(false)}
                className="p-2 rounded-xl hover:bg-foreground/5 text-foreground/50 transition-colors"
              >
                <X size={18} />
              </button>
              <h3 className="text-xl font-black text-foreground flex items-center gap-2">
                <Sparkles size={18} className="text-primary" />
                تعديل بيانات العميلة
              </h3>
            </div>

            <form onSubmit={handleEditSubmit} className="p-6 space-y-4">
              {errorMsg && (
                <div className="p-4 rounded-2xl bg-red-50 text-red-600 border border-red-100 text-xs font-bold flex items-center gap-2">
                  <AlertTriangle size={16} />
                  {errorMsg}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-black text-foreground/75">اسم العميلة بالكامل <span className="text-primary">*</span></label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-4 py-3 rounded-2xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary text-sm font-semibold transition-all text-right"
                  />
                </div>
                
                <div className="space-y-1.5">
                  <label className="text-xs font-black text-foreground/75">رقم الهاتف <span className="text-primary">*</span></label>
                  <input
                    type="text"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-4 py-3 rounded-2xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary text-sm font-semibold transition-all text-right"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-black text-foreground/75">البريد الإلكتروني (اختياري)</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary text-sm font-semibold transition-all text-right"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-black text-foreground/75">الملاحظات الطبية أو التفضيلات</label>
                <textarea
                  rows={4}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="سجل أية تفضيلات خاصة بالعميلة، الحالة الصحية، أو قيود الاشتراك..."
                  className="w-full px-4 py-3 rounded-2xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary text-sm font-semibold transition-all resize-none leading-relaxed text-right"
                />
              </div>

              <div className="flex gap-3 pt-3 border-t border-border/50">
                <button
                  type="submit"
                  disabled={isPending}
                  className="flex-1 bg-primary hover:bg-primary/95 disabled:bg-primary/50 text-white py-3.5 rounded-2xl font-black text-sm transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
                >
                  {isPending ? "جاري الحفظ..." : "حفظ التعديلات"}
                </button>
                
                <button
                  type="button"
                  onClick={() => setIsEditOpen(false)}
                  className="px-6 py-3.5 bg-background border border-border hover:bg-foreground/5 text-foreground/60 rounded-2xl font-black text-sm transition-all cursor-pointer"
                >
                  إلغاء
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteOpen && (
        <div className="fixed inset-0 bg-foreground/40 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-in fade-in duration-300">
          <div className="bg-card w-full max-w-md rounded-[2.5rem] border border-border shadow-2xl p-6 animate-in zoom-in-95 duration-300 text-right space-y-4">
            
            <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center border border-red-100/50">
              <AlertTriangle size={24} />
            </div>

            <h3 className="text-lg font-black text-foreground">حذف حساب العميلة بشكل نهائي</h3>
            
            {errorMsg && (
              <div className="p-3 rounded-xl bg-red-50 text-red-600 border border-red-100 text-xs font-bold">
                {errorMsg}
              </div>
            )}

            <p className="text-sm text-foreground/60 font-semibold leading-relaxed">
              هل أنتِ متأكدة من رغبتكِ في حذف حساب العميلة <strong className="text-primary">{client.name}</strong>؟ 
              سيقوم هذا الإجراء بحذف جميع سجلات حضورها، اشتراكاتها، وفواتيرها بشكل كامل من قاعدة البيانات. ولا يمكن التراجع عنه.
            </p>

            <div className="flex gap-3 pt-2">
              <button
                onClick={handleDeleteSubmit}
                disabled={isPending}
                className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-red-500/50 text-white py-3.5 rounded-2xl font-black text-xs transition-all shadow-md cursor-pointer"
              >
                {isPending ? "تأكيد الحذف النهائي" : "تأكيد الحذف النهائي"}
              </button>
              
              <button
                onClick={() => setIsDeleteOpen(false)}
                className="flex-1 bg-background border border-border hover:bg-foreground/5 text-foreground/60 py-3.5 rounded-2xl font-black text-xs transition-all cursor-pointer"
              >
                إلغاء
              </button>
            </div>

          </div>
        </div>
      )}

      {/* QR Card Modal */}
      {isQrOpen && (
        <div className="fixed inset-0 bg-foreground/40 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-in fade-in duration-300 print-hidden">
          <div className="bg-card w-full max-w-sm rounded-[2.5rem] border border-border shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 text-right">
            
            <div className="p-6 border-b border-border/50 flex justify-between items-center bg-gradient-to-l from-pink-50/20 to-transparent">
              <button
                onClick={() => setIsQrOpen(false)}
                className="p-2 rounded-xl hover:bg-foreground/5 text-foreground/50 transition-colors"
              >
                <X size={18} />
              </button>
              <h3 className="text-lg font-black text-foreground flex items-center gap-2">
                <span>كارت العضوية</span>
                <Printer size={18} className="text-primary" />
              </h3>
            </div>

            <div className="p-8 flex flex-col items-center justify-center space-y-6">
              
              {/* Card visual wrapper */}
              <div className="w-full bg-background border-2 border-primary/30 p-6 rounded-[2rem] text-center space-y-4 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full blur-xl"></div>
                
                <div className="border-b border-pink-100 pb-3 flex flex-col items-center">
                  <div className="w-10 h-10 bg-pink-50 rounded-full flex items-center justify-center font-black text-primary text-lg mb-1">S</div>
                  <h2 className="text-xs font-black text-slate-800">Soly's Space</h2>
                  <p className="text-[6px] text-primary font-bold tracking-widest">MEMBERSHIP CARD</p>
                </div>

                <div className="flex justify-center p-2 bg-white rounded-xl shadow-inner border border-border/50">
                  {client.qrSvgDataUrl ? (
                    <img src={client.qrSvgDataUrl} alt="QR Code" className="w-40 h-40" />
                  ) : (
                    <div className="w-40 h-40 border-2 border-dashed border-pink-200 flex items-center justify-center text-xs text-foreground/45">QR Code</div>
                  )}
                </div>

                <div className="space-y-1">
                  <h3 className="font-black text-base text-slate-800 leading-none">{client.name}</h3>
                  <p className="text-[10px] text-slate-500 font-semibold mt-1" dir="ltr">{client.phone}</p>
                </div>
              </div>

              {/* Actions */}
              <div className="w-full flex gap-3">
                <button
                  onClick={handlePrintCard}
                  className="flex-1 bg-primary hover:bg-primary-hover text-white py-3.5 rounded-2xl font-black text-xs transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Printer size={14} />
                  طباعة الكارت (A6)
                </button>
                <button
                  onClick={() => setIsQrOpen(false)}
                  className="px-6 py-3.5 bg-background border border-border hover:bg-foreground/5 text-foreground/60 rounded-2xl font-black text-xs transition-all cursor-pointer"
                >
                  إغلاق
                </button>
              </div>

            </div>

          </div>
        </div>
      )}

    </div>
  )
}
