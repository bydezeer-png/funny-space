"use client"

import { useState } from "react"
import { createProgramCategory, updateProgramCategory, deleteProgramCategory, createProgram, updateProgram, deleteProgram } from "@/actions/programs"
import { Plus, Edit, Trash2, CalendarDays, Users, FolderTree, Clock, Save, X, Sparkles, Layers } from "lucide-react"
import { useConfirm } from "@/components/ConfirmProvider"
import { toast } from "sonner"

type ScheduleData = { dayOfWeek: number, startTime: string, endTime: string }
type OptionData = { id?: string, name: string, price: string, sessionsPerMonth: string, capacity: string, schedules: ScheduleData[] }

export default function ProgramsManager({ initialPrograms, initialCategories }: any) {
  const [programs, setPrograms] = useState<any[]>(initialPrograms)
  const [categories, setCategories] = useState<any[]>(initialCategories)
  
  const [activeTab, setActiveTab] = useState<"programs" | "categories">("programs")
  
  // Category Form
  const [newCategoryName, setNewCategoryName] = useState("")
  const [newCategoryImage, setNewCategoryImage] = useState("")
  
  const [isEditingCategory, setIsEditingCategory] = useState(false)
  const [editingCategory, setEditingCategory] = useState<any>(null)
  const [editCategoryForm, setEditCategoryForm] = useState({ name: "", image: "" })
  
  // Program Form
  const [isEditingProgram, setIsEditingProgram] = useState(false)
  const [editingProgramId, setEditingProgramId] = useState<string | null>(null)
  const confirm = useConfirm()
  
  const defaultOption: OptionData = {
    name: "اشتراك 8 حصص",
    price: "",
    sessionsPerMonth: "8",
    capacity: "15",
    schedules: []
  }

  const [programForm, setProgramForm] = useState({
    categoryId: categories[0]?.id || "",
    name: "",
    description: "",
    options: [defaultOption] as OptionData[]
  })
  
  const [loading, setLoading] = useState(false)

  // Category Actions
  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newCategoryName.trim()) return
    try {
      const cat = await createProgramCategory(newCategoryName, newCategoryImage)
      setCategories([...categories, cat])
      setNewCategoryName("")
      setNewCategoryImage("")
      if (!programForm.categoryId) setProgramForm({...programForm, categoryId: cat.id})
      toast.success("تم إضافة الفئة بنجاح")
    } catch (err: any) {
      toast.error(err.message || "حدث خطأ أثناء إضافة الفئة")
    }
  }

  const handleEditCategoryClick = (cat: any) => {
    setEditingCategory(cat)
    setEditCategoryForm({ name: cat.name, image: cat.image || "" })
    setIsEditingCategory(true)
  }

  const handleEditCategorySubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editCategoryForm.name.trim() || !editingCategory) return
    try {
      const updated = await updateProgramCategory(editingCategory.id, editCategoryForm.name, editCategoryForm.image)
      setCategories(categories.map(c => c.id === editingCategory.id ? updated : c))
      setIsEditingCategory(false)
      setEditingCategory(null)
      toast.success("تم تحديث الفئة بنجاح")
    } catch (err: any) {
      toast.error(err.message || "حدث خطأ أثناء تحديث الفئة")
    }
  }
  
  const handleDeleteCategory = async (id: string) => {
    const ok = await confirm("هل أنت متأكد من حذف هذه الفئة؟ سيتم حذف جميع البرامج المرتبطة بها.")
    if(ok) {
      try {
        await deleteProgramCategory(id)
        setCategories(categories.filter(c => c.id !== id))
        setPrograms(programs.filter(p => p.categoryId !== id))
        toast.success("تم حذف الفئة بنجاح")
      } catch (err: any) {
        toast.error(err.message || "حدث خطأ أثناء حذف الفئة")
      }
    }
  }

  // Program Options Actions
  const handleAddOption = () => {
    setProgramForm({
      ...programForm,
      options: [...programForm.options, { ...defaultOption, name: "اشتراك جديد" }]
    })
  }

  const handleRemoveOption = (optIndex: number) => {
    if (programForm.options.length === 1) return toast.error("يجب أن يحتوي البرنامج على خيار اشتراك واحد على الأقل")
    const newOptions = [...programForm.options]
    newOptions.splice(optIndex, 1)
    setProgramForm({ ...programForm, options: newOptions })
  }

  const handleUpdateOption = (optIndex: number, field: keyof OptionData, value: string) => {
    const newOptions = [...programForm.options]
    newOptions[optIndex] = { ...newOptions[optIndex], [field]: value }
    setProgramForm({ ...programForm, options: newOptions })
  }

  // Program Schedules Actions (per option)
  const handleAddSchedule = (optIndex: number) => {
    const newOptions = [...programForm.options]
    newOptions[optIndex].schedules.push({ dayOfWeek: 0, startTime: "17:00", endTime: "19:00" })
    setProgramForm({ ...programForm, options: newOptions })
  }

  const handleRemoveSchedule = (optIndex: number, schIndex: number) => {
    const newOptions = [...programForm.options]
    newOptions[optIndex].schedules.splice(schIndex, 1)
    setProgramForm({ ...programForm, options: newOptions })
  }

  const handleUpdateSchedule = (optIndex: number, schIndex: number, field: string, value: any) => {
    const newOptions = [...programForm.options]
    newOptions[optIndex].schedules[schIndex] = { ...newOptions[optIndex].schedules[schIndex], [field]: value }
    setProgramForm({ ...programForm, options: newOptions })
  }

  const handleEditClick = (prog: any) => {
    setEditingProgramId(prog.id)
    setProgramForm({
      categoryId: prog.categoryId,
      name: prog.name,
      description: prog.description || "",
      options: prog.options.map((opt: any) => ({
        id: opt.id,
        name: opt.name,
        price: opt.price.toString(),
        sessionsPerMonth: opt.sessionsPerMonth.toString(),
        capacity: opt.capacity.toString(),
        schedules: opt.schedules.map((s:any) => ({ dayOfWeek: s.dayOfWeek, startTime: s.startTime, endTime: s.endTime }))
      }))
    })
    setIsEditingProgram(true)
  }

  const handleOpenCreate = () => {
    setEditingProgramId(null)
    setProgramForm({
      categoryId: categories[0]?.id || "",
      name: "",
      description: "",
      options: [defaultOption]
    })
    setIsEditingProgram(true)
  }

  const handleSubmitProgram = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validation
    for (let i=0; i<programForm.options.length; i++) {
      const o = programForm.options[i]
      if (!o.name || !o.price || !o.sessionsPerMonth || !o.capacity) {
        return toast.error("الرجاء إكمال جميع بيانات خيارات الاشتراك")
      }
    }

    setLoading(true)
    
    const data = {
      categoryId: programForm.categoryId,
      name: programForm.name,
      description: programForm.description,
      options: programForm.options.map(opt => ({
        id: opt.id || undefined,
        name: opt.name,
        price: parseFloat(opt.price),
        sessionsPerMonth: parseInt(opt.sessionsPerMonth),
        capacity: parseInt(opt.capacity),
        schedules: opt.schedules.map(s => ({ ...s, dayOfWeek: parseInt(s.dayOfWeek as any) }))
      }))
    }

    try {
      if (editingProgramId) {
        await updateProgram(editingProgramId, data)
        toast.success("تم تحديث البرنامج بنجاح")
      } else {
        await createProgram(data)
        toast.success("تم إضافة البرنامج بنجاح")
      }
      window.location.reload()
    } catch (err: any) {
      toast.error(err.message || "حدث خطأ أثناء حفظ البرنامج")
      setLoading(false)
    }
  }

  const handleDeleteProgram = async (id: string) => {
    const ok = await confirm("هل أنت متأكد من حذف هذا البرنامج نهائياً؟")
    if(ok) {
      try {
        await deleteProgram(id)
        toast.success("تم حذف البرنامج بنجاح")
        window.location.reload()
      } catch (err: any) {
        toast.error(err.message || "حدث خطأ أثناء حذف البرنامج")
      }
    }
  }

  const days = ["الأحد", "الإثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"]

  return (
    <div className="space-y-8">
      
      {/* Header and Add Action */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 animate-in fade-in duration-500">
        {/* Segmented Tab Controller */}
        <div className="bg-secondary border border-border/50 p-1.5 rounded-2xl flex w-max gap-2 shadow-inner">
          <button 
            onClick={() => setActiveTab("programs")}
            className={`px-6 py-3 rounded-xl font-black text-sm transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'programs' 
                ? 'bg-card text-primary shadow-sm border border-border/40' 
                : 'text-foreground/50 hover:text-foreground border border-transparent'
            }`}
          >
            <CalendarDays size={16} />
            البرامج والمستويات
            <span className="bg-primary text-white text-[10px] px-2 py-0.5 rounded-full font-bold">{programs.length}</span>
          </button>
          <button 
            onClick={() => setActiveTab("categories")}
            className={`px-6 py-3 rounded-xl font-black text-sm transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'categories' 
                ? 'bg-card text-primary shadow-sm border border-border/40' 
                : 'text-foreground/50 hover:text-foreground border border-transparent'
            }`}
          >
            <FolderTree size={16} />
            أقسام وفئات البرامج
            <span className="bg-primary/20 text-primary text-[10px] px-2 py-0.5 rounded-full font-bold">{categories.length}</span>
          </button>
        </div>

        {activeTab === 'programs' && (
          <button 
            onClick={handleOpenCreate} 
            className="bg-primary hover:bg-primary/95 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-all hover:scale-[1.02] active:scale-95 shadow-md shadow-pink-100/30"
          >
            <Plus size={20} /> إضافة برنامج جديد
          </button>
        )}
      </div>

      {/* CATEGORIES TAB */}
      {activeTab === 'categories' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in fade-in duration-500">
          {/* Add Category Card */}
          <div className="bg-card p-6 rounded-[2.5rem] border border-border/50 shadow-sm flex flex-col justify-between">
            <div>
              <h3 className="text-xl font-black text-foreground mb-2 flex items-center gap-2">
                <FolderTree className="text-primary" size={20} />
                إضافة قسم جديد
              </h3>
              <p className="text-xs text-foreground/45 font-bold mb-6">قم بتصنيف برامج النادي (مثال: تزلج، باليه، فنون قتالية...)</p>
              
              <form onSubmit={handleAddCategory} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-foreground/50 mb-2">اسم القسم الجديد</label>
                  <input 
                    type="text" 
                    required
                    value={newCategoryName} 
                    onChange={e => setNewCategoryName(e.target.value)} 
                    placeholder="أدخل اسم القسم (مثال: تزلج استعراضي)" 
                    className="w-full bg-secondary border border-border/50 rounded-xl px-4 py-3 text-sm font-semibold outline-none focus:border-primary transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-foreground/50 mb-2">رابط صورة الغلاف للقسم</label>
                  <input 
                    type="url" 
                    value={newCategoryImage} 
                    onChange={e => setNewCategoryImage(e.target.value)} 
                    placeholder="ضع رابط الصورة هنا (اختياري)" 
                    className="w-full bg-secondary border border-border/50 rounded-xl px-4 py-3 text-sm font-semibold outline-none focus:border-primary transition-all text-left"
                    dir="ltr"
                  />
                </div>
                <button 
                  type="submit" 
                  className="w-full bg-primary hover:bg-primary/95 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all hover:scale-[1.01] active:scale-95 shadow-md cursor-pointer"
                >
                  <Plus size={18} /> إضافة القسم
                </button>
              </form>
            </div>
          </div>

          {/* Categories List */}
          <div className="lg:col-span-2 bg-card p-6 rounded-[2.5rem] border border-border/50 shadow-sm">
            <h3 className="text-xl font-black text-foreground mb-1">الأقسام الحالية</h3>
            <p className="text-xs text-foreground/45 font-bold mb-6">الأقسام والتقسيمات الرئيسية المسجلة في النظام.</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {categories.map(c => {
                const associatedCount = programs.filter(p => p.categoryId === c.id).length
                return (
                  <div 
                    key={c.id} 
                    className="flex justify-between items-center p-4 bg-secondary/60 rounded-2xl border border-border/20 hover:border-primary/20 transition-all group"
                  >
                    <div className="text-right flex items-center gap-3">
                      {c.image && (
                        <div className="w-10 h-10 rounded-xl overflow-hidden border border-border bg-cover bg-center shrink-0" style={{ backgroundImage: `url(${c.image})` }}></div>
                      )}
                      <div>
                        <span className="font-black text-foreground block">{c.name}</span>
                        <span className="text-[10px] text-foreground/40 font-bold mt-1 block">
                          يحتوي على: {associatedCount} برنامج
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex gap-1.5">
                      <button 
                        onClick={() => handleEditCategoryClick(c)} 
                        className="p-2 text-blue-600 bg-blue-50 hover:bg-blue-100 border border-blue-100/50 rounded-xl transition-all cursor-pointer"
                        title="تعديل القسم"
                      >
                        <Edit size={14}/>
                      </button>
                      <button 
                        onClick={() => handleDeleteCategory(c.id)} 
                        className="p-2 text-red-500 bg-red-50 hover:bg-red-500 hover:text-white border border-red-100/50 rounded-xl transition-all cursor-pointer"
                        title="حذف القسم"
                      >
                        <Trash2 size={14}/>
                      </button>
                    </div>
                  </div>
                )
              })}
              
              {categories.length === 0 && (
                <div className="col-span-2 text-center py-12">
                  <p className="text-sm font-bold text-foreground/40">لا توجد أقسام مسجلة حالياً.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* PROGRAMS TAB */}
      {activeTab === 'programs' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in duration-500">
          {programs.map(p => (
            <div 
              key={p.id} 
              className="bg-card border border-border/50 rounded-[2.5rem] p-6 shadow-sm hover:shadow-[0_12px_45px_rgba(236,72,153,0.06)] hover:border-primary/20 transition-all duration-300 flex flex-col relative group"
            >
              <div>
                {/* Badge Category & Controls */}
                <div className="flex justify-between items-start mb-4 gap-2">
                  <span className="text-[10px] font-black bg-secondary text-primary border border-border/55 px-3 py-1 rounded-full shadow-sm">
                    {p.category.name}
                  </span>
                  <div className="flex gap-1.5 opacity-80 group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={() => handleEditClick(p)} 
                      className="p-2 text-blue-600 bg-blue-50 hover:bg-blue-100 border border-blue-100/50 rounded-xl transition-all cursor-pointer"
                      title="تعديل"
                    >
                      <Edit size={14}/>
                    </button>
                    <button 
                      onClick={() => handleDeleteProgram(p.id)} 
                      className="p-2 text-red-500 bg-red-50 hover:bg-red-500 hover:text-white border border-red-100/50 rounded-xl transition-all cursor-pointer"
                      title="حذف"
                    >
                      <Trash2 size={14}/>
                    </button>
                  </div>
                </div>

                {/* Program Details */}
                <h3 className="text-xl font-black text-foreground mb-2 leading-snug group-hover:text-primary transition-colors">
                  {p.name}
                </h3>
                
                {p.description && (
                  <p className="text-xs text-foreground/50 font-semibold mb-4 line-clamp-2">
                    {p.description}
                  </p>
                )}
                
                {/* Options List */}
                <div className="space-y-3 mt-4">
                  {p.options.map((opt:any, idx:number) => (
                    <div key={idx} className="bg-secondary/50 border border-border/30 rounded-2xl p-3">
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-bold text-sm text-foreground">{opt.name}</span>
                        <span className="text-sm font-black text-primary">{opt.price} ج.م</span>
                      </div>
                      <div className="flex items-center gap-3 text-[10px] font-bold text-foreground/50 mb-2">
                        <span className="flex items-center gap-1"><Clock size={12}/> {opt.sessionsPerMonth} حصة</span>
                        <span className="flex items-center gap-1"><Users size={12}/> استيعاب {opt.capacity}</span>
                      </div>
                      {/* Schedules for option */}
                      <div className="space-y-1">
                        {opt.schedules.map((s:any, sIdx:number) => (
                          <div key={sIdx} className="text-[10px] bg-card border border-border/20 rounded-lg px-2 py-1 flex justify-between items-center">
                            <span className="font-bold text-foreground">{days[s.dayOfWeek]}</span>
                            <span className="font-semibold text-foreground/60" dir="ltr">{s.startTime} - {s.endTime}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}

          {programs.length === 0 && (
            <div className="col-span-full text-center py-24 bg-secondary/40 border border-dashed border-border rounded-[2.5rem] max-w-xl mx-auto">
              <div className="w-16 h-16 rounded-full bg-secondary/50 flex items-center justify-center mx-auto mb-4 border border-border/30">
                <Sparkles size={24} className="text-primary/45" />
              </div>
              <h4 className="text-lg font-black text-foreground mb-1">لا توجد برامج مسجلة حالياً</h4>
              <p className="text-xs text-foreground/45 font-bold">ابدأ بإضافة أول برنامج عبر الضغط على الزر أعلاه.</p>
            </div>
          )}
        </div>
      )}

      {/* MODERN OUTLINE MODAL FORM (FOR ADD/EDIT PROGRAM) */}
      {isEditingProgram && (
        <div className="fixed inset-0 bg-foreground/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card w-full max-w-3xl rounded-[2.5rem] shadow-2xl border border-border/50 p-6 md:p-8 animate-in zoom-in-95 duration-200 overflow-y-auto max-h-[95vh]">
            
            {/* Modal Header */}
            <div className="flex justify-between items-center mb-6 border-b border-border pb-4 sticky top-0 bg-card z-10 pt-2">
              <h3 className="text-2xl font-black text-foreground flex items-center gap-2">
                {editingProgramId ? <Edit className="text-primary" size={24}/> : <Plus className="text-primary" size={24}/>}
                {editingProgramId ? "تعديل البرنامج" : "إضافة برنامج ومستوى جديد"}
              </h3>
              <button 
                type="button" 
                onClick={() => setIsEditingProgram(false)} 
                className="p-2 hover:bg-secondary rounded-full transition-colors text-foreground/60 border border-transparent hover:border-border cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body / Form */}
            <form onSubmit={handleSubmitProgram} className="space-y-8 pb-10">
              
              {/* Program Basics */}
              <div className="space-y-4">
                <h4 className="font-black text-lg text-foreground border-b-2 border-primary/20 inline-block pb-1">المعلومات الأساسية</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-foreground/50 mb-2">قسم البرنامج (الفئة)</label>
                    <select 
                      required 
                      value={programForm.categoryId} 
                      onChange={e => setProgramForm({...programForm, categoryId: e.target.value})} 
                      className="w-full bg-secondary border border-border/50 rounded-xl py-3 px-4 text-sm font-semibold focus:ring-2 focus:ring-primary/10 outline-none"
                    >
                      <option value="" disabled>اختر القسم...</option>
                      {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-xs font-bold text-foreground/50 mb-2">اسم البرنامج (مثال: باليه متميز)</label>
                    <input 
                      required 
                      type="text" 
                      value={programForm.name} 
                      onChange={e => setProgramForm({...programForm, name: e.target.value})} 
                      className="w-full bg-secondary border border-border/50 rounded-xl py-3 px-4 text-sm font-semibold focus:ring-2 focus:ring-primary/10 outline-none" 
                      placeholder="مثال: باليه متقدم - مستوى 2"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-foreground/50 mb-2">وصف تفصيلي للبرنامج</label>
                    <textarea 
                      value={programForm.description} 
                      onChange={e => setProgramForm({...programForm, description: e.target.value})} 
                      className="w-full bg-secondary border border-border/50 rounded-xl py-3 px-4 text-sm font-semibold focus:ring-2 focus:ring-primary/10 outline-none h-20" 
                      placeholder="اكتب نبذة مختصرة عن هذا البرنامج والفوائد التي ستحصل عليها المشتركة..."
                    />
                  </div>
                </div>
              </div>

              {/* Program Options */}
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h4 className="font-black text-lg text-foreground border-b-2 border-primary/20 inline-block pb-1">خيارات وباقات الاشتراك</h4>
                  <button 
                    type="button" 
                    onClick={handleAddOption}
                    className="text-xs bg-primary/10 hover:bg-primary/20 text-primary font-bold px-3 py-2 rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Plus size={14}/> إضافة باقة أخرى
                  </button>
                </div>

                <div className="space-y-6">
                  {programForm.options.map((opt, optIndex) => (
                    <div key={optIndex} className="bg-card border-2 border-border rounded-2xl p-4 sm:p-6 shadow-sm relative">
                      <button 
                        type="button" 
                        onClick={() => handleRemoveOption(optIndex)}
                        className="absolute top-4 left-4 p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                        title="حذف هذا الخيار"
                      >
                        <Trash2 size={16}/>
                      </button>

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                        <div className="lg:col-span-2">
                          <label className="block text-xs font-bold text-foreground/50 mb-1">اسم الباقة/الخيار</label>
                          <input 
                            required 
                            type="text" 
                            value={opt.name} 
                            onChange={e => handleUpdateOption(optIndex, "name", e.target.value)} 
                            className="w-full bg-secondary border border-border/50 rounded-xl py-2.5 px-3 text-sm font-semibold outline-none focus:border-primary transition-colors" 
                            placeholder="مثال: اشتراك 4 حصص"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-foreground/50 mb-1">السعر (ج.م)</label>
                          <input 
                            required 
                            type="number" 
                            value={opt.price} 
                            onChange={e => handleUpdateOption(optIndex, "price", e.target.value)} 
                            className="w-full bg-secondary border border-border/50 rounded-xl py-2.5 px-3 text-sm font-semibold outline-none focus:border-primary transition-colors" 
                            placeholder="مثال: 500"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-foreground/50 mb-1">عدد الحصص شهرياً</label>
                          <input 
                            required 
                            type="number" 
                            value={opt.sessionsPerMonth} 
                            onChange={e => handleUpdateOption(optIndex, "sessionsPerMonth", e.target.value)} 
                            className="w-full bg-secondary border border-border/50 rounded-xl py-2.5 px-3 text-sm font-semibold outline-none focus:border-primary transition-colors" 
                            placeholder="مثال: 4"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-foreground/50 mb-1">سعة الاستيعاب (المقاعد)</label>
                          <input 
                            required 
                            type="number" 
                            value={opt.capacity} 
                            onChange={e => handleUpdateOption(optIndex, "capacity", e.target.value)} 
                            className="w-full bg-secondary border border-border/50 rounded-xl py-2.5 px-3 text-sm font-semibold outline-none focus:border-primary transition-colors" 
                            placeholder="مثال: 15"
                          />
                        </div>
                      </div>

                      {/* Schedules for this Option */}
                      <div className="bg-secondary/60 border border-border/30 rounded-xl p-4">
                        <div className="flex justify-between items-center mb-3">
                          <h5 className="font-bold text-foreground text-xs flex items-center gap-1.5">
                            <CalendarDays size={14} className="text-primary"/> مواعيد هذه الباقة
                          </h5>
                          <button 
                            type="button" 
                            onClick={() => handleAddSchedule(optIndex)} 
                            className="text-[11px] bg-card border border-border/50 hover:border-primary text-primary font-bold px-2.5 py-1.5 rounded-lg flex items-center gap-1 transition-colors cursor-pointer"
                          >
                            <Plus size={12}/> إضافة موعد
                          </button>
                        </div>
                        
                        {opt.schedules.length === 0 ? (
                          <p className="text-[11px] text-foreground/40 text-center py-2 font-semibold">لم يتم إضافة مواعيد. سيحتاج العميل لاختيار المواعيد لاحقاً إذا تُركت فارغة.</p>
                        ) : (
                          <div className="space-y-2">
                            {opt.schedules.map((schedule, schIndex) => (
                              <div key={schIndex} className="flex flex-wrap items-center gap-3 bg-card px-3 py-2 rounded-lg border border-border/30 shadow-sm relative group">
                                
                                <div className="flex flex-col gap-0.5">
                                  <span className="text-[9px] font-bold text-foreground/40">اليوم</span>
                                  <select 
                                    value={schedule.dayOfWeek} 
                                    onChange={(e) => handleUpdateSchedule(optIndex, schIndex, "dayOfWeek", e.target.value)} 
                                    className="bg-secondary border border-border/30 rounded-md px-2 py-1 text-xs font-semibold outline-none cursor-pointer"
                                  >
                                    {days.map((d, i) => <option key={i} value={i}>{d}</option>)}
                                  </select>
                                </div>

                                <div className="flex flex-col gap-0.5">
                                  <span className="text-[9px] font-bold text-foreground/40">وقت البدء</span>
                                  <input 
                                    type="time" 
                                    value={schedule.startTime} 
                                    onChange={(e) => handleUpdateSchedule(optIndex, schIndex, "startTime", e.target.value)} 
                                    className="bg-secondary border border-border/30 rounded-md px-2 py-1 text-xs font-semibold outline-none" 
                                  />
                                </div>

                                <div className="flex flex-col gap-0.5">
                                  <span className="text-[9px] font-bold text-foreground/40">وقت الانتهاء</span>
                                  <input 
                                    type="time" 
                                    value={schedule.endTime} 
                                    onChange={(e) => handleUpdateSchedule(optIndex, schIndex, "endTime", e.target.value)} 
                                    className="bg-secondary border border-border/30 rounded-md px-2 py-1 text-xs font-semibold outline-none" 
                                  />
                                </div>

                                <button 
                                  type="button" 
                                  onClick={() => handleRemoveSchedule(optIndex, schIndex)} 
                                  className="text-red-400 hover:text-red-600 hover:bg-red-50 p-1.5 rounded-md mr-auto self-end transition-all cursor-pointer"
                                >
                                  <Trash2 size={12}/>
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Actions Footer */}
              <div className="flex justify-end gap-3 border-t border-border pt-6 mt-8 sticky bottom-0 bg-card/95 backdrop-blur py-4 z-10 rounded-b-[2.5rem]">
                <button 
                  type="button" 
                  onClick={() => setIsEditingProgram(false)} 
                  className="px-6 py-3 font-bold text-foreground/60 hover:bg-secondary rounded-xl transition-all text-sm border border-transparent hover:border-border cursor-pointer"
                >
                  إلغاء
                </button>
                <button 
                  type="submit" 
                  disabled={loading} 
                  className="flex items-center gap-2 bg-primary text-white px-8 py-3 rounded-xl font-bold shadow-md hover:bg-primary/95 transition-all hover:scale-[1.01] active:scale-95 disabled:opacity-50 text-sm cursor-pointer"
                >
                  <Save size={18} />
                  {loading ? "جاري الحفظ..." : "حفظ البرنامج"}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* CATEGORY EDIT MODAL */}
      {isEditingCategory && (
        <div className="fixed inset-0 bg-foreground/30 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card w-full max-w-md rounded-[2.5rem] shadow-2xl border border-border/50 p-8 animate-in zoom-in-95 duration-200 text-right">
            {/* Header */}
            <div className="flex justify-between items-center mb-6 border-b border-border pb-4">
              <h3 className="text-xl font-black text-foreground flex items-center gap-2">
                <Edit className="text-primary" size={20}/>
                تعديل القسم
              </h3>
              <button 
                type="button" 
                onClick={() => { setIsEditingCategory(false); setEditingCategory(null); }} 
                className="p-2 hover:bg-secondary rounded-full transition-colors text-foreground/60 border border-transparent hover:border-border cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleEditCategorySubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-foreground/50 mb-2">اسم القسم</label>
                <input 
                  type="text" 
                  required
                  value={editCategoryForm.name} 
                  onChange={e => setEditCategoryForm({...editCategoryForm, name: e.target.value})} 
                  placeholder="أدخل اسم القسم" 
                  className="w-full bg-secondary border border-border/50 rounded-xl px-4 py-3 text-sm font-semibold outline-none focus:border-primary transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-foreground/50 mb-2">رابط صورة الغلاف للقسم</label>
                <input 
                  type="url" 
                  value={editCategoryForm.image} 
                  onChange={e => setEditCategoryForm({...editCategoryForm, image: e.target.value})} 
                  placeholder="رابط الصورة (مثال: https://...)" 
                  className="w-full bg-secondary border border-border/50 rounded-xl px-4 py-3 text-sm font-semibold outline-none focus:border-primary transition-all text-left"
                  dir="ltr"
                />
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <button 
                  type="button" 
                  onClick={() => { setIsEditingCategory(false); setEditingCategory(null); }} 
                  className="px-4 py-2 text-xs font-bold text-foreground/50 hover:bg-secondary rounded-xl transition-all border border-transparent hover:border-border cursor-pointer"
                >
                  إلغاء
                </button>
                <button 
                  type="submit" 
                  className="bg-primary hover:bg-primary/95 text-white px-5 py-2.5 rounded-xl font-bold text-xs shadow-md transition-all active:scale-95 cursor-pointer"
                >
                  حفظ التعديلات
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  )
}
