"use client"

import React, { useState, useTransition } from "react"
import { Star, Trash2, Edit3, Plus, X, Search, Sparkles, AlertCircle } from "lucide-react"
import { createTestimonial, updateTestimonial, toggleTestimonialActive, deleteTestimonial } from "@/actions/testimonials"

interface Testimonial {
  id: string
  name: string
  role: string
  content: string
  rating: number
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

interface TestimonialsManagerProps {
  initialTestimonials: Testimonial[]
}

export default function TestimonialsManager({ initialTestimonials }: TestimonialsManagerProps) {
  const [testimonials, setTestimonials] = useState<Testimonial[]>(initialTestimonials)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState<"ALL" | "ACTIVE" | "INACTIVE">("ALL")
  const [isPending, startTransition] = useTransition()
  
  // Modal States
  const [isOpen, setIsOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  
  // Form States
  const [name, setName] = useState("")
  const [role, setRole] = useState("")
  const [content, setContent] = useState("")
  const [rating, setRating] = useState(5)
  const [isActive, setIsActive] = useState(true)
  
  // Confirm Delete Modal State
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)
  
  // Error / Success Message
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)

  // Reset form
  const resetForm = () => {
    setName("")
    setRole("")
    setContent("")
    setRating(5)
    setIsActive(true)
    setEditingId(null)
    setMessage(null)
  }

  const handleOpenAddModal = () => {
    resetForm()
    setIsOpen(true)
  }

  const handleOpenEditModal = (t: Testimonial) => {
    setEditingId(t.id)
    setName(t.name)
    setRole(t.role)
    setContent(t.content)
    setRating(t.rating)
    setIsActive(t.isActive)
    setMessage(null)
    setIsOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name || !role || !content) {
      setMessage({ type: "error", text: "يرجى ملء جميع الحقول المطلوبة." })
      return
    }

