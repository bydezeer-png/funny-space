"use client"

import { useState } from "react"
import { confirmEnrollment, cancelEnrollment, recordAttendance, addPayment } from "@/actions/enrollments"
import { 
  CheckCircle, 
  XCircle, 
  UserCheck, 
  CalendarDays, 
  PartyPopper, 
  Calendar, 
  Banknote, 
  MessageCircle, 
  Clock, 
  ShieldCheck, 
  Sparkles,
  Phone
} from "lucide-react"
import { useConfirm, usePrompt } from "@/components/ConfirmProvider"
import { toast } from "sonner"

export default function ReceptionManager({ 
  initialEnrollments,
  canBook = true,
  canConfirm = true,
  canCancel = true,
  canRecordAttendance = true
}: any) {
  const [enrollments, setEnrollments] = useState<any[]>(initialEnrollments)
  
  const showPendingTab = canBook || canConfirm
  const showConfirmedTab = canRecordAttendance || canCancel || canConfirm

  const [activeTab, setActiveTab] = useState<"pending" | "confirmed">(
    showPendingTab ? "pending" : "confirmed"
  )
  const [loading, setLoading] = useState<string | null>(null)
  const [paymentMethod, setPaymentMethod] = useState("CASH")
  const confirm = useConfirm()
  const prompt = usePrompt()

  const pending = enrollments.filter(e => e.status === "PENDING")
  const confirmed = enrollments.filter(e => e.status === "CONFIRMED")

  const handleConfirm = async (id: string, totalAmount: number) => {
    const rawAmount = await prompt(`تأكيد دفع الحجز وإصدار الفاتورة؟\nأدخل المبلغ المدفوع حالياً (الإجمالي: ${totalAmount}):`, totalAmount.toString())
    if(rawAmount !== null) {
      const amountPaid = parseFloat(rawAmount)
      if(isNaN(amountPaid) || amountPaid < 0) return toast.error("مبلغ غير صحيح")
      setLoading(id)
      try {
        await confirmEnrollment(id, paymentMethod, totalAmount, amountPaid)
        toast.success("تم تأكيد الحجز بنجاح")
        window.location.reload()
      } catch (err: any) {
        toast.error(err.message || "حدث خطأ أثناء تأكيد الحجز")
        setLoading(null)
      }
    }
  }

  const handlePayRemaining = async (id: string, remaining: number) => {
    const rawAmount = await prompt(`كم تريد أن تدفع الآن؟\nالمبلغ المتبقي: ${remaining}`, remaining.toString())
    if(rawAmount !== null) {
      const amountPaid = parseFloat(rawAmount)
      if(isNaN(amountPaid) || amountPaid <= 0 || amountPaid > remaining) return toast.error("مبلغ غير صحيح")
      setLoading(`pay-${id}`)
      try {
        await addPayment(id, amountPaid)
        toast.success("تم الدفع بنجاح")
        window.location.reload()
      } catch (err: any) {
        toast.error(err.message || "حدث خطأ أثناء سداد المبلغ")
        setLoading(null)
      }
    }
  }

  const handleCancel = async (id: string) => {
    const ok = await confirm("هل أنت متأكد من إلغاء الحجز؟")
    if(ok) {
      setLoading(id)
      try {
        await cancelEnrollment(id)
        toast.success("تم إلغاء الحجز")
        window.location.reload()
      } catch (err: any) {
        toast.error(err.message || "حدث خطأ أثناء إلغاء الحجز")
        setLoading(null)
      }
    }
  }

  const handleAttendance = async (id: string, isMakeup: boolean = false) => {
    try {
      setLoading(`att-${id}`)
      await recordAttendance(id, isMakeup)
      toast.success("تم تسجيل الحضور")
      window.location.reload()
    } catch (err: any) {
      toast.error(err.message)
      setLoading(null)
    }
  }

  const getServiceDetails = (e: any) => {
    if (e.program) return { 
      type: "برنامج تدريبي", 
      name: `${e.program.name} ${e.option ? '- ' + e.option.name : ''}`, 
      price: e.option ? e.option.price : 0, 
      icon: <CalendarDays size={14}/>, 
      color: "text-pink-600 bg-pink-50 border-pink-100" 
    }
    if (e.workshop) return { type: "ورشة تدريبية", name: e.workshop.name, price: e.workshop.price, icon: <Calendar size={14}/>, color: "text-orange-600 bg-orange-50 border-orange-100" }
    if (e.event) return { type: "فعالية / حفلة", name: e.event.name, price: e.event.price, icon: <PartyPopper size={14}/>, color: "text-purple-600 bg-purple-50 border-purple-100" }
    return { type: "خدمة مجهولة", name: "غير محدد", price: 0, icon: null, color: "text-gray-500 bg-muted/30 border-gray-100" }
  }

  return (
    <div className="space-y-8">
      
      {/* Premium Segmented Tab Controller */}
      <div className="bg-[#FFF5F8] border border-pink-100/50 p-1.5 rounded-2xl flex w-max gap-2 shadow-inner">
        {showPendingTab && (
          <button 
            onClick={() => setActiveTab("pending")}
            className={`px-6 py-3 rounded-xl font-black text-sm transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'pending' 
                ? 'bg-card text-primary shadow-sm border border-pink-100/40' 
                : 'text-foreground/50 hover:text-foreground border border-transparent'
            }`}
          >
            <Clock size={16} />
            حجوزات بانتظار الدفع 
            <span className="bg-orange-500 text-white text-[10px] px-2 py-0.5 rounded-full font-bold">{pending.length}</span>
          </button>
        )}
        {showConfirmedTab && (
          <button 
            onClick={() => setActiveTab("confirmed")}
            className={`px-6 py-3 rounded-xl font-black text-sm transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'confirmed' 
                ? 'bg-card text-primary shadow-sm border border-pink-100/40' 
                : 'text-foreground/50 hover:text-foreground border border-transparent'
            }`}
          >
            <ShieldCheck size={16} />
            الاشتراكات الفعالة 
            <span className="bg-green-500 text-white text-[10px] px-2 py-0.5 rounded-full font-bold">{confirmed.length}</span>
          </button>
        )}
      </div>

      {/* Booking Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {(activeTab === 'pending' ? pending : confirmed).map(e => {
          const service = getServiceDetails(e)
          const remaining = (e.totalAmount || service.price) - (e.amountPaid || 0)
          const clientLetter = e.client.name.trim().charAt(0) || "ع"

          return (
            <div 
              key={e.id} 
              className="bg-card border border-pink-100/50 rounded-[2rem] p-6 shadow-sm hover:shadow-[0_12px_45px_rgba(236,72,153,0.06)] hover:border-primary/20 transition-all duration-300 flex flex-col justify-between relative group"
            >
              
              <div>
                
                {/* Card Header (Client Profile with Quick WhatsApp Button) */}
                <div className="flex items-center justify-between border-b border-pink-50 pb-4 mb-4 gap-3">
                  <div className="flex items-center gap-3">
                    {/* User Avatar Circle */}
                    <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-primary/10 to-pink-500/10 text-primary flex items-center justify-center font-black border border-pink-100 shadow-inner select-none shrink-0">
                      {clientLetter}
                    </div>
                    
                    <div className="text-right">
                      <h4 className="font-black text-foreground leading-tight text-base group-hover:text-primary transition-colors">
                        {e.client.name}
                      </h4>
                      <p className="text-foreground/45 font-semibold text-xs mt-1 flex items-center gap-1">
                        <Phone size={10} className="text-primary" /> {e.client.phone}
                      </p>
                    </div>
                  </div>

                  {/* WhatsApp Quick Message Action */}
                  <a 
                    href={`https://wa.me/20${e.client.phone.replace(/^0/, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2.5 bg-green-50 text-green-600 hover:bg-green-600 hover:text-white rounded-xl border border-green-100 shadow-sm transition-all duration-200"
                    title="مراسلة عبر واتساب"
                  >
                    <MessageCircle size={16} />
                  </a>
                </div>

                {/* Service Details & Meta */}
                <div className="flex justify-between items-center mb-3">
                  <span className={`text-[10px] font-black px-3 py-1 rounded-full border flex items-center gap-1.5 shadow-sm ${service.color}`}>
                    {service.icon} {service.type}
                  </span>
                  <span className="text-[10px] text-foreground/45 font-bold">
                    📅 {new Date(e.createdAt).toLocaleDateString('ar-EG', { day: 'numeric', month: 'short' })}
                  </span>
                </div>

                {/* Service Info Box */}
                <div className="bg-[#FFF5F8]/60 border border-pink-100/30 rounded-2xl p-4 mb-4">
                  <p className="font-black text-foreground text-sm leading-snug mb-1.5">{service.name}</p>
                  <div className="flex justify-between items-baseline">
                    <span className="text-[10px] font-bold text-foreground/40">سعر الخدمة</span>
                    <span className="text-primary font-black text-lg">{service.price} ج.م</span>
                  </div>
                </div>

                {/* Active Subscriptions Attendance progress */}
                {activeTab === 'confirmed' && e.program && (
                  <div className="mb-4 space-y-2 bg-pink-50/5 border border-pink-100/25 p-3 rounded-2xl">
                    <div className="flex justify-between items-center text-xs font-bold text-foreground/60">
                      <span>حضور الحصص: {e.attendances.length} من {e.option?.sessionsPerMonth || 8}</span>
                      <span className="text-primary">{Math.min(100, Math.round((e.attendances.length / (e.option?.sessionsPerMonth || 8)) * 100))}%</span>
                    </div>
                    <div className="w-full bg-[#FFF5F8] rounded-full h-2 border border-pink-100/35 overflow-hidden">
                      <div 
                        className="bg-green-500 h-full rounded-full transition-all duration-500" 
                        style={{width: `${Math.min(100, (e.attendances.length / (e.option?.sessionsPerMonth || 8)) * 100)}%`}}
                      ></div>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Card Footer controls */}
              <div className="border-t border-pink-50 pt-4 mt-auto space-y-3">
                {activeTab === 'pending' ? (
                  /* Pending Reservation Options */
                  <div className="space-y-3">
                    {canConfirm && (
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black text-foreground/50 shrink-0">طريقة الدفع:</span>
                        <select 
                          value={paymentMethod} 
                          onChange={(ev) => setPaymentMethod(ev.target.value)} 
                          className="w-full bg-[#FFF5F8] border border-pink-100/50 rounded-xl px-3 py-2 text-xs font-bold outline-none focus:border-primary transition-all cursor-pointer"
                        >
                          <option value="CASH">دفع نقدي (كاش)</option>
                          <option value="POS">دفع بالفيزا (POS)</option>
                        </select>
                      </div>
                    )}

                    <div className="flex gap-2">
                      {canConfirm && (
                        <button 
                          onClick={() => handleConfirm(e.id, service.price)}
                          disabled={loading === e.id}
                          className="flex-1 bg-green-500 hover:bg-green-600 text-white py-3 rounded-xl font-black text-xs flex items-center justify-center gap-1.5 shadow-md shadow-green-200/5 hover:scale-[1.02] active:scale-95 transition-all cursor-pointer"
                        >
                          <CheckCircle size={15} /> 
                          {loading === e.id ? 'جاري التأكيد...' : 'تأكيد ودفع'}
                        </button>
                      )}
                      
                      {canCancel && (
                        <button 
                          onClick={() => handleCancel(e.id)}
                          disabled={loading === e.id}
                          className="px-4.5 bg-red-50 text-red-500 hover:bg-red-500 hover:text-white py-3 rounded-xl font-black text-xs flex items-center justify-center border border-red-100 transition-all active:scale-95 cursor-pointer"
                          title="إلغاء الحجز"
                        >
                          <XCircle size={15} />
                        </button>
                      )}
                    </div>
                  </div>
                ) : (
                  /* Active Subscription Options & Financials */
                  <div className="space-y-3">
                    {/* Financial Status Summary */}
                    <div className="flex justify-between items-center text-xs font-bold bg-[#FFF5F8]/60 p-3 rounded-2xl border border-pink-100/25">
                      <div className="text-foreground/55">
                        المدفوع: <span className="text-green-600 font-black">{e.amountPaid || 0} ج.م</span>
                      </div>
                      <div className="text-foreground/55">
                        {remaining > 0 ? (
                          <>
                            المتبقي: <span className="text-red-500 font-black">{remaining} ج.م</span>
                          </>
                        ) : (
                          <span className="text-green-600 font-black flex items-center gap-1">
                            ✓ مكتمل الدفع
                          </span>
                        )}
                      </div>
                    </div>
                    
                    {/* Pay Remaining Button */}
                    {remaining > 0 && canConfirm && (
                      <button 
                        onClick={() => handlePayRemaining(e.id, remaining)}
                        disabled={loading === `pay-${e.id}`}
                        className="w-full bg-pink-50 hover:bg-primary hover:text-white text-primary py-2.5 rounded-xl font-black text-xs transition-all flex items-center justify-center gap-1.5 border border-pink-100 active:scale-95 cursor-pointer"
                      >
                        <Banknote size={14} />
                        {loading === `pay-${e.id}` ? "جاري التسجيل..." : "سداد المبلغ المتبقي"}
                      </button>
                    )}

                    {/* Attendance Recording Row */}
                    {canRecordAttendance && (
                      <div className="flex gap-2">
                        <button 
                          onClick={() => handleAttendance(e.id, false)}
                          disabled={loading === `att-${e.id}`}
                          className="flex-1 bg-[#121212] hover:bg-primary text-white py-3 rounded-xl font-black text-xs flex items-center justify-center gap-1.5 shadow-sm active:scale-95 transition-all cursor-pointer"
                        >
                          <UserCheck size={15} /> تسجيل حضور
                        </button>
                        
                        {e.program && (
                          <button 
                            onClick={() => handleAttendance(e.id, true)}
                            disabled={loading === `att-${e.id}`}
                            className="flex-1 bg-orange-500 hover:bg-orange-600 text-white py-3 rounded-xl font-black text-xs flex items-center justify-center gap-1.5 shadow-sm active:scale-95 transition-all cursor-pointer"
                            title="تسجيل حصة تعويضية"
                          >
                             حضور تعويض
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>

            </div>
          )
        })}
      </div>
      
      {/* Empty State */}
      {(activeTab === 'pending' ? pending : confirmed).length === 0 && (
        <div className="text-center py-24 bg-[#FFF5F8]/40 border border-dashed border-pink-100 rounded-[2.5rem] max-w-xl mx-auto">
          <div className="w-16 h-16 rounded-full bg-pink-50/50 flex items-center justify-center mx-auto mb-4 border border-pink-100/30">
            <Sparkles size={24} className="text-primary/45" />
          </div>
          <h4 className="text-lg font-black text-foreground mb-1">القسم فارغ حالياً</h4>
          <p className="text-xs text-foreground/45 font-bold">لا توجد حجوزات أو اشتراكات نشطة مسجلة في هذا التبويب.</p>
        </div>
      )}
    </div>
  )
}
