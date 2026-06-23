"use client"

import { useState } from "react"
import { 
  CalendarDays, 
  Clock, 
  X, 
  Sparkles, 
  MoveRight, 
  ArrowLeft,
  Music, 
  Zap, 
  CheckCircle2, 
  Calendar, 
  BookOpen, 
  Users, 
  HelpCircle,
  Gem,
  Palette,
  Activity,
  Ticket,
  Phone
} from "lucide-react"
import { toast } from "sonner"

export default function ClientPortal({ programs, categories, events, workshops, settings }: any) {
  const [bookingItem, setBookingItem] = useState<{type: string, item: any, option?: any} | null>(null)
  const [clientForm, setClientForm] = useState({ name: "", phone: "", birthDate: "" })
  const [loading, setLoading] = useState(false)
  const [successMsg, setSuccessMsg] = useState("")

  const parsedPaymentMethods = (() => {
    if (!settings?.paymentMethods) return []
    try {
      const parsed = JSON.parse(settings.paymentMethods)
      return Array.isArray(parsed) ? parsed : []
    } catch {
      return []
    }
  })()

  const [selectedMethodId, setSelectedMethodId] = useState<string | null>(null)

  const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]

  const handleBook = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!bookingItem || !clientForm.name || !clientForm.phone) return
    
    // Simple Egyptian phone validation
    const phoneRegex = /^01[0125][0-9]{8}$/
    if (!phoneRegex.test(clientForm.phone.trim())) {
      toast.error("Please enter a valid Egyptian mobile number (e.g., 01012345678)")
      return
    }

    setLoading(true)

    try {
      const res = await fetch('/api/book', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
          name: clientForm.name.trim(),
          phone: clientForm.phone.trim(),
          birthDate: clientForm.birthDate ? new Date(clientForm.birthDate).toISOString() : null,
          type: bookingItem.type,
          itemId: bookingItem.item.id,
          optionId: bookingItem.option?.id
        })
      })
      
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "An error occurred during booking")
      
      setSuccessMsg("Yay! Your booking was successful! 🎊 We can't wait to see you at the Space reception to confirm and start our fun journey together! ✨")
    } catch (err: any) {
      toast.error(err.message || "Something went wrong, please try again!")
    } finally {
      setLoading(false)
    }
  }

  const handleCloseSuccess = () => {
    setBookingItem(null)
    setSuccessMsg("")
    setClientForm({ name: "", phone: "", birthDate: "" })
  }

  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null)

  const getCategoryImage = (catName: string, customImage?: string) => {
    if (customImage && customImage.trim()) return customImage
    const nameLower = catName.toLowerCase()
    if (nameLower.includes("رسم") || nameLower.includes("فنون") || nameLower.includes("فنية") || nameLower.includes("art") || nameLower.includes("paint") || nameLower.includes("creative")) {
      return "https://images.unsplash.com/photo-1513364776144-60967b0f800f?q=80&w=800"
    }
    if (nameLower.includes("تزلج") || nameLower.includes("سكيت") || nameLower.includes("skate") || nameLower.includes("roller")) {
      return "https://images.unsplash.com/photo-1564982751276-897bd4083e07?q=80&w=800"
    }
    if (nameLower.includes("رياض") || nameLower.includes("لياقة") || nameLower.includes("فتنس") || nameLower.includes("كيك") || nameLower.includes("fitness") || nameLower.includes("gym") || nameLower.includes("workout") || nameLower.includes("class")) {
      return "https://images.unsplash.com/photo-1518310383802-640c2de311b2?q=80&w=800"
    }
    if (nameLower.includes("موسيقى") || nameLower.includes("عزف") || nameLower.includes("music")) {
      return "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=800"
    }
    return "https://images.unsplash.com/photo-1518622358385-8ea7d0794bf6?q=80&w=800"
  }

  const getCategoryDesc = (catName: string) => {
    const nameLower = catName.toLowerCase()
    if (nameLower.includes("رسم") || nameLower.includes("فنون") || nameLower.includes("فنية") || nameLower.includes("art") || nameLower.includes("paint") || nameLower.includes("creative")) {
      return "Unleash your artistic side with sketch, oil paint, and clay sculpture under expert guidance."
    }
    if (nameLower.includes("تزلج") || nameLower.includes("سكيت") || nameLower.includes("skate") || nameLower.includes("roller")) {
      return "Learn skate basics and artistic routines with safety, confidence, and absolute fun."
    }
    if (nameLower.includes("رياض") || nameLower.includes("لياقة") || nameLower.includes("فتنس") || nameLower.includes("كيك") || nameLower.includes("fitness") || nameLower.includes("gym") || nameLower.includes("workout") || nameLower.includes("class")) {
      return "Get active, feel strong, and enjoy high-energy workouts in a cozy, private safe space."
    }
    return "Specialized programs designed to nurture your passion and build skills step by step."
  }

  const hasWorkshops = workshops && workshops.length > 0
  const hasEvents = events && events.length > 0

  return (
    <div className="space-y-32">
      
      {/* 1. PROGRAMS SECTION (SIXT COVER STYLE & TICKET VIEW) */}
      <div className="space-y-24">
        {selectedCategoryId === null ? (
          <div className="space-y-12">
            <div className="text-center space-y-4">
              <span className="text-primary font-black text-xs sm:text-sm bg-pink-50 border border-pink-100/50 px-4 py-1.5 rounded-full shadow-sm">Available Classes</span>
              <h3 className="text-3xl sm:text-4xl font-black text-[#121212] tracking-tight">Explore Classes & Workshops at Soly's Space ✨</h3>
              <p className="text-foreground/75 text-xs sm:text-sm font-semibold max-w-xl mx-auto">Pick your favorite category to view the available classes and reserve your spot.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto px-2">
              {categories.map((c: any) => {
                const catPrograms = programs.filter((p: any) => p.categoryId === c.id)
                if (catPrograms.length === 0) return null
                
                const coverImage = getCategoryImage(c.name, c.image)
                const catDesc = getCategoryDesc(c.name)
                const isArt = c.name.toLowerCase().includes("رسم") || c.name.toLowerCase().includes("فنون") || c.name.toLowerCase().includes("art") || c.name.toLowerCase().includes("paint")
                const isSport = c.name.toLowerCase().includes("تزلج") || c.name.toLowerCase().includes("لياقة") || c.name.toLowerCase().includes("skate") || c.name.toLowerCase().includes("fitness") || c.name.toLowerCase().includes("workout")
                const isMusic = c.name.toLowerCase().includes("موسيقى") || c.name.toLowerCase().includes("عزف") || c.name.toLowerCase().includes("music")

                return (
                  <div 
                    key={c.id}
                    onClick={() => setSelectedCategoryId(c.id)}
                    className="relative overflow-hidden rounded-[2.5rem] aspect-[3/4] group shadow-lg cursor-pointer border border-pink-100/10 flex flex-col justify-end p-8 text-white animate-in fade-in zoom-in-95 duration-300"
                  >
                    {/* Background image with hover scale */}
                    <div 
                      className="absolute inset-0 bg-cover bg-center transition-transform duration-700 ease-out group-hover:scale-105"
                      style={{ backgroundImage: `url(${coverImage})` }}
                    ></div>

                    {/* Dark gradient overlay layer (Sixt style) */}
                    <div className="absolute inset-0 bg-gradient-to-t from-[#121212]/95 via-[#121212]/45 to-transparent z-10 transition-opacity duration-300 group-hover:from-black group-hover:via-black/50"></div>

                    {/* Text content overlay */}
                    <div className="relative z-20 space-y-4 text-left">
                      {/* Icon Pill */}
                      <span className="inline-flex items-center justify-center w-10 h-10 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 text-white shadow-sm">
                        {isArt ? <Palette size={20} /> : isSport ? <Activity size={20} /> : isMusic ? <Music size={20} /> : <Sparkles size={20} />}
                      </span>

                      <h4 className="text-2xl font-black tracking-tight drop-shadow-md">
                        {c.name}
                      </h4>

                      <p className="text-white/70 text-xs font-semibold leading-relaxed line-clamp-3">
                        {catDesc}
                      </p>

                      <div className="pt-2 flex justify-between items-center">
                        <span className="text-[10px] font-bold text-white/55 bg-white/5 border border-white/10 px-3 py-1 rounded-full">
                          {catPrograms.length} Classes Available
                        </span>
                        
                        {/* SIXT style pill button */}
                        <span className="inline-flex items-center gap-1.5 border border-white/40 hover:border-white bg-white/10 backdrop-blur-sm group-hover:bg-white group-hover:text-primary transition-all duration-300 px-5 py-2 rounded-full text-xs font-black select-none">
                          Explore Classes ✨
                        </span>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        ) : (
          /* Show selected category programs with back button and header */
          (() => {
            const c = categories.find((cat: any) => cat.id === selectedCategoryId)
            if (!c) return null
            const catPrograms = programs.filter((p: any) => p.categoryId === c.id)
            const coverImage = getCategoryImage(c.name, c.image)
            const isArt = c.name.toLowerCase().includes("رسم") || c.name.toLowerCase().includes("فنون") || c.name.toLowerCase().includes("art") || c.name.toLowerCase().includes("paint")
            const isSport = c.name.toLowerCase().includes("تزلج") || c.name.toLowerCase().includes("لياقة") || c.name.toLowerCase().includes("skate") || c.name.toLowerCase().includes("fitness") || c.name.toLowerCase().includes("workout")
            const isMusic = c.name.toLowerCase().includes("موسيقى") || c.name.toLowerCase().includes("عزف") || c.name.toLowerCase().includes("music")

            return (
              <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
                {/* Back button and banner */}
                <div className="relative rounded-[2.5rem] overflow-hidden p-8 sm:p-12 text-white border border-pink-100/10 min-h-[220px] flex flex-col justify-end">
                  <div 
                    className="absolute inset-0 bg-cover bg-center filter blur-[2px] scale-[1.02]"
                    style={{ backgroundImage: `url(${coverImage})` }}
                  ></div>
                  <div className="absolute inset-0 bg-gradient-to-t from-primary/95 via-pink-900/60 to-transparent z-10"></div>
                  
                  <div className="relative z-20 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 text-left w-full">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20 text-white shadow-sm shrink-0">
                        {isArt ? <Palette size={26} /> : isSport ? <Activity size={26} /> : isMusic ? <Music size={26} /> : <Sparkles size={26} />}
                      </div>
                      <div>
                        <h3 className="text-3xl font-black tracking-tight">{c.name}</h3>
                        <p className="text-white/70 text-xs font-semibold mt-1">Browse schedules, details, and claim your spot in just a few clicks!</p>
                      </div>
                    </div>

                    <button 
                      onClick={() => setSelectedCategoryId(null)}
                      className="inline-flex items-center gap-2 bg-[#121212]/50 hover:bg-[#121212]/80 backdrop-blur-md text-white border border-white/10 px-6 py-3.5 rounded-full text-xs font-black shadow-lg transition-all active:scale-95 cursor-pointer shrink-0"
                    >
                      <ArrowLeft size={16} /> Back to Categories
                    </button>
                  </div>
                </div>

                {/* Programs Ticket Passes Grid */}
                <div className="space-y-8 max-w-5xl mx-auto">
                  {catPrograms.map((p: any) => {
                    const slotsLeft = p.capacity - (p._count?.enrollments || 0)
                    const pctFilled = Math.min(100, Math.round(((p._count?.enrollments || 0) / p.capacity) * 100))

                    return (
                      <div 
                        key={p.id} 
                        className="relative bg-white rounded-[2rem] border border-pink-100/60 shadow-[0_10px_35px_rgba(236,72,153,0.03)] hover:shadow-[0_20px_60px_rgba(236,72,153,0.08)] hover:border-primary/30 transition-all duration-500 flex flex-col group overflow-hidden"
                      >
                        {/* Premium Top Decorative Glowing Line */}
                        <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-primary via-pink-400 to-pink-200 z-20"></div>

                        <div className="p-6 sm:p-8 space-y-6 text-left z-10">
                          
                          <div className="flex justify-between items-start gap-4">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h4 className="text-xl sm:text-2xl font-black text-[#121212] group-hover:text-primary transition-colors leading-tight">
                                {p.name}
                              </h4>
                              {(p.name.includes("مبتدئ") || p.name.toLowerCase().includes("beginner")) && (
                                <span className="shrink-0 text-[9px] font-black text-green-600 bg-green-50 px-2 py-0.5 rounded-lg border border-green-100/50">Beginner 🌟</span>
                              )}
                              {(p.name.includes("متقدم") || p.name.toLowerCase().includes("pro") || p.name.toLowerCase().includes("advanced")) && (
                                <span className="shrink-0 text-[9px] font-black text-purple-600 bg-purple-50 px-2 py-0.5 rounded-lg border border-purple-100/50">Pro 🔥</span>
                              )}
                            </div>
                            <span className="shrink-0 inline-flex items-center gap-1.5 py-1 px-3.5 rounded-full bg-pink-50 text-primary font-black text-[9px] border border-pink-100/40">
                              <Gem size={10} className="text-primary animate-pulse" /> Certified Training
                            </span>
                          </div>

                          <p className="text-foreground/60 text-xs sm:text-sm leading-relaxed font-semibold">
                            {p.description || "Join us in this level designed to elevate your skills in a vibrant, judgment-free zone with certified bestie coaches."}
                          </p>

                          {/* Options List */}
                          <div className="space-y-4">
                            {p.options && p.options.length > 0 ? p.options.map((opt: any) => {
                              const slotsLeft = opt.capacity - (opt._count?.enrollments || 0)
                              const pctFilled = Math.min(100, Math.round(((opt._count?.enrollments || 0) / opt.capacity) * 100))
                              return (
                                <div key={opt.id} className="bg-[#FFF5F8]/50 border border-pink-100/40 rounded-2xl p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                                  
                                  {/* Info */}
                                  <div className="flex-1 space-y-3">
                                    <h5 className="font-black text-[#121212] text-lg">{opt.name}</h5>
                                    
                                    <div className="flex flex-wrap items-center gap-4 text-xs font-semibold text-foreground/60">
                                      <div className="flex items-center gap-1.5 bg-white border border-pink-100/50 px-3 py-1.5 rounded-xl">
                                        <Clock size={14} className="text-primary" /> {opt.sessionsPerMonth} sessions per month
                                      </div>
                                      
                                      {opt.schedules.length > 0 && (
                                        <div className="flex items-center gap-1.5 bg-white border border-pink-100/50 px-3 py-1.5 rounded-xl">
                                          <CalendarDays size={14} className="text-primary" />
                                          <div className="flex gap-1 flex-wrap">
                                            {opt.schedules.map((sch: any, i: number) => (
                                              <span key={i}>{days[sch.dayOfWeek]} {sch.startTime}</span>
                                            ))}
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                    
                                    {opt.capacity > 0 && (
                                      <div className="flex items-center gap-3 text-[11px] max-w-xs mt-2">
                                        <span className="text-foreground/50 shrink-0">Spots left: {slotsLeft}/{opt.capacity}</span>
                                        <div className="flex-1 bg-pink-100/40 h-1.5 rounded-full overflow-hidden">
                                          <div className="bg-primary h-full rounded-full" style={{ width: `${pctFilled}%` }}></div>
                                        </div>
                                      </div>
                                    )}
                                  </div>

                                  {/* Price and Book Button */}
                                  <div className="w-full md:w-auto shrink-0 flex flex-row md:flex-col items-center justify-between gap-4 md:gap-3 bg-white p-4 rounded-xl border border-pink-100/50 shadow-sm text-center">
                                    <div className="flex items-baseline gap-1.5">
                                      <span className="text-2xl font-black text-primary">{opt.price}</span>
                                      <span className="text-xs font-bold text-foreground/50">EGP</span>
                                    </div>
                                    <button 
                                      onClick={() => setBookingItem({ type: "PROGRAM", item: p, option: opt })}
                                      className="bg-[#121212] hover:bg-primary text-white hover:scale-[1.03] active:scale-95 py-2.5 px-6 rounded-xl text-xs font-black transition-all shadow-md cursor-pointer flex items-center justify-center gap-1.5"
                                    >
                                      Book Now ✨
                                    </button>
                                  </div>

                                </div>
                              )
                            }) : (
                              <div className="text-sm font-bold text-foreground/40 text-center py-4">No pricing tiers set for this program yet.</div>
                            )}
                          </div>
                          
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })()
        )}
      </div>

      {/* 2. WORKSHOPS SECTION (MASTERCLASS TICKETS) */}
      {hasWorkshops && (
        <div className="space-y-16">
          
          {/* Section Header */}
          <div className="flex flex-col items-center text-center space-y-4">
            <span className="inline-flex items-center gap-1.5 text-[10px] sm:text-xs font-black tracking-widest text-orange-600 uppercase bg-orange-50 border border-orange-100/40 px-4 py-2 rounded-full shadow-sm">
              <Zap size={12} className="text-orange-500 animate-bounce" /> Workshops & Creative Skills
            </span>
            <h3 className="text-3xl sm:text-4xl font-black text-[#121212] tracking-tight">
              Creative Workshops
            </h3>
            <div className="w-16 h-1 bg-gradient-to-r from-orange-400 to-pink-300 rounded-full"></div>
            <p className="text-sm sm:text-base text-foreground/75 font-semibold max-w-md mx-auto">
              Break the routine and learn new skills with our cozy workshops and interactive challenges.
            </p>
          </div>

          {/* Workshops Grid */}
          <div className="space-y-8 max-w-5xl mx-auto">
            {workshops.map((w: any) => {
              const spotsLeft = w.capacity - (w._count?.enrollments || 0)
              const pctFilled = Math.min(100, Math.round(((w._count?.enrollments || 0) / w.capacity) * 100))

              return (
                <div 
                  key={w.id} 
                  className="relative bg-white rounded-[2rem] border border-orange-100/40 shadow-[0_10px_35px_rgba(249,115,22,0.02)] hover:shadow-[0_20px_60px_rgba(249,115,22,0.08)] hover:border-orange-500/20 transition-all duration-500 flex flex-col md:flex-row group"
                >
                  {/* Decorative glowing top accent */}
                  <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-orange-500 via-orange-400 to-pink-300 rounded-t-[2rem] z-20"></div>

                  {/* Details column (flows first on mobile) */}
                  <div className="flex-1 p-6 sm:p-8 flex flex-col justify-between gap-5 text-left rounded-t-[2rem] md:rounded-t-none md:rounded-r-[2rem] z-10">
                    
                    <div className="space-y-4">
                      
                      {/* Title row with physical calendar sheet */}
                      <div className="flex items-start gap-4">
                        
                        {/* Physical Calendar Sheet layout */}
                        <div className="w-12 h-14 bg-white border border-orange-100 rounded-xl shadow-sm flex flex-col overflow-hidden shrink-0 select-none">
                          <div className="bg-orange-500 text-white text-[8px] font-black py-0.5 text-center uppercase tracking-wider">
                            {new Date(w.startDate).toLocaleString('en-US', { month: 'short' })}
                          </div>
                          <div className="flex-1 flex items-center justify-center text-lg font-black text-[#121212] leading-none">
                            {new Date(w.startDate).getDate()}
                          </div>
                        </div>

                        <div className="flex-1 space-y-1">
                          <h4 className="text-xl sm:text-2xl font-black text-[#121212] group-hover:text-orange-500 transition-colors leading-tight">
                            {w.name}
                          </h4>
                          
                          <div className="flex gap-2 flex-wrap justify-start">
                            <span className="inline-flex items-center gap-1.5 py-0.5 px-2.5 rounded-lg bg-orange-50 text-orange-600 font-bold text-[10px] border border-orange-100/50">
                              👩‍🏫 Expert Coach
                            </span>
                            <span className="inline-flex items-center gap-1.5 py-0.5 px-2.5 rounded-lg bg-pink-50 text-primary font-bold text-[10px] border border-pink-100/30">
                              👥 Capacity: {w.capacity} girls
                            </span>
                          </div>
                        </div>

                      </div>

                      <p className="text-foreground/60 text-xs sm:text-sm leading-relaxed font-semibold">
                        {w.description || "A cozy, hands-on workshop to learn a new skill, explore your creative side, and make new besties."}
                      </p>

                    </div>

                    {/* Remaining Spots Progress Bar */}
                    <div className="space-y-2 max-w-sm mr-auto w-full">
                      <div className="flex justify-between text-[11px] font-bold text-foreground/50">
                        <span className="text-orange-600 font-black flex items-center gap-1">
                          <span className="w-1.5 h-1.5 bg-orange-500 rounded-full animate-ping"></span> Only {spotsLeft} spots left!
                        </span>
                        <span>{pctFilled}% filled</span>
                      </div>
                      <div className="w-full bg-orange-50 h-2 rounded-full overflow-hidden border border-orange-100/20">
                        <div className="bg-gradient-to-r from-orange-400 to-orange-500 h-full rounded-full transition-all duration-500" style={{ width: `${pctFilled}%` }}></div>
                      </div>
                    </div>

                  </div>

                  {/* Cutout Divider with orange-toned borders */}
                  <div className="relative flex md:flex-col items-center justify-center shrink-0 py-4 md:py-8 px-8 md:px-4 z-20">
                    <div className="hidden md:block w-6 h-6 bg-[#FFF5F8] border border-orange-100/60 rounded-full absolute -top-3 left-1/2 -translate-x-1/2 z-30 shadow-[inset_0_-4px_6px_-1px_rgba(249,115,22,0.02)]"></div>
                    <div className="hidden md:block w-6 h-6 bg-[#FFF5F8] border border-orange-100/60 rounded-full absolute -bottom-3 left-1/2 -translate-x-1/2 z-30 shadow-[inset_0_4px_6px_-1px_rgba(249,115,22,0.02)]"></div>
                    <div className="md:hidden w-6 h-6 bg-[#FFF5F8] border border-orange-100/60 rounded-full absolute -left-3 top-1/2 -translate-y-1/2 z-30 shadow-[inset_-4px_0_6px_-1px_rgba(249,115,22,0.02)]"></div>
                    <div className="md:hidden w-6 h-6 bg-[#FFF5F8] border border-orange-100/60 rounded-full absolute -right-3 top-1/2 -translate-y-1/2 z-30 shadow-[inset_4px_0_6px_-1px_rgba(249,115,22,0.02)]"></div>
                    
                    <div className="w-full md:w-px h-px md:h-full border-t md:border-r border-dashed border-orange-200/80"></div>
                  </div>

                  {/* Pricing / CTA column (flows last) */}
                  <div className="w-full md:w-64 p-6 sm:p-8 bg-orange-50/5 flex flex-col justify-between items-center text-center gap-5 rounded-b-[2rem] md:rounded-b-none md:rounded-l-[2rem] z-10">
                    <div className="space-y-1">
                      <div className="text-3xl font-black text-[#121212] flex items-baseline justify-center gap-1">
                        {w.price}
                        <span className="text-xs font-bold text-foreground/50">EGP</span>
                      </div>
                      <p className="text-[10px] font-black text-orange-600 uppercase tracking-wider">
                        Full access ticket to the entire workshop
                      </p>
                    </div>

                    <button
                      onClick={() => setBookingItem({ type: "WORKSHOP", item: w })}
                      className="w-full bg-[#121212] hover:bg-orange-500 hover:scale-[1.02] text-white py-4 rounded-2xl font-black text-sm transition-all shadow-md shadow-orange-200/5 active:scale-95 flex items-center justify-center gap-1.5 group/btn cursor-pointer"
                    >
                      Claim My Ticket ✨
                      <Zap size={14} className="animate-pulse text-yellow-300 group-hover/btn:scale-125 transition-transform" />
                    </button>
                  </div>

                </div>
              )
            })}
          </div>

        </div>
      )}

      {/* 3. EVENTS SECTION (VIP PARTY TICKETS) */}
      {hasEvents && (
        <div className="space-y-16">
          
          {/* Section Header */}
          <div className="flex flex-col items-center text-center space-y-4">
            <span className="inline-flex items-center gap-1.5 text-[10px] sm:text-xs font-black tracking-widest text-purple-600 uppercase bg-purple-50 border border-purple-100/40 px-4 py-2 rounded-full shadow-sm">
              <Music size={12} className="text-purple-500 animate-pulse" /> Parties & Special Events
            </span>
            <h3 className="text-3xl sm:text-4xl font-black text-[#121212] tracking-tight">
              Parties & Events
            </h3>
            <div className="w-16 h-1 bg-gradient-to-r from-purple-500 to-pink-300 rounded-full"></div>
            <p className="text-sm sm:text-base text-foreground/75 font-semibold max-w-md mx-auto">
              Share beautiful moments and make unforgettable memories in our cozy, strictly girls-only space.
            </p>
          </div>

          {/* Events Grid */}
          <div className="space-y-8 max-w-5xl mx-auto">
            {events.map((e: any) => (
              <div 
                key={e.id} 
                className="relative bg-white rounded-[2rem] border border-purple-100/40 shadow-[0_10px_35px_rgba(147,51,234,0.02)] hover:shadow-[0_20px_60px_rgba(147,51,234,0.08)] hover:border-purple-500/20 transition-all duration-500 flex flex-col md:flex-row group"
              >
                {/* Glowing top line with violet theme */}
                <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-purple-600 via-purple-400 to-pink-300 rounded-t-[2rem] z-20"></div>

                {/* Details column (flows first on mobile) */}
                <div className="flex-1 p-6 sm:p-8 flex flex-col md:flex-row justify-between gap-5 text-left items-stretch rounded-t-[2rem] md:rounded-t-none md:rounded-r-[2rem] z-10">
                  
                  <div className="space-y-4 flex-1">
                    
                    <div className="flex justify-between items-start gap-4">
                      <h4 className="text-xl sm:text-2xl font-black text-[#121212] group-hover:text-purple-600 transition-colors leading-tight">
                        {e.name}
                      </h4>
                      <span className="shrink-0 inline-flex items-center gap-1.5 py-1 px-4 rounded-xl bg-purple-50 text-purple-600 font-black text-[9px] border border-purple-100/30">
                        🎉 Strictly Girls Only Party
                      </span>
                    </div>

                    {/* Date Time Badge layout */}
                    <div className="text-xs font-bold text-foreground/60 bg-purple-50/20 border border-purple-100/30 py-2.5 px-4 rounded-2xl flex items-center justify-center gap-2 w-max mr-auto">
                      <CalendarDays size={14} className="text-purple-500 shrink-0" /> 
                      <span>
                        {new Date(e.date).toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'short' })}
                      </span>
                      <span className="text-purple-300">|</span>
                      <span>
                        {new Date(e.date).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    <p className="text-foreground/60 text-xs sm:text-sm leading-relaxed font-semibold">
                      {e.description || "Join us for a fun gathering to laugh, connect, and celebrate absolute girl power at the Space."}
                    </p>

                  </div>

                  {/* Simulated Visual Barcode stub (Linear/Framer UI Style) */}
                  <div className="hidden lg:flex flex-col gap-0.5 opacity-25 h-full justify-between py-2 shrink-0 border-r border-purple-100/30 pr-6 select-none" aria-hidden="true">
                    <div className="flex gap-[2.5px] h-20 items-center">
                      {[2, 1, 3, 1, 2, 4, 1, 2, 3, 1, 2, 1, 4, 2, 1, 2, 1, 3, 1, 2].map((w, idx) => (
                        <div key={idx} className="bg-purple-950 h-full rounded-[1px]" style={{ width: `${w}px` }}></div>
                      ))}
                    </div>
                    <span className="text-[7px] font-mono tracking-widest text-purple-950 text-center">SOLY-VIP-{e.id.slice(-4).toUpperCase()}</span>
                  </div>

                </div>

                {/* Cutout Divider with purple theme borders */}
                <div className="relative flex md:flex-col items-center justify-center shrink-0 py-4 md:py-8 px-8 md:px-4 z-20">
                  <div className="hidden md:block w-6 h-6 bg-[#FFF5F8] border border-purple-100/60 rounded-full absolute -top-3 left-1/2 -translate-x-1/2 z-30 shadow-[inset_0_-4px_6px_-1px_rgba(147,51,234,0.02)]"></div>
                  <div className="hidden md:block w-6 h-6 bg-[#FFF5F8] border border-purple-100/60 rounded-full absolute -bottom-3 left-1/2 -translate-x-1/2 z-30 shadow-[inset_0_4px_6px_-1px_rgba(147,51,234,0.02)]"></div>
                  <div className="md:hidden w-6 h-6 bg-[#FFF5F8] border border-purple-100/60 rounded-full absolute -left-3 top-1/2 -translate-y-1/2 z-30 shadow-[inset_-4px_0_6px_-1px_rgba(147,51,234,0.02)]"></div>
                  <div className="md:hidden w-6 h-6 bg-[#FFF5F8] border border-purple-100/60 rounded-full absolute -right-3 top-1/2 -translate-y-1/2 z-30 shadow-[inset_4px_0_6px_-1px_rgba(147,51,234,0.02)]"></div>
                  
                  <div className="w-full md:w-px h-px md:h-full border-t md:border-r border-dashed border-purple-200/80"></div>
                </div>

                {/* Pricing / CTA column (flows last) */}
                <div className="w-full md:w-64 p-6 sm:p-8 bg-purple-50/5 flex flex-col justify-between items-center text-center gap-5 rounded-b-[2rem] md:rounded-b-none md:rounded-l-[2rem] z-10">
                  <div className="space-y-1">
                    <div className="text-3xl font-black text-[#121212] flex items-baseline justify-center gap-1">
                      {e.price}
                      <span className="text-xs font-bold text-foreground/50">EGP</span>
                    </div>
                    <p className="text-[10px] font-black text-purple-600 uppercase tracking-wider">
                      Ticket price for the event
                    </p>
                  </div>

                  <button
                    onClick={() => setBookingItem({ type: "EVENT", item: e })}
                    className="w-full bg-[#121212] hover:bg-purple-600 hover:scale-[1.02] text-white py-4 rounded-2xl font-black text-sm transition-all shadow-md shadow-purple-200/5 active:scale-95 flex items-center justify-center gap-1.5 group/btn cursor-pointer"
                  >
                    Book My Ticket ✨
                    <Zap size={14} className="animate-pulse text-yellow-300 group-hover/btn:scale-125 transition-transform" />
                  </button>
                </div>

              </div>
            ))}
          </div>

        </div>
      )}

      {/* Booking Dialog Modal (Glassmorphic Backdrop) */}
      {bookingItem && (
        <div className="fixed inset-0 bg-[#121212]/40 backdrop-blur-2xl z-[100] flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="bg-white border border-pink-100/80 w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 relative">
            
            {successMsg ? (
              /* Success screen layout */
              <div className="p-8 sm:p-10 text-center">
                <div className="w-20 h-20 bg-green-50 text-green-500 rounded-full flex items-center justify-center mx-auto mb-6 border border-green-100 shadow-lg shadow-green-200/10 animate-bounce">
                  <CheckCircle2 size={38} />
                </div>
                
                <h3 className="text-2xl font-black mb-4 text-[#121212]">Your Booking Was Successful! 🎊</h3>
                <p className="text-foreground/75 text-sm sm:text-base font-semibold leading-relaxed text-left">
                  {successMsg}
                </p>
                
                <button 
                  onClick={handleCloseSuccess} 
                  className="mt-8 bg-[#121212] hover:bg-primary text-white px-6 py-4 rounded-2xl text-base font-black w-full shadow-lg shadow-pink-200/20 transition-all active:scale-95 cursor-pointer"
                >
                  Yay, got it!
                </button>
              </div>
            ) : (
              /* Input form layout */
              <>
                <div className="bg-pink-50/10 p-6 sm:p-8 border-b border-pink-100/30 relative text-left">
                  <button 
                    onClick={() => setBookingItem(null)} 
                    className="absolute right-6 top-6 text-foreground/45 hover:text-primary transition-all bg-white p-2 rounded-full shadow-sm border border-pink-100 cursor-pointer"
                  >
                    <X size={16} />
                  </button>

                  <div className="flex justify-between items-start gap-4 text-left mt-2">
                    <div>
                      <span className="text-[10px] font-black text-primary uppercase tracking-widest mb-1.5 block flex items-center gap-1.5">
                        <Sparkles size={12} className="text-primary animate-pulse" /> Reserve Your Spot
                      </span>
                      <h3 className="text-2xl font-black text-[#121212] leading-tight">
                        {bookingItem.item.name} {bookingItem.option && <span className="text-primary font-bold text-sm block mt-1">{bookingItem.option.name}</span>}
                      </h3>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-[9px] font-bold text-foreground/40 block mb-1">Price</span>
                      <div className="text-2xl font-black text-primary leading-none">
                        {bookingItem.option ? bookingItem.option.price : bookingItem.item.price} <span className="text-xs font-bold text-foreground/50">EGP</span>
                      </div>
                    </div>
                  </div>
                  
                  {parsedPaymentMethods.length > 0 ? (
                    <div className="mt-4 text-left w-full">
                      <label className="block text-xs font-black text-foreground/70 mb-2">💳 Choose Payment Method</label>
                      <div className="space-y-2">
                        {parsedPaymentMethods.map((m: any) => (
                          <div key={m.id} className="border border-pink-100/50 rounded-xl overflow-hidden transition-all">
                            <label className="flex items-center justify-start gap-3 p-3 cursor-pointer bg-white hover:bg-pink-50/30">
                              <input 
                                type="radio" 
                                name="paymentMethod" 
                                value={m.id} 
                                checked={selectedMethodId === m.id}
                                onChange={() => setSelectedMethodId(m.id)}
                                className="w-4 h-4 text-primary focus:ring-primary/20 accent-primary"
                              />
                              <span className="font-bold text-sm text-[#121212]">{m.name}</span>
                            </label>
                            {selectedMethodId === m.id && (
                              <div className="bg-[#FFF5F8] p-4 text-xs font-semibold text-foreground/80 border-t border-pink-100/50 text-left space-y-3">
                                {m.account && (
                                  <div className="flex items-center justify-between gap-4">
                                    <span className="text-foreground/50 font-bold text-[10px] uppercase">Account Number / User</span>
                                    <span className="font-mono text-sm font-black bg-white px-3 py-1.5 rounded-lg border border-pink-100 inline-block select-all">{m.account}</span>
                                  </div>
                                )}
                                {m.link && (
                                  <div className="flex items-center justify-start gap-2">
                                    <span className="text-primary">🔗</span>
                                    <a href={m.link} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-black text-xs">Click here to open payment link</a>
                                  </div>
                                )}
                                {m.note && (
                                  <div className="text-[11px] text-foreground/60 bg-pink-50/50 p-2.5 rounded-lg border border-pink-100/30">
                                    💡 {m.note}
                                  </div>
                                )}
                                {/* Fallback for old details format if any */}
                                {!m.account && !m.link && !m.note && m.details && (
                                  <div className="whitespace-pre-line">{m.details}</div>
                                )}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="mt-4 text-[10px] font-bold text-foreground/50 bg-[#FFF5F8] border border-pink-100/35 px-4.5 py-2.5 rounded-2xl text-center w-full leading-relaxed">
                      💡 You can pay later at the Space reception to confirm and activate your booking.
                    </div>
                  )}
                </div>

                <form onSubmit={handleBook} className="p-6 sm:p-8 space-y-6 text-left">
                  <div>
                    <label className="flex items-center gap-2 text-xs font-black text-foreground/70 mb-2 justify-start">
                      <Users size={14} className="text-primary" />
                      <span>Your Full Name</span>
                    </label>
                    <input 
                      required 
                      type="text" 
                      value={clientForm.name} 
                      onChange={e => setClientForm({ ...clientForm, name: e.target.value })} 
                      className="w-full bg-white border border-slate-200 hover:border-pink-200 focus:border-primary rounded-2xl py-3.5 px-4 text-sm font-semibold focus:ring-4 focus:ring-primary/5 outline-none transition-all text-left shadow-[0_2px_4px_rgba(0,0,0,0.01)] placeholder:text-foreground/35" 
                      placeholder="Enter your full name..." 
                    />
                  </div>

                  <div>
                    <label className="flex items-center gap-2 text-xs font-black text-foreground/70 mb-2 justify-start">
                      <CalendarDays size={14} className="text-primary" />
                      <span>Birth Date</span>
                    </label>
                    <input 
                      required 
                      type="date" 
                      value={clientForm.birthDate} 
                      onChange={e => setClientForm({ ...clientForm, birthDate: e.target.value })} 
                      className="w-full bg-white border border-slate-200 hover:border-pink-200 focus:border-primary rounded-2xl py-3.5 px-4 text-sm font-semibold focus:ring-4 focus:ring-primary/5 outline-none transition-all text-left shadow-[0_2px_4px_rgba(0,0,0,0.01)] text-foreground/80" 
                    />
                  </div>

                  <div>
                    <label className="flex items-center gap-2 text-xs font-black text-foreground/70 mb-2 justify-start">
                      <Phone size={14} className="text-primary" />
                      <span>Mobile Number (WhatsApp)</span>
                    </label>
                    <input 
                      required 
                      type="tel" 
                      value={clientForm.phone} 
                      onChange={e => setClientForm({ ...clientForm, phone: e.target.value })} 
                      className="w-full bg-white border border-slate-200 hover:border-pink-200 focus:border-primary rounded-2xl py-3.5 px-4 text-sm font-semibold focus:ring-4 focus:ring-primary/5 outline-none transition-all text-left shadow-[0_2px_4px_rgba(0,0,0,0.01)] placeholder:text-foreground/35" 
                      placeholder="01xxxxxxxxx" 
                    />
                    <p className="text-[10px] text-foreground/45 font-bold mt-2.5 flex items-center gap-1.5 justify-start">
                      <HelpCircle size={12} className="text-primary shrink-0" /> 
                      <span>Your phone number is used for logging in to track your schedules and attendance.</span>
                    </p>
                  </div>

                  <button 
                    type="submit" 
                    disabled={loading} 
                    className="w-full bg-[#121212] hover:bg-primary text-white py-4.5 rounded-2xl font-black text-sm mt-3 transition-all duration-300 shadow-md shadow-pink-200/5 active:scale-[0.98] flex items-center justify-center gap-2 group/btn cursor-pointer"
                  >
                    {loading ? "Submitting your request..." : <>Confirm & Reserve Now <MoveRight size={18} /></>}
                  </button>
                </form>
              </>
            )}

          </div>
        </div>
      )}

    </div>
  )
}