    startTransition(async () => {
      if (editingId) {
        // Edit Action
        const res = await updateTestimonial(editingId, { name, role, content, rating, isActive })
        if (res.success && res.testimonial) {
          const updated = res.testimonial as Testimonial
          setTestimonials(prev => prev.map(item => item.id === editingId ? updated : item))
          setIsOpen(false)
          resetForm()
        } else {
          setMessage({ type: "error", text: res.error || "حدث خطأ أثناء التحديث." })
        }
      } else {
        // Create Action
        const res = await createTestimonial({ name, role, content, rating, isActive })
        if (res.success && res.testimonial) {
          const created = res.testimonial as Testimonial
          setTestimonials(prev => [created, ...prev])
          setIsOpen(false)
          resetForm()
        } else {
          setMessage({ type: "error", text: res.error || "حدث خطأ أثناء الإضافة." })
        }
      }
    })
  }

  const handleToggleActive = async (id: string, currentStatus: boolean) => {
    const nextStatus = !currentStatus
    // Optimistic UI Update
    setTestimonials(prev => prev.map(item => item.id === id ? { ...item, isActive: nextStatus } : item))
    
    const res = await toggleTestimonialActive(id, nextStatus)
    if (!res.success) {
      // Revert if failed
      setTestimonials(prev => prev.map(item => item.id === id ? { ...item, isActive: currentStatus } : item))
      alert(res.error || "فشل تعديل حالة التفعيل.")
    }
  }

  const handleDelete = async (id: string) => {
    const res = await deleteTestimonial(id)
    if (res.success) {
      setTestimonials(prev => prev.filter(item => item.id !== id))
      setDeleteConfirmId(null)
    } else {
      alert(res.error || "فشل حذف الرأي.")
    }
  }

  // Filtered Testimonials
  const filteredTestimonials = testimonials.filter(t => {
    const matchesSearch = t.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          t.role.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          t.content.toLowerCase().includes(searchTerm.toLowerCase())
    
    if (filterStatus === "ACTIVE") return matchesSearch && t.isActive
    if (filterStatus === "INACTIVE") return matchesSearch && !t.isActive
    return matchesSearch
  })

  return (
    <div className="space-y-6">
      
      {/* Top Controller Bar */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-card p-6 rounded-[2rem] border border-border shadow-sm">
        
        {/* Search & Filter */}
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto flex-1">
          <div className="relative flex-1 max-w-md">
            <span className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-foreground/40">
              <Search size={18} />
            </span>
            <input
              type="text"
              placeholder="البحث في الآراء..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-4 pr-10 py-3 rounded-2xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary text-sm font-semibold transition-all"
            />
          </div>
          
          <div className="flex bg-background border border-border rounded-2xl p-1 shrink-0">
            <button
              onClick={() => setFilterStatus("ALL")}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${filterStatus === "ALL" ? "bg-primary text-white shadow-md shadow-pink-200/20" : "text-foreground/60 hover:text-foreground"}`}
            >
              الكل
            </button>
            <button
              onClick={() => setFilterStatus("ACTIVE")}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${filterStatus === "ACTIVE" ? "bg-primary text-white shadow-md shadow-pink-200/20" : "text-foreground/60 hover:text-foreground"}`}
            >
              النشطة فقط
            </button>
            <button
              onClick={() => setFilterStatus("INACTIVE")}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${filterStatus === "INACTIVE" ? "bg-primary text-white shadow-md shadow-pink-200/20" : "text-foreground/60 hover:text-foreground"}`}
            >
              غير النشطة
            </button>
          </div>
        </div>
        
        {/* Add Testimonial Button */}
        <button
          onClick={handleOpenAddModal}
          className="w-full md:w-auto bg-[#121212] hover:bg-primary text-white px-6 py-3.5 rounded-2xl font-black text-sm transition-all shadow-md hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-2 group"
        >
          <Plus size={16} className="group-hover:rotate-90 transition-transform duration-300" />
          إضافة رأي جديد
        </button>
      </div>

      {/* Grid of Testimonials */}
      {filteredTestimonials.length === 0 ? (
        <div className="bg-card p-16 rounded-[2rem] border border-border shadow-sm text-center flex flex-col items-center justify-center">
          <div className="w-16 h-16 rounded-2xl bg-pink-50 flex items-center justify-center text-primary mb-4 border border-pink-100/50">
            <AlertCircle size={28} />
          </div>
          <h3 className="text-xl font-black text-foreground mb-1">لا توجد آراء مطابقة</h3>
          <p className="text-foreground/50 text-sm font-semibold max-w-sm">
            لم يتم العثور على أي آراء تطابق خيارات البحث الحالية أو أن قاعدة البيانات فارغة تماماً.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTestimonials.map((t) => (
            <div
              key={t.id}
              className={`bg-card border rounded-[2rem] p-6 shadow-sm flex flex-col justify-between transition-all duration-300 hover:shadow-md hover:border-primary/20 ${t.isActive ? "border-border" : "border-red-200 bg-red-50/10 opacity-75"}`}
            >
              <div>
                {/* Rating & Status */}
                <div className="flex justify-between items-center mb-4">
                  <div className="flex gap-0.5 text-amber-400">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        size={14}
                        fill={i < t.rating ? "currentColor" : "none"}
                        className={i < t.rating ? "text-amber-400" : "text-foreground/20"}
                      />
                    ))}
                  </div>
                  
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase ${t.isActive ? "bg-green-50 text-green-600 border border-green-100" : "bg-red-50 text-red-600 border border-red-100"}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${t.isActive ? "bg-green-500 animate-pulse" : "bg-red-500"}`}></span>
                    {t.isActive ? "نشط بالموقع" : "غير معروض"}
                  </span>
                </div>

                {/* Content */}
                <p className="text-foreground/75 font-semibold text-sm leading-relaxed mb-6 text-right whitespace-pre-line">
                  "{t.content}"
                </p>
              </div>

              {/* Author & Footer actions */}
              <div className="border-t border-border/50 pt-4 flex items-center justify-between">
                
                {/* Actions */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleOpenEditModal(t)}
                    title="تعديل"
                    className="p-2 rounded-xl border border-border bg-background hover:bg-pink-50 hover:text-primary hover:border-primary/30 transition-all text-foreground/60"
                  >
                    <Edit3 size={15} />
                  </button>
                  <button
                    onClick={() => setDeleteConfirmId(t.id)}
                    title="حذف"
                    className="p-2 rounded-xl border border-border bg-background hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-all text-foreground/60"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>

                {/* Info & Toggle */}
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <h5 className="font-black text-foreground text-xs">{t.name}</h5>
                    <p className="text-[9px] text-foreground/45 font-bold mt-0.5">{t.role}</p>
                  </div>
                  
                  {/* Custom Toggle Switch for Active state */}
                  <button
                    onClick={() => handleToggleActive(t.id, t.isActive)}
                    title={t.isActive ? "إيقاف التفعيل" : "تفعيل"}
                    className={`w-11 h-6 rounded-full p-1 transition-all flex items-center ${t.isActive ? "bg-primary justify-start" : "bg-foreground/20 justify-end"}`}
                  >
                    <div className="w-4 h-4 rounded-full bg-card transition-all"></div>
                  </button>
                </div>

              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Modal */}
      {isOpen && (
        <div className="fixed inset-0 bg-[#121212]/40 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-in fade-in duration-300">
          <div className="bg-card w-full max-w-xl rounded-[2.5rem] border border-border shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 text-right">
            
            {/* Modal Header */}
            <div className="p-6 border-b border-border/50 flex justify-between items-center bg-gradient-to-l from-pink-50/20 to-transparent">
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 rounded-xl hover:bg-foreground/5 text-foreground/50 transition-colors"
              >
                <X size={18} />
              </button>
              <h3 className="text-xl font-black text-foreground flex items-center gap-2">
                <Sparkles size={18} className="text-primary" />
                {editingId ? "تعديل رأي عميلة" : "إضافة رأي عميلة جديد"}
              </h3>
            </div>

            {/* Modal Body / Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              
              {message && (
                <div className={`p-4 rounded-2xl text-xs font-bold flex items-center gap-2 ${message.type === "error" ? "bg-red-50 text-red-600 border border-red-100" : "bg-green-50 text-green-600 border border-green-100"}`}>
                  <AlertCircle size={16} />
                  {message.text}
                </div>
              )}

              {/* Name & Role */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5 text-right">
                  <label className="text-xs font-black text-foreground/75">اسم العضوة / الأم <span className="text-primary">*</span></label>
                  <input
                    type="text"
                    required
                    placeholder="مثال: رنا أحمد"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-4 py-3 rounded-2xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary text-sm font-semibold transition-all text-right"
                  />
                </div>
                
                <div className="space-y-1.5 text-right">
                  <label className="text-xs font-black text-foreground/75">الصفة أو الاشتراك <span className="text-primary">*</span></label>
                  <input
                    type="text"
                    required
                    placeholder="مثال: مشتركة في تدريب التزلج"
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="w-full px-4 py-3 rounded-2xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary text-sm font-semibold transition-all text-right"
                  />
                </div>
              </div>

              {/* Rating selection (Stars) */}
              <div className="space-y-1.5 text-right">
                <label className="text-xs font-black text-foreground/75 block">التقييم بالنجوم</label>
                <div className="flex gap-2 items-center justify-end py-1">
                  <span className="text-xs font-black text-foreground/45 mr-3">({rating} من 5)</span>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      className="text-amber-400 hover:scale-110 active:scale-95 transition-all animate-none"
                    >
                      <Star
                        size={28}
                        fill={star <= rating ? "currentColor" : "none"}
                        className={star <= rating ? "text-amber-400" : "text-foreground/20"}
                      />
                    </button>
                  ))}
                </div>
              </div>

              {/* Testimonial Textarea */}
              <div className="space-y-1.5 text-right">
                <label className="text-xs font-black text-foreground/75">نص المراجعة / الرأي <span className="text-primary">*</span></label>
                <textarea
                  required
                  rows={4}
                  placeholder="اكتبِ رأي العضوة بالتفصيل هنا..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary text-sm font-semibold transition-all resize-none leading-relaxed text-right"
                />
              </div>

              {/* Visibility Switch */}
              <div className="flex items-center justify-between bg-background border border-border p-4 rounded-2xl">
                <button
                  type="button"
                  onClick={() => setIsActive(!isActive)}
                  className={`w-11 h-6 rounded-full p-1 transition-all flex items-center ${isActive ? "bg-primary justify-start" : "bg-foreground/20 justify-end"}`}
                >
                  <div className="w-4 h-4 rounded-full bg-card transition-all"></div>
                </button>
                
                <div className="text-right">
                  <h4 className="text-sm font-black text-foreground">تفعيل الظهور مباشرة</h4>
                  <p className="text-[10px] text-foreground/50 font-bold mt-0.5">في حال الإلغاء، سيتم حفظ المراجعة دون عرضها على الموقع.</p>
                </div>
              </div>

              {/* Footer Buttons */}
              <div className="flex gap-3 pt-3 border-t border-border/50">
                <button
                  type="submit"
                  disabled={isPending}
                  className="flex-1 bg-primary hover:bg-primary/90 disabled:bg-primary/50 text-white py-3.5 rounded-2xl font-black text-sm transition-all shadow-md flex items-center justify-center gap-2"
                >
                  {isPending ? "جاري الحفظ..." : editingId ? "حفظ التعديلات" : "إضافة الرأي"}
                </button>
                
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="px-6 py-3.5 bg-background border border-border hover:bg-foreground/5 text-foreground/60 rounded-2xl font-black text-sm transition-all"
                >
                  إلغاء
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 bg-[#121212]/40 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-in fade-in duration-300">
          <div className="bg-card w-full max-w-md rounded-[2.5rem] border border-border shadow-2xl p-6 animate-in zoom-in-95 duration-300 text-right">
            
            <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center mb-4 border border-red-100/50">
              <AlertCircle size={24} />
            </div>

            <h3 className="text-lg font-black text-foreground mb-2">تأكيد حذف رأي العميلة</h3>
            <p className="text-sm text-foreground/60 font-semibold leading-relaxed mb-6">
              هل أنتِ متأكدة من رغبتكِ في حذف هذه المراجعة نهائياً؟ لا يمكن التراجع عن هذا الإجراء بعد تنفيذه.
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => handleDelete(deleteConfirmId)}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white py-3 rounded-2xl font-black text-xs transition-all shadow-md"
              >
                تأكيد الحذف
              </button>
              
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="flex-1 bg-background border border-border hover:bg-foreground/5 text-foreground/60 py-3 rounded-2xl font-black text-xs transition-all"
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
