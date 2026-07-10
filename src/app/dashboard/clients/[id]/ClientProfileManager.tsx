"use client"

import React, { useState, useTransition } from "react"
import { Phone, Mail, FileText, Calendar, Clock, ArrowRight, Edit3, Trash2, X, AlertTriangle, Sparkles, CheckCircle } from "lucide-react"
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

  return (
    <div className="space-y-8 text-right">
      
      {/* Top Navigation & Action Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        
        {/* Actions (Edit / Delete) */}
        <div className="flex items-center gap-3 w-full sm:w-auto order-1 sm:order-2">
          {canEdit && (
            <button
              onClick={() => setIsEditOpen(true)}
              className="flex-1 sm:flex-initial bg-foreground hover:bg-primary text-white px-5 py-3 rounded-2xl font-black text-sm transition-all shadow-sm hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
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
      <div className="bg-card p-8 rounded-[2.5rem] border border-border shadow-sm relative overflow-hidden flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
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
            <h2 className="text-3xl font-extrabold text-foreground">{client.name}</h2>
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

      {/* Client Notes Card (Visual Upgrade) */}
      <div className="bg-card p-6 md:p-8 rounded-[2.5rem] border border-border shadow-sm text-right space-y-4">
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
            لا توجد ملاحظات مسجلة للعميلة حالياً. يمكنك تعديل الحساب لإضافة معلومات تفصيلية (مثل التفضيلات، الوجبات المفضلة، أو الإعفاءات الطبية).
          </p>
        )}
      </div>

      {/* Enrollments & Attendance Logs */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Enrollments */}
        <div className="space-y-6">
          <h3 className="text-xl font-black text-foreground flex items-center justify-end gap-2">
            سجل الحجوزات والاشتراكات
            <Sparkles size={20} className="text-primary" />
          </h3>
          
          <div className="bg-card rounded-[2.5rem] shadow-sm border border-border overflow-hidden p-6 space-y-4">
            {client.enrollments.length === 0 ? (
              <p className="text-center text-foreground/45 font-semibold py-8">لا توجد حجوزات سابقة أو حالية.</p>
            ) : (
              client.enrollments.map((enr: any) => {
                const item = enr.program || enr.workshop || enr.event;
                if (!item) return null;

                return (
                  <div key={enr.id} className={`p-5 rounded-3xl border flex items-center justify-between gap-4 ${enr.status === 'CONFIRMED' ? 'border-primary/30 bg-pink-50/5' : 'border-border bg-background/50'}`}>
                    <div className="text-left shrink-0">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black border ${
                        enr.status === 'CONFIRMED' ? 'bg-green-50 text-green-600 border-green-100' :
                        enr.status === 'PENDING' ? 'bg-orange-50 text-orange-600 border-orange-100' :
                        'bg-red-50 text-red-600 border-red-100'
                      }`}>
                        {enr.status === 'CONFIRMED' ? 'مؤكد ودفع' : enr.status === 'PENDING' ? 'قيد الانتظار' : 'ملغي'}
                      </span>
                      <p className="text-xs font-semibold text-foreground/40 mt-1.5">
                        {new Date(enr.createdAt).toLocaleDateString('ar-EG')}
                      </p>
                    </div>

                    <div className="text-right">
                      <h4 className="font-black text-base text-foreground">{item.name}</h4>
                      <p className="text-xs font-semibold text-foreground/50 mt-1">
                        نوع الاشتراك: <span className="font-bold">{enr.program ? "برنامج" : enr.workshop ? "ورشة عمل" : "حفلة"}</span>
                      </p>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>

        {/* Attendances */}
        <div className="space-y-6">
          <h3 className="text-xl font-black text-foreground flex items-center justify-end gap-2">
            سجل الحضور الفعلي والتعويض
            <Clock size={20} className="text-primary" />
          </h3>
          
          <div className="bg-card rounded-[2.5rem] shadow-sm border border-border overflow-hidden">
            {client.enrollments.flatMap((e: any) => e.attendances).length === 0 ? (
              <p className="text-center text-foreground/45 font-semibold p-12">لم تقم العميلة بتسجيل حضور فعلي بعد.</p>
            ) : (
              <div className="divide-y divide-border">
                {client.enrollments.flatMap((e: any) => e.attendances.map((a: any) => ({...a, enrollment: e}))).sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).map((att: any) => {
                  const item = att.enrollment.program || att.enrollment.workshop || att.enrollment.event
                  if (!item) return null
                  return (
                    <div key={att.id} className="p-5 flex items-center justify-between hover:bg-muted/10 transition-colors">
                      <span className={`px-3 py-1 rounded-xl text-xs font-black border ${
                        att.isMakeup ? 'bg-amber-50 text-amber-600 border-amber-100' : 'bg-green-50 text-green-600 border-green-100'
                      }`}>
                        {att.isMakeup ? 'حصة تعويضية' : 'حضور أساسي'}
                      </span>
                      
                      <div className="text-right">
                        <p className="font-black text-sm text-foreground">{item.name}</p>
                        <p className="text-[10px] font-semibold text-foreground/40 mt-1">
                          {new Date(att.date).toLocaleString('ar-EG', { weekday: 'long', year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>

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
                {isPending ? "جاري الحذف..." : "تأكيد الحذف النهائي"}
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

    </div>
  )
}
