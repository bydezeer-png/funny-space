"use client"

import { useState } from "react"
import { createWorkshop, updateWorkshop, deleteWorkshop, createEvent, updateEvent, deleteEvent } from "@/actions/events"
import { Plus, Edit, Trash2, CalendarDays, Users, PartyPopper, Calendar, Save, X, User, Clock, Sparkles } from "lucide-react"
import { useConfirm } from "@/components/ConfirmProvider"
import { toast } from "sonner"

export default function EventsManager({ 
  initialWorkshops, 
  initialEvents,
  canManageWorkshops = true,
  canManageEvents = true
}: any) {
  const [workshops, setWorkshops] = useState<any[]>(initialWorkshops)
  const [events, setEvents] = useState<any[]>(initialEvents)
  
  const [activeTab, setActiveTab] = useState<"workshops" | "events">(
    canManageWorkshops ? "workshops" : "events"
  )
  
  // Forms state
  const [isEditing, setIsEditing] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const confirm = useConfirm()

  // Workshop Form
  const [workshopForm, setWorkshopForm] = useState({
    name: "",
    description: "",
    instructor: "",
    price: "",
    startDate: "",
    endDate: "",
    capacity: "20"
  })

  // Event Form
  const [eventForm, setEventForm] = useState({
    name: "",
    description: "",
    price: "",
    date: "",
    capacity: "50"
  })

  const resetForms = () => {
    setIsEditing(false)
    setEditingId(null)
    setWorkshopForm({ name: "", description: "", instructor: "", price: "", startDate: "", endDate: "", capacity: "20" })
    setEventForm({ name: "", description: "", price: "", date: "", capacity: "50" })
  }

  const handleEditWorkshop = (w: any) => {
    setEditingId(w.id)
    setWorkshopForm({
      name: w.name,
      description: w.description || "",
      instructor: w.instructor || "",
      price: w.price.toString(),
      startDate: new Date(w.startDate).toISOString().slice(0, 16),
      endDate: new Date(w.endDate).toISOString().slice(0, 16),
      capacity: w.capacity.toString()
    })
    setIsEditing(true)
  }

  const handleEditEvent = (e: any) => {
    setEditingId(e.id)
    setEventForm({
      name: e.name,
      description: e.description || "",
      price: e.price.toString(),
      date: new Date(e.date).toISOString().slice(0, 16),
      capacity: e.capacity.toString()
    })
    setIsEditing(true)
  }

  const handleSubmitWorkshop = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    const data = {
      name: workshopForm.name,
      description: workshopForm.description,
      instructor: workshopForm.instructor,
      price: parseFloat(workshopForm.price),
      startDate: new Date(workshopForm.startDate),
      endDate: new Date(workshopForm.endDate),
      capacity: parseInt(workshopForm.capacity)
    }

    try {
      if (editingId) {
        await updateWorkshop(editingId, data)
        toast.success("تم تحديث الورشة بنجاح")
      } else {
        await createWorkshop(data)
        toast.success("تم إضافة الورشة بنجاح")
      }
      window.location.reload()
    } catch (err: any) {
      toast.error(err.message || "حدث خطأ أثناء حفظ الورشة")
      setLoading(false)
    }
  }

  const handleSubmitEvent = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    const data = {
      name: eventForm.name,
      description: eventForm.description,
      price: parseFloat(eventForm.price),
      date: new Date(eventForm.date),
      capacity: parseInt(eventForm.capacity)
    }

    try {
      if (editingId) {
        await updateEvent(editingId, data)
        toast.success("تم تحديث الفعالية بنجاح")
      } else {
        await createEvent(data)
        toast.success("تم إضافة الفعالية بنجاح")
      }
      window.location.reload()
    } catch (err: any) {
      toast.error(err.message || "حدث خطأ أثناء حفظ الفعالية")
      setLoading(false)
    }
  }

  const handleDeleteWorkshop = async (id: string) => {
    const ok = await confirm("هل أنت متأكد من حذف الورشة؟ سيتم إزالة جميع الاشتراكات المسجلة بها.")
    if(ok) {
      try {
        await deleteWorkshop(id)
        toast.success("تم حذف الورشة بنجاح")
        window.location.reload()
      } catch (err: any) {
        toast.error(err.message || "حدث خطأ أثناء حذف الورشة")
      }
    }
  }

  const handleDeleteEvent = async (id: string) => {
    const ok = await confirm("هل أنت متأكد من حذف الحفلة؟ سيتم إزالة جميع التذاكر المحجوزة لها.")
    if(ok) {
      try {
        await deleteEvent(id)
        toast.success("تم حذف الحفلة بنجاح")
        window.location.reload()
      } catch (err: any) {
        toast.error(err.message || "حدث خطأ أثناء حذف الحفلة")
      }
    }
  }

  return (
    <div className="space-y-8">
      
      {/* Header and Switch Controller */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 animate-in fade-in duration-500">
        {/* Segmented Controller */}
        <div className="bg-[#FFF5F8] border border-pink-100/50 p-1.5 rounded-2xl flex w-max gap-2 shadow-inner">
          {canManageWorkshops && (
            <button 
              onClick={() => { setActiveTab("workshops"); resetForms() }}
              className={`px-6 py-3 rounded-xl font-black text-sm transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === 'workshops' 
                  ? 'bg-card text-primary shadow-sm border border-pink-100/40' 
                  : 'text-foreground/50 hover:text-foreground border border-transparent'
              }`}
            >
              <CalendarDays size={16} />
              ورش العمل (Workshops)
              <span className="bg-primary text-white text-[10px] px-2 py-0.5 rounded-full font-bold">{workshops.length}</span>
            </button>
          )}
          {canManageEvents && (
            <button 
              onClick={() => { setActiveTab("events"); resetForms() }}
              className={`px-6 py-3 rounded-xl font-black text-sm transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === 'events' 
                  ? 'bg-card text-primary shadow-sm border border-pink-100/40' 
                  : 'text-foreground/50 hover:text-foreground border border-transparent'
              }`}
            >
              <PartyPopper size={16} />
              الحفلات والفعاليات (Events)
              <span className="bg-primary/20 text-primary text-[10px] px-2 py-0.5 rounded-full font-bold">{events.length}</span>
            </button>
          )}
        </div>

        {/* Add Actions */}
        {((activeTab === 'workshops' && canManageWorkshops) || (activeTab === 'events' && canManageEvents)) && (
          <button 
            onClick={() => setIsEditing(true)} 
            className="bg-primary hover:bg-primary/95 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-all hover:scale-[1.02] active:scale-95 shadow-md shadow-pink-100/30 cursor-pointer"
          >
            <Plus size={20} />
            {activeTab === 'workshops' ? 'إضافة ورشة جديدة' : 'إضافة حفلة جديدة'}
          </button>
        )}
      </div>

      {/* WORKSHOPS TAB LIST */}
      {activeTab === 'workshops' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in duration-500">
          {workshops.map(w => {
            const enrollmentsCount = w._count?.enrollments || 0
            const capacity = w.capacity || 1
            const percentage = Math.min(100, Math.round((enrollmentsCount / capacity) * 100))
            
            return (
              <div 
                key={w.id} 
                className="bg-card border border-pink-100/50 rounded-[2.5rem] p-6 shadow-sm hover:shadow-[0_12px_45px_rgba(236,72,153,0.06)] hover:border-primary/20 transition-all duration-300 flex flex-col justify-between relative group"
              >
                <div>
                  {/* Category and Controls */}
                  <div className="flex justify-between items-start mb-4 gap-2">
                    <span className="text-[10px] font-black bg-pink-50 text-primary border border-pink-100/55 px-3 py-1 rounded-full shadow-sm flex items-center gap-1">
                      <Calendar size={11} /> ورشة تدريبية
                    </span>
                    {canManageWorkshops && (
                      <div className="flex gap-1.5 opacity-80 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => handleEditWorkshop(w)} 
                          className="p-2 text-blue-600 bg-blue-50 hover:bg-blue-100 border border-blue-100/50 rounded-xl transition-all cursor-pointer"
                          title="تعديل"
                        >
                          <Edit size={14}/>
                        </button>
                        <button 
                          onClick={() => handleDeleteWorkshop(w.id)} 
                          className="p-2 text-red-500 bg-red-50 hover:bg-red-500 hover:text-white border border-red-100/50 rounded-xl transition-all cursor-pointer"
                          title="حذف"
                        >
                          <Trash2 size={14}/>
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Title and Instructor */}
                  <h3 className="text-xl font-black text-foreground mb-1 group-hover:text-primary transition-colors leading-snug">
                    {w.name}
                  </h3>
                  
                  <div className="flex items-center gap-1 text-xs font-bold text-foreground/50 mb-4">
                    <User size={13} className="text-primary" />
                    <span>المدربة: <span className="text-foreground/70 font-extrabold">{w.instructor || "غير محدد"}</span></span>
                  </div>

                  {w.description && (
                    <p className="text-xs text-foreground/50 font-semibold mb-4 line-clamp-2">
                      {w.description}
                    </p>
                  )}

                  {/* Seat Tracker progress */}
                  <div className="space-y-1.5 my-4 bg-pink-50/10 border border-pink-100/20 p-3 rounded-2xl">
                    <div className="flex justify-between items-center text-[11px] font-bold text-foreground/60">
                      <span className="flex items-center gap-1">
                        <Users size={12} className="text-primary"/>
                        المقاعد المحجوزة: {enrollmentsCount} من {capacity}
                      </span>
                      <span className="text-primary">{percentage}%</span>
                    </div>
                    <div className="w-full bg-[#FFF5F8] rounded-full h-2 border border-pink-100/35 overflow-hidden">
                      <div 
                        className="bg-primary h-full rounded-full transition-all duration-500" 
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Dates Box */}
                  <div className="text-[10px] bg-[#FFF5F8]/60 border border-pink-100/10 rounded-2xl p-3 space-y-1.5 mb-4 font-bold text-foreground/60">
                    <div className="flex justify-between">
                      <span>تبدأ:</span>
                      <span className="text-foreground" dir="ltr">{new Date(w.startDate).toLocaleString('ar-EG', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>تنتهي:</span>
                      <span className="text-foreground" dir="ltr">{new Date(w.endDate).toLocaleString('ar-EG', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  </div>
                </div>

                {/* Footer Pricing */}
                <div className="border-t border-pink-50 pt-4 mt-auto flex justify-between items-center">
                  <span className="text-xs font-bold text-foreground/40">سعر الاشتراك</span>
                  <span className="text-xl font-black text-primary">{w.price} ج.م</span>
                </div>
              </div>
            )
          })}

          {workshops.length === 0 && (
            <div className="col-span-full text-center py-24 bg-[#FFF5F8]/40 border border-dashed border-pink-100 rounded-[2.5rem] max-w-xl mx-auto">
              <div className="w-16 h-16 rounded-full bg-pink-50/50 flex items-center justify-center mx-auto mb-4 border border-pink-100/30">
                <Sparkles size={24} className="text-primary/45" />
              </div>
              <h4 className="text-lg font-black text-foreground mb-1">لا توجد ورش عمل حالياً</h4>
              <p className="text-xs text-foreground/45 font-bold">يمكنك إنشاء أول ورشة تدريبية بالضغط على الزر أعلاه.</p>
            </div>
          )}
        </div>
      )}

      {/* EVENTS TAB LIST */}
      {activeTab === 'events' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in duration-500">
          {events.map(e => {
            const enrollmentsCount = e._count?.enrollments || 0
            const capacity = e.capacity || 1
            const percentage = Math.min(100, Math.round((enrollmentsCount / capacity) * 100))

            return (
              <div 
                key={e.id} 
                className="bg-card border border-pink-100/50 rounded-[2.5rem] p-6 shadow-sm hover:shadow-[0_12px_45px_rgba(236,72,153,0.06)] hover:border-primary/20 transition-all duration-300 flex flex-col justify-between relative group"
              >
                <div>
                  {/* Category and Controls */}
                  <div className="flex justify-between items-start mb-4 gap-2">
                    <span className="text-[10px] font-black bg-pink-50 text-primary border border-pink-100/55 px-3 py-1 rounded-full shadow-sm flex items-center gap-1">
                      <PartyPopper size={11} /> حفلة / فعالية
                    </span>
                    {canManageEvents && (
                      <div className="flex gap-1.5 opacity-80 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => handleEditEvent(e)} 
                          className="p-2 text-blue-600 bg-blue-50 hover:bg-blue-100 border border-blue-100/50 rounded-xl transition-all cursor-pointer"
                          title="تعديل"
                        >
                          <Edit size={14}/>
                        </button>
                        <button 
                          onClick={() => handleDeleteEvent(e.id)} 
                          className="p-2 text-red-500 bg-red-50 hover:bg-red-500 hover:text-white border border-red-100/50 rounded-xl transition-all cursor-pointer"
                          title="حذف"
                        >
                          <Trash2 size={14}/>
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Title */}
                  <h3 className="text-xl font-black text-foreground mb-2 group-hover:text-primary transition-colors leading-snug">
                    {e.name}
                  </h3>
                  
                  {e.description && (
                    <p className="text-xs text-foreground/50 font-semibold mb-4 line-clamp-2">
                      {e.description}
                    </p>
                  )}

                  {/* Seat Tracker progress */}
                  <div className="space-y-1.5 my-4 bg-pink-50/10 border border-pink-100/20 p-3 rounded-2xl">
                    <div className="flex justify-between items-center text-[11px] font-bold text-foreground/60">
                      <span className="flex items-center gap-1">
                        <Users size={12} className="text-primary"/>
                        التذاكر المحجوزة: {enrollmentsCount} من {capacity}
                      </span>
                      <span className="text-primary">{percentage}%</span>
                    </div>
                    <div className="w-full bg-[#FFF5F8] rounded-full h-2 border border-pink-100/35 overflow-hidden">
                      <div 
                        className="bg-primary h-full rounded-full transition-all duration-500" 
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Timing Box */}
                  <div className="text-[10px] bg-[#FFF5F8]/60 border border-pink-100/10 rounded-2xl p-3 space-y-1.5 mb-4 font-bold text-foreground/60">
                    <div className="flex justify-between items-center">
                      <span className="flex items-center gap-1"><Calendar size={12} /> التاريخ:</span>
                      <span className="text-foreground">{new Date(e.date).toLocaleDateString('ar-EG', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="flex items-center gap-1"><Clock size={12} /> الساعة:</span>
                      <span className="text-foreground">{new Date(e.date).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  </div>
                </div>

                {/* Footer Pricing */}
                <div className="border-t border-pink-50 pt-4 mt-auto flex justify-between items-center">
                  <span className="text-xs font-bold text-foreground/40">سعر التذكرة</span>
                  <span className="text-xl font-black text-primary">{e.price} ج.م</span>
                </div>
              </div>
            )
          })}

          {events.length === 0 && (
            <div className="col-span-full text-center py-24 bg-[#FFF5F8]/40 border border-dashed border-pink-100 rounded-[2.5rem] max-w-xl mx-auto">
              <div className="w-16 h-16 rounded-full bg-pink-50/50 flex items-center justify-center mx-auto mb-4 border border-pink-100/30">
                <Sparkles size={24} className="text-primary/45" />
              </div>
              <h4 className="text-lg font-black text-foreground mb-1">لا توجد حفلات مسجلة حالياً</h4>
              <p className="text-xs text-foreground/45 font-bold">يمكنك إضافة حفلة أو فعالية جديدة بالضغط على الزر أعلاه.</p>
            </div>
          )}
        </div>
      )}

      {/* MODERN OUTLINE MODAL DIALOGS */}
      {isEditing && (
        <div className="fixed inset-0 bg-[#121212]/30 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card w-full max-w-2xl rounded-[2.5rem] shadow-2xl border border-pink-100/50 p-8 animate-in zoom-in-95 duration-200 overflow-y-auto max-h-[90vh]">
            
            {/* Header */}
            <div className="flex justify-between items-center mb-6 border-b border-pink-50 pb-4">
              <h3 className="text-2xl font-black text-foreground flex items-center gap-2">
                {editingId ? <Edit className="text-primary" size={24}/> : <Plus className="text-primary" size={24}/>}
                {activeTab === 'workshops' 
                  ? (editingId ? "تعديل ورشة العمل" : "إضافة ورشة عمل جديدة")
                  : (editingId ? "تعديل الفعالية / الحفلة" : "إضافة حفلة جديدة")}
              </h3>
              <button 
                type="button" 
                onClick={resetForms} 
                className="p-2 hover:bg-[#FFF5F8] rounded-full transition-colors text-foreground/60 border border-transparent hover:border-pink-100 cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            {/* WORKSHOP FORM */}
            {activeTab === 'workshops' && (
              <form onSubmit={handleSubmitWorkshop} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-foreground/50 mb-2">اسم الورشة</label>
                    <input 
                      required 
                      type="text" 
                      value={workshopForm.name} 
                      onChange={e => setWorkshopForm({...workshopForm, name: e.target.value})} 
                      className="w-full bg-[#FFF5F8] border border-pink-100/50 rounded-xl py-3 px-4 text-sm font-semibold focus:ring-2 focus:ring-primary/10 outline-none" 
                      placeholder="مثال: ورشة صناعة الفخار والصلصال"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-foreground/50 mb-2">اسم المدرب / المدربة</label>
                    <input 
                      type="text" 
                      value={workshopForm.instructor} 
                      onChange={e => setWorkshopForm({...workshopForm, instructor: e.target.value})} 
                      className="w-full bg-[#FFF5F8] border border-pink-100/50 rounded-xl py-3 px-4 text-sm font-semibold focus:ring-2 focus:ring-primary/10 outline-none" 
                      placeholder="أدخل اسم المدرب (اختياري)"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-foreground/50 mb-2">سعر الاشتراك (ج.م)</label>
                    <input 
                      required 
                      type="number" 
                      value={workshopForm.price} 
                      onChange={e => setWorkshopForm({...workshopForm, price: e.target.value})} 
                      className="w-full bg-[#FFF5F8] border border-pink-100/50 rounded-xl py-3 px-4 text-sm font-semibold focus:ring-2 focus:ring-primary/10 outline-none" 
                      placeholder="مثال: 450"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-foreground/50 mb-2">تاريخ ووقت البدء</label>
                    <input 
                      required 
                      type="datetime-local" 
                      value={workshopForm.startDate} 
                      onChange={e => setWorkshopForm({...workshopForm, startDate: e.target.value})} 
                      className="w-full bg-[#FFF5F8] border border-pink-100/50 rounded-xl py-3 px-4 text-sm font-semibold focus:ring-2 focus:ring-primary/10 outline-none" 
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-foreground/50 mb-2">تاريخ ووقت الانتهاء</label>
                    <input 
                      required 
                      type="datetime-local" 
                      value={workshopForm.endDate} 
                      onChange={e => setWorkshopForm({...workshopForm, endDate: e.target.value})} 
                      className="w-full bg-[#FFF5F8] border border-pink-100/50 rounded-xl py-3 px-4 text-sm font-semibold focus:ring-2 focus:ring-primary/10 outline-none" 
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-foreground/50 mb-2">السعة الإجمالية (عدد المقاعد المتاحة)</label>
                    <input 
                      required 
                      type="number" 
                      value={workshopForm.capacity} 
                      onChange={e => setWorkshopForm({...workshopForm, capacity: e.target.value})} 
                      className="w-full bg-[#FFF5F8] border border-pink-100/50 rounded-xl py-3 px-4 text-sm font-semibold focus:ring-2 focus:ring-primary/10 outline-none" 
                      placeholder="مثال: 20"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-foreground/50 mb-2">وصف تفصيلي للورشة</label>
                  <textarea 
                    value={workshopForm.description} 
                    onChange={e => setWorkshopForm({...workshopForm, description: e.target.value})} 
                    className="w-full bg-[#FFF5F8] border border-pink-100/50 rounded-xl py-3 px-4 text-sm font-semibold focus:ring-2 focus:ring-primary/10 outline-none h-24" 
                    placeholder="اكتب نبذة مختصرة عن أهداف الورشة والمحاور التي سيتم تغطيتها..."
                  />
                </div>

                {/* Footer Controls */}
                <div className="flex justify-end gap-3 border-t border-pink-50 pt-6 mt-6">
                  <button 
                    type="button" 
                    onClick={resetForms} 
                    className="px-6 py-3 font-bold text-foreground/60 hover:bg-[#FFF5F8] rounded-xl transition-all text-sm border border-transparent hover:border-pink-100 cursor-pointer"
                  >
                    إلغاء
                  </button>
                  <button 
                    type="submit" 
                    disabled={loading} 
                    className="flex items-center gap-2 bg-primary text-white px-8 py-3 rounded-xl font-bold shadow-md hover:bg-primary/95 transition-all hover:scale-[1.01] active:scale-95 disabled:opacity-50 text-sm cursor-pointer"
                  >
                    <Save size={18} />
                    {loading ? "جاري الحفظ..." : "حفظ الورشة"}
                  </button>
                </div>
              </form>
            )}

            {/* EVENT FORM */}
            {activeTab === 'events' && (
              <form onSubmit={handleSubmitEvent} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-foreground/50 mb-2">اسم الفعالية / الحفلة</label>
                    <input 
                      required 
                      type="text" 
                      value={eventForm.name} 
                      onChange={e => setEventForm({...eventForm, name: e.target.value})} 
                      className="w-full bg-[#FFF5F8] border border-pink-100/50 rounded-xl py-3 px-4 text-sm font-semibold focus:ring-2 focus:ring-primary/10 outline-none" 
                      placeholder="مثال: حفلة رأس السنة الميلادية"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-foreground/50 mb-2">سعر التذكرة (ج.م)</label>
                    <input 
                      required 
                      type="number" 
                      value={eventForm.price} 
                      onChange={e => setEventForm({...eventForm, price: e.target.value})} 
                      className="w-full bg-[#FFF5F8] border border-pink-100/50 rounded-xl py-3 px-4 text-sm font-semibold focus:ring-2 focus:ring-primary/10 outline-none" 
                      placeholder="مثال: 250"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-foreground/50 mb-2">تاريخ ووقت الحفلة</label>
                    <input 
                      required 
                      type="datetime-local" 
                      value={eventForm.date} 
                      onChange={e => setEventForm({...eventForm, date: e.target.value})} 
                      className="w-full bg-[#FFF5F8] border border-pink-100/50 rounded-xl py-3 px-4 text-sm font-semibold focus:ring-2 focus:ring-primary/10 outline-none" 
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-foreground/50 mb-2">سعة التذاكر الإجمالية</label>
                    <input 
                      required 
                      type="number" 
                      value={eventForm.capacity} 
                      onChange={e => setEventForm({...eventForm, capacity: e.target.value})} 
                      className="w-full bg-[#FFF5F8] border border-pink-100/50 rounded-xl py-3 px-4 text-sm font-semibold focus:ring-2 focus:ring-primary/10 outline-none" 
                      placeholder="مثال: 50"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-foreground/50 mb-2">وصف الفعالية</label>
                  <textarea 
                    value={eventForm.description} 
                    onChange={e => setEventForm({...eventForm, description: e.target.value})} 
                    className="w-full bg-[#FFF5F8] border border-pink-100/50 rounded-xl py-3 px-4 text-sm font-semibold focus:ring-2 focus:ring-primary/10 outline-none h-24" 
                    placeholder="اكتب نبذة عن الحفلة أو الفعالية والفقرات أو الهدايا المتضمنة..."
                  />
                </div>

                {/* Footer Controls */}
                <div className="flex justify-end gap-3 border-t border-pink-50 pt-6 mt-6">
                  <button 
                    type="button" 
                    onClick={resetForms} 
                    className="px-6 py-3 font-bold text-foreground/60 hover:bg-[#FFF5F8] rounded-xl transition-all text-sm border border-transparent hover:border-pink-100 cursor-pointer"
                  >
                    إلغاء
                  </button>
                  <button 
                    type="submit" 
                    disabled={loading} 
                    className="flex items-center gap-2 bg-primary text-white px-8 py-3 rounded-xl font-bold shadow-md hover:bg-primary/95 transition-all hover:scale-[1.01] active:scale-95 disabled:opacity-50 text-sm cursor-pointer"
                  >
                    <Save size={18} />
                    {loading ? "جاري الحفظ..." : "حفظ الحفلة"}
                  </button>
                </div>
              </form>
            )}

          </div>
        </div>
      )}

    </div>
  )
}
