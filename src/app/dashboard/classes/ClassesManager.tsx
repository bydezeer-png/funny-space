"use client"

import React, { useState, useEffect, useTransition } from "react"
import { 
  Users, 
  Plus, 
  Search, 
  MessageCircle, 
  Phone, 
  X, 
  Sparkles, 
  CheckCircle, 
  Clock, 
  Banknote, 
  UserCheck, 
  Edit3, 
  Calendar, 
  PartyPopper,
  Info,
  CalendarDays,
  UserPlus
} from "lucide-react"
import { useConfirm, usePrompt } from "@/components/ConfirmProvider"
import { toast } from "sonner"
import { searchClientsAction } from "@/actions/client"
import { enrollClient, updateRemainingSessions, recordAttendance } from "@/actions/enrollments"

export default function ClassesManager({
  initialPrograms,
  initialWorkshops,
  initialEvents,
  initialEnrollments,
  canBook = true,
  canRecordAttendance = true
}: any) {
  const [programs] = useState<any[]>(initialPrograms)
  const [workshops] = useState<any[]>(initialWorkshops)
  const [events] = useState<any[]>(initialEvents)
  const [enrollments, setEnrollments] = useState<any[]>(initialEnrollments)

  const [activeTab, setActiveTab] = useState<"programs" | "workshops" | "events">("programs")
  const [searchQuery, setSearchQuery] = useState("")

  const [isPending, startTransition] = useTransition()
  const confirm = useConfirm()
  const prompt = usePrompt()

  // Modal States
  const [isEnrollModalOpen, setIsEnrollModalOpen] = useState(false)
  const [selectedClassForDetails, setSelectedClassForDetails] = useState<any | null>(null)
  
  // Enrollment Form States
  const [clientType, setClientType] = useState<"existing" | "new">("existing")
  
  // Existing Client Search
  const [clientSearchQuery, setClientSearchQuery] = useState("")
  const [clientSearchResults, setClientSearchResults] = useState<any[]>([])
  const [selectedClient, setSelectedClient] = useState<any | null>(null)
  const [searchLoading, setSearchLoading] = useState(false)

  // New Client Fields
  const [newClientName, setNewClientName] = useState("")
  const [newClientPhone, setNewClientPhone] = useState("")
  const [newClientEmail, setNewClientEmail] = useState("")
  const [newClientNotes, setNewClientNotes] = useState("")

  // Class Selection
  const [enrollType, setEnrollType] = useState<"program" | "workshop" | "event">("program")
  const [selectedProgramId, setSelectedProgramId] = useState("")
  const [selectedOptionId, setSelectedOptionId] = useState("")
  const [selectedWorkshopId, setSelectedWorkshopId] = useState("")
  const [selectedEventId, setSelectedEventId] = useState("")

  // Financials
  const [totalAmount, setTotalAmount] = useState<string>("")
  const [amountPaid, setAmountPaid] = useState<string>("")
  const [paymentMethod, setPaymentMethod] = useState("CASH")
  const [enrollmentStatus, setEnrollmentStatus] = useState<"PENDING" | "CONFIRMED">("CONFIRMED")

  // Old Client & Sessions
  const [isOldClient, setIsOldClient] = useState(false)
  const [remainingSessions, setRemainingSessions] = useState<string>("")

  // Search existing clients debounced
  useEffect(() => {
    if (clientSearchQuery.trim().length >= 2) {
      setSearchLoading(true)
      const timer = setTimeout(async () => {
        try {
          const results = await searchClientsAction(clientSearchQuery)
          setClientSearchResults(results)
        } catch (err) {
          console.error(err)
        } finally {
          setSearchLoading(false)
        }
      }, 400)
      return () => clearTimeout(timer)
    } else {
      setClientSearchResults([])
    }
  }, [clientSearchQuery])

  // Reset option when program changes
  useEffect(() => {
    if (selectedProgramId) {
      const prog = programs.find(p => p.id === selectedProgramId)
      if (prog && prog.options.length > 0) {
        setSelectedOptionId(prog.options[0].id)
        setTotalAmount(prog.options[0].price.toString())
        setAmountPaid(prog.options[0].price.toString())
        setRemainingSessions(prog.options[0].sessionsPerMonth.toString())
      }
    } else {
      setSelectedOptionId("")
      setTotalAmount("")
      setAmountPaid("")
      setRemainingSessions("")
    }
  }, [selectedProgramId, programs])

  // Update total & sessions when program option changes
  useEffect(() => {
    if (selectedOptionId && selectedProgramId) {
      const prog = programs.find(p => p.id === selectedProgramId)
      const opt = prog?.options.find((o: any) => o.id === selectedOptionId)
      if (opt) {
        setTotalAmount(opt.price.toString())
        setAmountPaid(opt.price.toString())
        setRemainingSessions(opt.sessionsPerMonth.toString())
      }
    }
  }, [selectedOptionId, selectedProgramId, programs])

  // Update details when workshop changes
  useEffect(() => {
    if (selectedWorkshopId) {
      const ws = workshops.find(w => w.id === selectedWorkshopId)
      if (ws) {
        setTotalAmount(ws.price.toString())
        setAmountPaid(ws.price.toString())
      }
    }
  }, [selectedWorkshopId, workshops])

  // Update details when event changes
  useEffect(() => {
    if (selectedEventId) {
      const ev = events.find(e => e.id === selectedEventId)
      if (ev) {
        setTotalAmount(ev.price.toString())
        setAmountPaid(ev.price.toString())
      }
    }
  }, [selectedEventId, events])

  // Trigger default selection for enroll modal
  const openEnrollModal = () => {
    setSelectedClient(null)
    setClientSearchQuery("")
    setClientSearchResults([])
    setNewClientName("")
    setNewClientPhone("")
    setNewClientEmail("")
    setNewClientNotes("")
    setIsOldClient(false)
    
    if (programs.length > 0) {
      setSelectedProgramId(programs[0].id)
    }
    if (workshops.length > 0) {
      setSelectedWorkshopId(workshops[0].id)
    }
    if (events.length > 0) {
      setSelectedEventId(events[0].id)
    }
    
    setIsEnrollModalOpen(true)
  }

  // Handle Enrollment Submit
  const handleEnrollSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (clientType === "existing" && !selectedClient) {
      return toast.error("الرجاء اختيار عميلة مسجلة")
    }
    if (clientType === "new") {
      if (!newClientName || !newClientPhone) {
        return toast.error("الاسم ورقم الهاتف مطلوبان للعميلة الجديدة")
      }
    }

    if (enrollType === "program" && (!selectedProgramId || !selectedOptionId)) {
      return toast.error("الرجاء اختيار برنامج ومستوى اشتراك")
    }
    if (enrollType === "workshop" && !selectedWorkshopId) {
      return toast.error("الرجاء اختيار ورشة العمل")
    }
    if (enrollType === "event" && !selectedEventId) {
      return toast.error("الرجاء اختيار الحفلة/الفعالية")
    }

    const priceVal = parseFloat(totalAmount)
    const paidVal = parseFloat(amountPaid)
    if (isNaN(priceVal) || priceVal < 0 || isNaN(paidVal) || paidVal < 0) {
      return toast.error("المبالغ المالية غير صحيحة")
    }

    let dummySessions: number | undefined = undefined
    if (enrollType === "program" && isOldClient) {
      const remVal = parseInt(remainingSessions)
      if (isNaN(remVal) || remVal < 0) {
        return toast.error("عدد الحصص المتبقية غير صحيح")
      }
      dummySessions = remVal
    }

    startTransition(async () => {
      try {
        await enrollClient({
          clientId: clientType === "existing" ? selectedClient.id : undefined,
          newClient: clientType === "new" ? {
            name: newClientName,
            phone: newClientPhone,
            email: newClientEmail,
            notes: newClientNotes
          } : undefined,
          programId: enrollType === "program" ? selectedProgramId : undefined,
          optionId: enrollType === "program" ? selectedOptionId : undefined,
          workshopId: enrollType === "workshop" ? selectedWorkshopId : undefined,
          eventId: enrollType === "event" ? selectedEventId : undefined,
          status: enrollmentStatus,
          paymentMethod: paidVal > 0 ? paymentMethod : undefined,
          totalAmount: priceVal,
          amountPaid: paidVal,
          remainingSessions: dummySessions
        })
        
        toast.success("تم تسجيل العميلة بنجاح!")
        setIsEnrollModalOpen(false)
        window.location.reload()
      } catch (err: any) {
        toast.error(err.message || "حدث خطأ أثناء الاشتراك")
      }
    })
  }

  // Handle Recording Attendance directly from modal
  const handleAttendance = async (enrollmentId: string, isMakeup: boolean = false) => {
    try {
      await recordAttendance(enrollmentId, isMakeup)
      toast.success("تم تسجيل الحضور")
      
      // Update local state to reflect attendance change immediately without total reload if possible
      // But reloading is cleaner to sync everything
      window.location.reload()
    } catch (err: any) {
      toast.error(err.message)
    }
  }

  // Handle Editing Remaining Sessions
  const handleEditSessions = async (enrollmentId: string, maxSessions: number, currentRemaining: number) => {
    const rawVal = await prompt(`تعديل الحصص المتبقية للعميلة (الأقصى: ${maxSessions}):`, currentRemaining.toString())
    if (rawVal !== null) {
      const val = parseInt(rawVal)
      if (isNaN(val) || val < 0 || val > maxSessions) {
        return toast.error("عدد حصص غير صحيح")
      }
      try {
        await updateRemainingSessions(enrollmentId, val)
        toast.success("تم تحديث الحصص المتبقية")
        window.location.reload()
      } catch (err: any) {
        toast.error(err.message)
      }
    }
  }

  // Generate Class Option List
  const classItems = React.useMemo(() => {
    if (activeTab === "programs") {
      const items: any[] = []
      programs.forEach(prog => {
        prog.options.forEach((opt: any) => {
          const matchingEnrollments = enrollments.filter(
            e => e.programId === prog.id && e.optionId === opt.id
          )
          
          items.push({
            id: `${prog.id}-${opt.id}`,
            programId: prog.id,
            optionId: opt.id,
            name: `${prog.name} - ${opt.name}`,
            category: prog.category.name,
            price: opt.price,
            capacity: opt.capacity,
            sessions: opt.sessionsPerMonth,
            enrollmentCount: matchingEnrollments.length,
            enrollments: matchingEnrollments,
            type: "program"
          })
        })
      })
      return items
    } else if (activeTab === "workshops") {
      return workshops.map(ws => {
        const matchingEnrollments = enrollments.filter(e => e.workshopId === ws.id)
        return {
          id: ws.id,
          name: ws.name,
          instructor: ws.instructor || "غير محدد",
          price: ws.price,
          capacity: ws.capacity,
          startDate: ws.startDate,
          endDate: ws.endDate,
          enrollmentCount: matchingEnrollments.length,
          enrollments: matchingEnrollments,
          type: "workshop"
        }
      })
    } else {
      return events.map(ev => {
        const matchingEnrollments = enrollments.filter(e => e.eventId === ev.id)
        return {
          id: ev.id,
          name: ev.name,
          price: ev.price,
          capacity: ev.capacity,
          date: ev.date,
          enrollmentCount: matchingEnrollments.length,
          enrollments: matchingEnrollments,
          type: "event"
        }
      })
    }
  }, [activeTab, programs, workshops, events, enrollments])

  // Filter items by search query
  const filteredClassItems = classItems.filter(item => 
    item.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    (item.category && item.category.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (item.instructor && item.instructor.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  // Calculations for quick stats
  const totalClassesCount = programs.reduce((acc, p) => acc + p.options.length, 0)
  const totalWorkshopsCount = workshops.length
  const totalEventsCount = events.length
  const totalEnrollsCount = enrollments.length

  return (
    <div className="space-y-8 text-right">
      
      {/* Quick Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-card p-5 rounded-2xl border border-border shadow-xs">
          <p className="text-foreground/50 text-xs font-bold mb-1">إجمالي الكلاسات</p>
          <p className="text-2xl font-black text-primary">{totalClassesCount}</p>
        </div>
        <div className="bg-card p-5 rounded-2xl border border-border shadow-xs">
          <p className="text-foreground/50 text-xs font-bold mb-1">إجمالي ورش العمل</p>
          <p className="text-2xl font-black text-orange-500">{totalWorkshopsCount}</p>
        </div>
        <div className="bg-card p-5 rounded-2xl border border-border shadow-xs">
          <p className="text-foreground/50 text-xs font-bold mb-1">إجمالي الحفلات</p>
          <p className="text-2xl font-black text-purple-500">{totalEventsCount}</p>
        </div>
        <div className="bg-card p-5 rounded-2xl border border-border shadow-xs">
          <p className="text-foreground/50 text-xs font-bold mb-1">إجمالي الاشتراكات الفعالة</p>
          <p className="text-2xl font-black text-green-500">{totalEnrollsCount}</p>
        </div>
      </div>

      {/* Actions and Tab bar */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        
        {/* Tab Controller */}
        <div className="bg-secondary border border-border/50 p-1.5 rounded-2xl flex w-full md:w-max gap-2 shadow-inner">
          <button 
            onClick={() => { setActiveTab("programs"); setSearchQuery(""); }}
            className={`flex-1 md:flex-initial px-5 py-2.5 rounded-xl font-black text-xs transition-all flex items-center justify-center gap-2 cursor-pointer ${
              activeTab === 'programs' 
                ? 'bg-card text-primary shadow-sm border border-border/40' 
                : 'text-foreground/50 hover:text-foreground border border-transparent'
            }`}
          >
            <CalendarDays size={14} />
            الكلاسات والبرامج
          </button>
          <button 
            onClick={() => { setActiveTab("workshops"); setSearchQuery(""); }}
            className={`flex-1 md:flex-initial px-5 py-2.5 rounded-xl font-black text-xs transition-all flex items-center justify-center gap-2 cursor-pointer ${
              activeTab === 'workshops' 
                ? 'bg-card text-primary shadow-sm border border-border/40' 
                : 'text-foreground/50 hover:text-foreground border border-transparent'
            }`}
          >
            <Calendar size={14} />
            ورش العمل
          </button>
          <button 
            onClick={() => { setActiveTab("events"); setSearchQuery(""); }}
            className={`flex-1 md:flex-initial px-5 py-2.5 rounded-xl font-black text-xs transition-all flex items-center justify-center gap-2 cursor-pointer ${
              activeTab === 'events' 
                ? 'bg-card text-primary shadow-sm border border-border/40' 
                : 'text-foreground/50 hover:text-foreground border border-transparent'
            }`}
          >
            <PartyPopper size={14} />
            الفعاليات والحفلات
          </button>
        </div>

        {/* Search & Enroll actions */}
        <div className="flex w-full md:w-auto items-center gap-3">
          <div className="relative flex-1 md:w-64">
            <span className="absolute inset-y-0 right-3 flex items-center text-foreground/40"><Search size={15}/></span>
            <input 
              type="text" 
              placeholder="البحث بالاسم..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-card border border-border rounded-xl pr-10 pl-4 py-2.5 text-xs font-semibold outline-none focus:border-primary transition-all text-right"
            />
          </div>

          {canBook && (
            <button 
              onClick={openEnrollModal}
              className="bg-primary hover:bg-primary-hover text-white px-5 py-2.5 rounded-xl font-black text-xs flex items-center gap-1.5 shadow-md shadow-pink-200/5 hover:scale-[1.02] active:scale-95 transition-all cursor-pointer shrink-0"
            >
              <Plus size={14} />
              إضافة مشتركة لكلاس
            </button>
          )}
        </div>

      </div>

      {/* Grid of Classes/Workshops/Events */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredClassItems.map(item => {
          const fillPercentage = Math.min(100, Math.round((item.enrollmentCount / item.capacity) * 100))
          
          return (
            <div 
              key={item.id}
              className="bg-card border border-border/50 rounded-[2rem] p-6 shadow-sm hover:shadow-[0_12px_45px_rgba(236,72,153,0.06)] hover:border-primary/20 transition-all duration-300 flex flex-col justify-between group"
            >
              <div>
                {/* Header Tag */}
                <div className="flex justify-between items-center mb-4">
                  <span className="text-[10px] text-foreground/45 font-semibold">
                    {item.type === 'program' ? `📂 ${item.category}` : item.type === 'workshop' ? `🎓 ورشة` : `🎉 فعالية`}
                  </span>
                  <span className="text-primary font-black text-base">{item.price} ج.م</span>
                </div>

                <h4 className="font-black text-foreground leading-snug text-base mb-2 group-hover:text-primary transition-colors">
                  {item.name}
                </h4>

                {item.type === 'workshop' && (
                  <p className="text-xs text-foreground/60 font-semibold mb-3">👨‍🏫 المدربة: {item.instructor}</p>
                )}

                {item.type === 'workshop' && (
                  <p className="text-[10px] text-foreground/45 font-bold mb-4">
                    📅 من {new Date(item.startDate).toLocaleDateString('ar-EG')} إلى {new Date(item.endDate).toLocaleDateString('ar-EG')}
                  </p>
                )}

                {item.type === 'event' && (
                  <p className="text-[10px] text-foreground/45 font-bold mb-4">
                    📅 التاريخ: {new Date(item.date).toLocaleDateString('ar-EG')}
                  </p>
                )}

                {item.type === 'program' && (
                  <p className="text-[10px] text-foreground/45 font-bold mb-4">
                    🔄 الحصص الشهرية: {item.sessions} حصة
                  </p>
                )}

                {/* Capacity Counter */}
                <div className="space-y-2 mb-4 bg-secondary/30 border border-border/20 p-4 rounded-2xl">
                  <div className="flex justify-between items-center text-xs font-bold text-foreground/60">
                    <span>المشتركات: {item.enrollmentCount} من {item.capacity}</span>
                    <span className="text-primary">{fillPercentage}%</span>
                  </div>
                  <div className="w-full bg-secondary rounded-full h-2 overflow-hidden border border-border/30">
                    <div 
                      className={`h-full rounded-full transition-all duration-500 ${fillPercentage >= 100 ? 'bg-red-500' : 'bg-primary'}`}
                      style={{width: `${fillPercentage}%`}}
                    ></div>
                  </div>
                </div>
              </div>

              {/* View Enrolled Button */}
              <button 
                onClick={() => setSelectedClassForDetails(item)}
                className="w-full bg-secondary hover:bg-primary hover:text-white text-foreground/80 py-2.5 rounded-xl font-black text-xs transition-all flex items-center justify-center gap-1.5 border border-border active:scale-95 cursor-pointer"
              >
                <Users size={14} />
                عرض المشتركات ({item.enrollmentCount})
              </button>

            </div>
          )
        })}
      </div>

      {filteredClassItems.length === 0 && (
        <div className="text-center py-20 bg-secondary/40 border border-dashed border-border rounded-[2.5rem] max-w-xl mx-auto">
          <p className="text-sm text-foreground/45 font-bold">لا يوجد نتائج تطابق البحث حالياً.</p>
        </div>
      )}

      {/* 1. Modal: View Enrolled Students Details */}
      {selectedClassForDetails && (
        <div className="fixed inset-0 bg-foreground/40 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-in fade-in duration-300">
          <div className="bg-card w-full max-w-3xl rounded-[2.5rem] border border-border shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 text-right flex flex-col max-h-[85vh]">
            
            {/* Modal Header */}
            <div className="p-6 border-b border-border flex justify-between items-center shrink-0">
              <button 
                onClick={() => setSelectedClassForDetails(null)}
                className="p-2 hover:bg-secondary rounded-full text-foreground/45 hover:text-foreground transition-all cursor-pointer"
              >
                <X size={18} />
              </button>
              <div className="text-right">
                <h3 className="text-xl font-black text-foreground">قائمة المشتركات</h3>
                <p className="text-xs text-foreground/50 font-semibold mt-1">{selectedClassForDetails.name}</p>
              </div>
            </div>

            {/* Modal Body (Scrollable List) */}
            <div className="p-6 overflow-y-auto space-y-4 flex-1">
              {selectedClassForDetails.enrollments.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-foreground/40 font-bold text-sm">لا يوجد فتيات مشتركات في هذا الكلاس بعد.</p>
                </div>
              ) : (
                selectedClassForDetails.enrollments.map((enr: any) => {
                  const regularCount = enr.attendances.filter((a: any) => !a.isMakeup && a.status !== "IMPORTED").length
                  const importedCount = enr.attendances.filter((a: any) => a.status === "IMPORTED").length
                  const totalRegular = regularCount + importedCount
                  const maxSessions = selectedClassForDetails.sessions || 8
                  const remaining = maxSessions - totalRegular
                  const remainingPaid = (enr.totalAmount || 0) - (enr.amountPaid || 0)

                  return (
                    <div 
                      key={enr.id}
                      className="p-5 rounded-2xl bg-secondary/40 border border-border flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:border-primary/20 transition-all"
                    >
                      {/* Right: Client Profile Info */}
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-black text-xs shrink-0 select-none">
                          {enr.client.name.trim().charAt(0)}
                        </div>
                        <div>
                          <h5 className="font-black text-sm text-foreground">{enr.client.name}</h5>
                          <p className="text-[10px] text-foreground/50 font-bold mt-0.5 flex items-center gap-1">
                            <Phone size={10} /> {enr.client.phone}
                          </p>
                        </div>
                      </div>

                      {/* Middle: Progress / Sessions info */}
                      {selectedClassForDetails.type === "program" && (
                        <div className="space-y-1 md:w-44 text-right">
                          <div className="flex justify-between text-[10px] font-bold text-foreground/50">
                            <span>الحصص المتبقية: {remaining} من {maxSessions}</span>
                          </div>
                          <div className="w-full bg-secondary rounded-full h-1.5 overflow-hidden border border-border/30">
                            <div 
                              className="bg-green-500 h-full rounded-full"
                              style={{width: `${Math.min(100, (remaining / maxSessions) * 100)}%`}}
                            ></div>
                          </div>
                        </div>
                      )}

                      {/* Payment Badge info */}
                      <div className="text-right">
                        <span className={`inline-block px-2.5 py-0.5 rounded-full text-[9px] font-black border ${
                          remainingPaid <= 0 ? 'bg-green-50 text-green-600 border-green-100' : 'bg-red-50 text-red-600 border-red-100'
                        }`}>
                          {remainingPaid <= 0 ? 'مكتمل الدفع' : `متبقي: ${remainingPaid} ج.م`}
                        </span>
                        <p className="text-[9px] font-semibold text-foreground/40 mt-1">المدفوع: {enr.amountPaid} ج.م</p>
                      </div>

                      {/* Left Actions */}
                      <div className="flex items-center gap-2 w-full md:w-auto md:justify-end">
                        {/* Record Attendance */}
                        {canRecordAttendance && selectedClassForDetails.type === "program" && (
                          <>
                            <button
                              onClick={() => handleAttendance(enr.id, false)}
                              className="flex-1 md:flex-initial p-2 bg-foreground text-white hover:bg-primary rounded-xl text-[10px] font-black flex items-center justify-center gap-1 transition-all cursor-pointer"
                              title="تسجيل حضور أساسي"
                            >
                              <UserCheck size={12} />
                              حضور
                            </button>
                            <button
                              onClick={() => handleEditSessions(enr.id, maxSessions, remaining)}
                              className="p-2 bg-secondary hover:bg-border border border-border text-foreground/70 rounded-xl text-[10px] font-black flex items-center justify-center gap-1 transition-all cursor-pointer"
                              title="تعديل الحصص المتبقية"
                            >
                              <Edit3 size={12} />
                              تعديل الحصص
                            </button>
                          </>
                        )}

                        {/* WhatsApp Message */}
                        <a 
                          href={`https://wa.me/20${enr.client.phone.replace(/^0/, '')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 bg-green-50 text-green-600 hover:bg-green-600 hover:text-white rounded-xl border border-green-100 transition-all flex items-center justify-center cursor-pointer"
                          title="واتساب"
                        >
                          <MessageCircle size={14} />
                        </a>
                      </div>

                    </div>
                  )
                })
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-6 border-t border-border bg-secondary/20 flex justify-end shrink-0">
              <button 
                onClick={() => setSelectedClassForDetails(null)}
                className="bg-foreground text-white px-5 py-2.5 rounded-xl font-black text-xs cursor-pointer"
              >
                إغلاق
              </button>
            </div>

          </div>
        </div>
      )}

      {/* 2. Modal: Enroll/Add Client Modal */}
      {isEnrollModalOpen && (
        <div className="fixed inset-0 bg-foreground/40 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-in fade-in duration-300">
          <div className="bg-card w-full max-w-xl rounded-[2.5rem] border border-border shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 text-right flex flex-col max-h-[90vh]">
            
            {/* Modal Header */}
            <div className="p-6 border-b border-border flex justify-between items-center shrink-0">
              <button 
                onClick={() => setIsEnrollModalOpen(false)}
                className="p-2 hover:bg-secondary rounded-full text-foreground/45 hover:text-foreground transition-all cursor-pointer"
              >
                <X size={18} />
              </button>
              <div className="text-right">
                <h3 className="text-xl font-black text-foreground">تسجيل مشتركة جديدة في كلاس</h3>
                <p className="text-xs text-foreground/50 font-semibold mt-1">تعبئة البيانات بالأسفل لإتمام الحجز والاشتراك.</p>
              </div>
            </div>

            {/* Scrollable Form Body */}
            <form onSubmit={handleEnrollSubmit} className="p-6 overflow-y-auto space-y-5 flex-1 text-right">
              
              {/* Client Type selection */}
              <div className="space-y-2">
                <label className="block text-xs font-black text-foreground/60">نوع العميلة المشتركة:</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => { setClientType("existing"); setSelectedClient(null); }}
                    className={`py-3 rounded-xl border text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-2 ${
                      clientType === "existing"
                        ? "bg-primary/5 text-primary border-primary"
                        : "bg-secondary/40 border-border text-foreground/50"
                    }`}
                  >
                    <Search size={14} />
                    عميلة مسجلة بالفعل
                  </button>
                  <button
                    type="button"
                    onClick={() => { setClientType("new"); setSelectedClient(null); }}
                    className={`py-3 rounded-xl border text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-2 ${
                      clientType === "new"
                        ? "bg-primary/5 text-primary border-primary"
                        : "bg-secondary/40 border-border text-foreground/50"
                    }`}
                  >
                    <UserPlus size={14} />
                    عميلة جديدة
                  </button>
                </div>
              </div>

              {/* Existing Client Search input */}
              {clientType === "existing" && (
                <div className="space-y-2 relative">
                  <label className="block text-xs font-black text-foreground/60">ابحثي عن العميلة بالاسم أو الهاتف:</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 right-3 flex items-center text-foreground/45"><Search size={14}/></span>
                    <input
                      type="text"
                      placeholder="اكتبي حرفين على الأقل للبحث..."
                      value={clientSearchQuery}
                      onChange={(e) => setClientSearchQuery(e.target.value)}
                      className="w-full bg-secondary/50 border border-border rounded-xl pr-9 pl-4 py-2.5 text-xs font-semibold outline-none focus:border-primary transition-all text-right"
                    />
                  </div>

                  {/* Selected Client Card */}
                  {selectedClient && (
                    <div className="p-3 bg-green-50/20 border border-green-200 rounded-xl flex items-center justify-between mt-2">
                      <button 
                        type="button" 
                        onClick={() => setSelectedClient(null)} 
                        className="text-red-500 hover:text-red-700 font-black text-xs cursor-pointer"
                      >
                        إزالة
                      </button>
                      <div className="text-right">
                        <p className="text-xs font-black text-foreground">{selectedClient.name}</p>
                        <p className="text-[10px] text-foreground/50 font-bold mt-0.5">📞 {selectedClient.phone}</p>
                      </div>
                    </div>
                  )}

                  {/* Search suggestions */}
                  {clientSearchResults.length > 0 && (
                    <div className="absolute right-0 left-0 bg-card border border-border rounded-xl shadow-lg mt-1 max-h-48 overflow-y-auto z-50">
                      {clientSearchResults.map(c => (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => {
                            setSelectedClient(c)
                            setClientSearchResults([])
                            setClientSearchQuery("")
                          }}
                          className="w-full text-right p-3 hover:bg-secondary text-xs font-semibold border-b border-border/50 last:border-0 cursor-pointer block"
                        >
                          {c.name} ({c.phone})
                        </button>
                      ))}
                    </div>
                  )}
                  
                  {searchLoading && (
                    <p className="text-[10px] text-foreground/45 font-semibold mt-1">جاري البحث...</p>
                  )}
                </div>
              )}

              {/* New Client Form Fields */}
              {clientType === "new" && (
                <div className="space-y-3 p-4 bg-secondary/20 border border-border rounded-2xl">
                  <p className="text-xs font-black text-primary mb-2 flex items-center gap-1">✨ تسجيل بيانات العميلة الجديدة</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="block text-[10px] font-black text-foreground/50">الاسم بالكامل *</label>
                      <input
                        type="text"
                        placeholder="الاسم"
                        required
                        value={newClientName}
                        onChange={(e) => setNewClientName(e.target.value)}
                        className="w-full bg-card border border-border rounded-xl px-3 py-2 text-xs font-semibold outline-none focus:border-primary transition-all text-right"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-[10px] font-black text-foreground/50">رقم الهاتف *</label>
                      <input
                        type="text"
                        placeholder="الهاتف (مثال: 010xxxxxxx)"
                        required
                        value={newClientPhone}
                        onChange={(e) => setNewClientPhone(e.target.value)}
                        className="w-full bg-card border border-border rounded-xl px-3 py-2 text-xs font-semibold outline-none focus:border-primary transition-all text-right"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-1">
                    <label className="block text-[10px] font-black text-foreground/50">البريد الإلكتروني (اختياري)</label>
                    <input
                      type="email"
                      placeholder="البريد"
                      value={newClientEmail}
                      onChange={(e) => setNewClientEmail(e.target.value)}
                      className="w-full bg-card border border-border rounded-xl px-3 py-2 text-xs font-semibold outline-none focus:border-primary transition-all text-right"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[10px] font-black text-foreground/50">ملاحظات عن العميلة (مثل تفضيلات أو وجبات)</label>
                    <textarea
                      placeholder="أية ملاحظات أخرى..."
                      value={newClientNotes}
                      onChange={(e) => setNewClientNotes(e.target.value)}
                      rows={2}
                      className="w-full bg-card border border-border rounded-xl px-3 py-2 text-xs font-semibold outline-none focus:border-primary transition-all text-right resize-none"
                    />
                  </div>
                </div>
              )}

              {/* Service Type Selection */}
              <div className="space-y-2">
                <label className="block text-xs font-black text-foreground/60">نوع الكلاس المراد حجز اشتراك فيه:</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => { setEnrollType("program"); setRemainingSessions(""); }}
                    className={`py-2.5 rounded-xl border text-[10px] font-black transition-all cursor-pointer ${
                      enrollType === "program"
                        ? "bg-primary/5 text-primary border-primary"
                        : "bg-secondary/40 border-border text-foreground/50"
                    }`}
                  >
                    برنامج تدريبي
                  </button>
                  <button
                    type="button"
                    onClick={() => { setEnrollType("workshop"); setRemainingSessions(""); }}
                    className={`py-2.5 rounded-xl border text-[10px] font-black transition-all cursor-pointer ${
                      enrollType === "workshop"
                        ? "bg-primary/5 text-primary border-primary"
                        : "bg-secondary/40 border-border text-foreground/50"
                    }`}
                  >
                    ورشة عمل
                  </button>
                  <button
                    type="button"
                    onClick={() => { setEnrollType("event"); setRemainingSessions(""); }}
                    className={`py-2.5 rounded-xl border text-[10px] font-black transition-all cursor-pointer ${
                      enrollType === "event"
                        ? "bg-primary/5 text-primary border-primary"
                        : "bg-secondary/40 border-border text-foreground/50"
                    }`}
                  >
                    حفلة / فعالية
                  </button>
                </div>
              </div>

              {/* Conditionally Render Dropdowns */}
              {enrollType === "program" && (
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="block text-[10px] font-black text-foreground/50">اختر البرنامج التدريبي:</label>
                    <select
                      value={selectedProgramId}
                      onChange={(e) => setSelectedProgramId(e.target.value)}
                      className="w-full bg-secondary border border-border rounded-xl px-3 py-2 text-xs font-bold outline-none focus:border-primary transition-all cursor-pointer"
                    >
                      <option value="">-- اختر برنامجاً --</option>
                      {programs.map(p => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[10px] font-black text-foreground/50">اختر مستوى الكلاس (الاشتراك):</label>
                    <select
                      value={selectedOptionId}
                      onChange={(e) => setSelectedOptionId(e.target.value)}
                      className="w-full bg-secondary border border-border rounded-xl px-3 py-2 text-xs font-bold outline-none focus:border-primary transition-all cursor-pointer"
                      disabled={!selectedProgramId}
                    >
                      <option value="">-- اختر خياراً --</option>
                      {selectedProgramId && programs.find(p => p.id === selectedProgramId)?.options.map((o: any) => (
                        <option key={o.id} value={o.id}>{o.name} ({o.price} ج.م)</option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              {enrollType === "workshop" && (
                <div className="space-y-1">
                  <label className="block text-xs font-black text-foreground/50">اختر ورشة العمل:</label>
                  <select
                    value={selectedWorkshopId}
                    onChange={(e) => setSelectedWorkshopId(e.target.value)}
                    className="w-full bg-secondary border border-border rounded-xl px-3 py-2 text-xs font-bold outline-none focus:border-primary transition-all cursor-pointer"
                  >
                    <option value="">-- اختر ورشة --</option>
                    {workshops.map(w => (
                      <option key={w.id} value={w.id}>{w.name} ({w.price} ج.م)</option>
                    ))}
                  </select>
                </div>
              )}

              {enrollType === "event" && (
                <div className="space-y-1">
                  <label className="block text-xs font-black text-foreground/50">اختر الحفلة / الفعالية:</label>
                  <select
                    value={selectedEventId}
                    onChange={(e) => setSelectedEventId(e.target.value)}
                    className="w-full bg-secondary border border-border rounded-xl px-3 py-2 text-xs font-bold outline-none focus:border-primary transition-all cursor-pointer"
                  >
                    <option value="">-- اختر فعالية --</option>
                    {events.map(ev => (
                      <option key={ev.id} value={ev.id}>{ev.name} ({ev.price} ج.م)</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Special old client toggles (ONLY for Program option) */}
              {enrollType === "program" && selectedOptionId && (
                <div className="p-4 bg-pink-50/5 border border-border rounded-2xl space-y-3">
                  <label className="flex items-center gap-2 cursor-pointer font-black text-xs text-foreground select-none">
                    <input
                      type="checkbox"
                      checked={isOldClient}
                      onChange={(e) => setIsOldClient(e.target.checked)}
                      className="rounded border-border text-primary focus:ring-primary w-4 h-4 cursor-pointer"
                    />
                    <span>عميلة قديمة؟ (حفظ الحصص المتبقية لها يدوياً)</span>
                  </label>
                  
                  {isOldClient && (
                    <div className="space-y-1 animate-in slide-in-from-top-2 duration-200">
                      <label className="block text-[10px] font-black text-foreground/55">عدد الحصص المتبقية للعميلة حالياً:</label>
                      <input
                        type="number"
                        placeholder="مثال: 5 حصص"
                        value={remainingSessions}
                        onChange={(e) => setRemainingSessions(e.target.value)}
                        className="w-40 bg-card border border-border rounded-xl px-3 py-2 text-xs font-bold outline-none focus:border-primary transition-all text-right"
                      />
                      <p className="text-[9px] text-foreground/45 font-semibold">سيتم استقطاع الحصص المستهلكة من إجمالي الاشتراك تلقائياً.</p>
                    </div>
                  )}
                </div>
              )}

              {/* Financial & Invoice Fields */}
              <div className="grid grid-cols-2 gap-3 p-4 bg-secondary/30 border border-border rounded-2xl">
                <div className="space-y-1">
                  <label className="block text-[10px] font-black text-foreground/50">سعر الاشتراك الإجمالي (ج.م)</label>
                  <input
                    type="number"
                    value={totalAmount}
                    onChange={(e) => setTotalAmount(e.target.value)}
                    className="w-full bg-card border border-border rounded-xl px-3 py-2 text-xs font-black outline-none focus:border-primary transition-all text-right"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-[10px] font-black text-foreground/50">المبلغ المدفوع حالياً (ج.م)</label>
                  <input
                    type="number"
                    value={amountPaid}
                    onChange={(e) => setAmountPaid(e.target.value)}
                    className="w-full bg-card border border-border rounded-xl px-3 py-2 text-xs font-black outline-none focus:border-primary transition-all text-right"
                  />
                </div>

                <div className="space-y-1 col-span-2">
                  <label className="block text-[10px] font-black text-foreground/50">طريقة الدفع:</label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-full bg-card border border-border rounded-xl px-3 py-2 text-xs font-bold outline-none focus:border-primary transition-all cursor-pointer"
                    disabled={parseFloat(amountPaid) <= 0}
                  >
                    <option value="CASH">دفع نقدي (كاش)</option>
                    <option value="POS">دفع بالفيزا (POS)</option>
                  </select>
                </div>

                <div className="space-y-1 col-span-2">
                  <label className="block text-[10px] font-black text-foreground/50">حالة الاشتراك:</label>
                  <select
                    value={enrollmentStatus}
                    onChange={(e) => setEnrollmentStatus(e.target.value as any)}
                    className="w-full bg-card border border-border rounded-xl px-3 py-2 text-xs font-bold outline-none focus:border-primary transition-all cursor-pointer"
                  >
                    <option value="CONFIRMED">نشط / مؤكد الدفع (CONFIRMED)</option>
                    <option value="PENDING">قيد الانتظار (PENDING)</option>
                  </select>
                </div>
              </div>

              {/* Form Controls */}
              <div className="pt-4 border-t border-border flex justify-between gap-4 shrink-0">
                <button
                  type="submit"
                  disabled={isPending}
                  className="bg-primary hover:bg-primary-hover text-white px-6 py-3 rounded-xl font-black text-xs flex items-center justify-center gap-1.5 shadow-md shadow-pink-200/5 hover:scale-[1.02] active:scale-95 transition-all cursor-pointer flex-1"
                >
                  <CheckCircle size={15} />
                  {isPending ? "جاري الحفظ..." : "تأكيد الاشتراك والحفظ"}
                </button>
                
                <button 
                  type="button"
                  onClick={() => setIsEnrollModalOpen(false)}
                  className="bg-secondary hover:bg-border border border-border text-foreground/75 px-5 py-3 rounded-xl font-black text-xs cursor-pointer transition-all active:scale-95"
                >
                  إلغاء
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  )
}
