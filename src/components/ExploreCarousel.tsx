"use client"

import { useState, useRef, useEffect } from "react"
import { 
  Sparkles, 
  Palette, 
  Activity, 
  Music, 
  Zap, 
  Ticket, 
  CalendarDays, 
  ArrowLeft, 
  ArrowRight,
  User,
  ArrowUpRight
} from "lucide-react"

interface ExploreCarouselProps {
  programs: any[]
  categories: any[]
  events: any[]
  workshops: any[]
}

export default function ExploreCarousel({ 
  programs = [], 
  categories = [],
  events = [], 
  workshops = [], 
}: ExploreCarouselProps) {
  const [activeTab, setActiveTab] = useState<"classes" | "workshops" | "events">("classes")
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const [showLeftArrow, setShowLeftArrow] = useState(false)
  const [showRightArrow, setShowRightArrow] = useState(true)

  // Auto check scroll arrows visibility
  const checkScrollArrows = () => {
    const container = scrollContainerRef.current
    if (container) {
      const { scrollLeft, scrollWidth, clientWidth } = container
      setShowLeftArrow(scrollLeft > 10)
      setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 10)
    }
  }

  useEffect(() => {
    const container = scrollContainerRef.current
    if (container) {
      container.addEventListener("scroll", checkScrollArrows)
      // Initial check
      checkScrollArrows()
      // Check on resize
      window.addEventListener("resize", checkScrollArrows)
    }
    return () => {
      if (container) {
        container.removeEventListener("scroll", checkScrollArrows)
      }
      window.removeEventListener("resize", checkScrollArrows)
    }
  }, [activeTab, programs, workshops, events])

  const scroll = (direction: "left" | "right") => {
    const container = scrollContainerRef.current
    if (container) {
      const scrollAmount = container.clientWidth * 0.75
      container.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth"
      })
    }
  }

  // Helper: Get Program Category Image
  const getCategoryImage = (catName: string, customImage?: string | null) => {
    const nameLower = catName.toLowerCase()
    if (nameLower.includes("belly") || nameLower.includes("رقص")) {
      return "/belly_dance.png"
    }
    if (nameLower.includes("fitness") || nameLower.includes("لياقة") || nameLower.includes("فتنس") || nameLower.includes("رياض")) {
      return "/fitness.png"
    }
    if (nameLower.includes("kick") || nameLower.includes("كيك")) {
      return "/kickboxing.png"
    }
    if (nameLower.includes("skat") || nameLower.includes("تزلج") || nameLower.includes("سكيت") || nameLower.includes("roller")) {
      return "/skating.png"
    }
    if (nameLower.includes("yoga") || nameLower.includes("يوجا")) {
      return "/yoga.png"
    }
    if (customImage && !customImage.includes("unsplash.com") && customImage.trim() !== "") return customImage
    if (nameLower.includes("رسم") || nameLower.includes("فنون") || nameLower.includes("art") || nameLower.includes("paint")) {
      return "https://images.unsplash.com/photo-1513364776144-60967b0f800f?q=80&w=800"
    }
    if (nameLower.includes("موسيقى") || nameLower.includes("عزف") || nameLower.includes("music")) {
      return "https://images.unsplash.com/photo-1520523839897-bd0b52f945a0?q=80&w=800"
    }
    return "/cozy_safe_zone.png"
  }

  // Helper: Get Category Description
  const getCategoryDesc = (catName: string) => {
    const nameLower = catName.toLowerCase()
    if (nameLower.includes("belly") || nameLower.includes("رقص")) {
      return "Graceful belly dance classes for fitness and fun. Tuesday 8:30–9:30 PM & Sunday."
    }
    if (nameLower.includes("kick") || nameLower.includes("كيك")) {
      return "Build strength, learn self-defense, and release stress with high-intensity kickboxing workouts."
    }
    if (nameLower.includes("skat") || nameLower.includes("تزلج") || nameLower.includes("سكيت") || nameLower.includes("roller")) {
      return "Learn skate basics, balance, and artistic routines with safety, confidence, and absolute fun."
    }
    if (nameLower.includes("yoga") || nameLower.includes("يوجا")) {
      return "Relax your mind, improve flexibility, and find inner peace with mindful stretching and yoga flows."
    }
    if (nameLower.includes("fitness") || nameLower.includes("لياقة") || nameLower.includes("فتنس") || nameLower.includes("رياض")) {
      return "Get active, feel strong, and enjoy high-energy workouts in a cozy, private safe space."
    }
    if (nameLower.includes("رسم") || nameLower.includes("فنون") || nameLower.includes("art") || nameLower.includes("paint") || nameLower.includes("creative")) {
      return "Unleash your artistic side with sketch, oil paint, and clay sculpture under expert guidance."
    }
    return "Specialized programs designed to nurture your passion and build skills step by step."
  }

  // Helper: Get Workshop Image
  const getWorkshopImage = (wName: string) => {
    const nameLower = wName.toLowerCase()
    if (nameLower.includes("art") || nameLower.includes("رسم") || nameLower.includes("paint") || nameLower.includes("رصاص") || nameLower.includes("فحم")) {
      return "https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?q=80&w=800"
    }
    if (nameLower.includes("clay") || nameLower.includes("صلصال") || nameLower.includes("فخار") || nameLower.includes("pottery")) {
      return "https://images.unsplash.com/photo-1565192647048-f997ded87abf?q=80&w=800"
    }
    if (nameLower.includes("dance") || nameLower.includes("رقص") || nameLower.includes("zumba") || nameLower.includes("زومبا")) {
      return "https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?q=80&w=800"
    }
    if (nameLower.includes("yoga") || nameLower.includes("يوجا") || nameLower.includes("stretch")) {
      return "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?q=80&w=800"
    }
    if (nameLower.includes("makeup") || nameLower.includes("ميك اب") || nameLower.includes("مكياج")) {
      return "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?q=80&w=800"
    }
    return "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?q=80&w=800"
  }

  // Helper: Get Event Image
  const getEventImage = (eName: string) => {
    const nameLower = eName.toLowerCase()
    if (nameLower.includes("party") || nameLower.includes("حفلة") || nameLower.includes("dj") || nameLower.includes("دي جي") || nameLower.includes("night")) {
      return "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?q=80&w=800"
    }
    if (nameLower.includes("karaoke") || nameLower.includes("كاراوكي") || nameLower.includes("sing") || nameLower.includes("غناء")) {
      return "https://images.unsplash.com/photo-1516280440614-37939bbacd6a?q=80&w=800"
    }
    if (nameLower.includes("movie") || nameLower.includes("سينما") || nameLower.includes("فيلم")) {
      return "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?q=80&w=800"
    }
    if (nameLower.includes("concert") || nameLower.includes("عزف") || nameLower.includes("موسيقى")) {
      return "https://images.unsplash.com/photo-1465847899084-d164df4dedc6?q=80&w=800"
    }
    return "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=800"
  }

  // Helpers: Icon mappings
  const getCategoryIcon = (catName: string) => {
    const nameLower = catName.toLowerCase()
    if (nameLower.includes("رسم") || nameLower.includes("فنون") || nameLower.includes("art") || nameLower.includes("paint")) return <Palette size={16} />
    if (nameLower.includes("تزلج") || nameLower.includes("لياقة") || nameLower.includes("skate") || nameLower.includes("fitness") || nameLower.includes("workout")) return <Activity size={16} />
    if (nameLower.includes("موسيقى") || nameLower.includes("عزف") || nameLower.includes("music")) return <Music size={16} />
    return <Sparkles size={16} />
  }

  return (
    <section id="explore-offerings" className="py-12 md:py-20 bg-transparent overflow-hidden relative">
      
      {/* Decorative background blur patterns */}
      <div className="absolute top-1/4 -left-32 w-80 h-80 bg-pink-100/40 rounded-full filter blur-3xl pointer-events-none -z-10"></div>
      <div className="absolute bottom-1/4 -right-32 w-80 h-80 bg-purple-100/30 rounded-full filter blur-3xl pointer-events-none -z-10"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center space-y-3 mb-10">
          <span className="inline-flex items-center gap-1.5 text-[10px] sm:text-xs font-black tracking-widest text-[#D13F7A] uppercase bg-pink-50 border border-pink-100/50 px-3.5 py-1.5 rounded-full">
            ✦ Explore Soly's Space ✦
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-4.5xl font-black font-display text-[#1A1A1A] tracking-tight">
            Our <span className="text-[#D13F7A] italic">Vibes & Offerings</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 font-bold max-w-lg mx-auto">
            Swipe through our active classes, creative masterclasses, and exciting community events.
          </p>
        </div>

        {/* 3-Way Toggle switcher (Fully responsive sizes for mobile viewports) */}
        <div className="flex justify-center mb-10 px-4">
          <div className="bg-white border border-pink-100/60 p-1 rounded-full flex gap-1 shadow-xs w-full max-w-[340px] sm:max-w-md">
            
            {/* Classes/Programs Tab */}
            <button
              onClick={() => setActiveTab("classes")}
              className={`flex-1 flex items-center justify-center gap-1 sm:gap-2 px-2 sm:px-6 py-2.5 sm:py-3 rounded-full text-[10px] sm:text-xs font-black tracking-wide uppercase transition-all duration-300 cursor-pointer ${
                activeTab === "classes" 
                  ? "bg-[#D13F7A] text-white shadow-xs scale-[1.01]" 
                  : "text-slate-500 hover:text-[#D13F7A] hover:bg-pink-50/40"
              }`}
            >
              <Sparkles size={12} className="shrink-0" />
              <span>Classes</span>
            </button>

            {/* Workshops Tab */}
            <button
              onClick={() => setActiveTab("workshops")}
              className={`flex-1 flex items-center justify-center gap-1 sm:gap-2 px-2 sm:px-6 py-2.5 sm:py-3 rounded-full text-[10px] sm:text-xs font-black tracking-wide uppercase transition-all duration-300 cursor-pointer ${
                activeTab === "workshops" 
                  ? "bg-[#D13F7A] text-white shadow-xs scale-[1.01]" 
                  : "text-slate-500 hover:text-[#D13F7A] hover:bg-pink-50/40"
              }`}
            >
              <Zap size={12} className="shrink-0" />
              <span>Workshops</span>
            </button>

            {/* Events Tab */}
            <button
              onClick={() => setActiveTab("events")}
              className={`flex-1 flex items-center justify-center gap-1 sm:gap-2 px-2 sm:px-6 py-2.5 sm:py-3 rounded-full text-[10px] sm:text-xs font-black tracking-wide uppercase transition-all duration-300 cursor-pointer ${
                activeTab === "events" 
                  ? "bg-[#D13F7A] text-white shadow-xs scale-[1.01]" 
                  : "text-slate-500 hover:text-[#D13F7A] hover:bg-pink-50/40"
              }`}
            >
              <Ticket size={12} className="shrink-0" />
              <span>Events</span>
            </button>

          </div>
        </div>

        {/* Carousel Slider Outer Wrapper */}
        <div className="relative group/carousel px-0 sm:px-4">
          
          {/* Navigation Left Arrow */}
          {showLeftArrow && (
            <button
              onClick={() => scroll("left")}
              className="hidden md:flex absolute -left-4 top-1/2 -translate-y-1/2 z-30 w-11 h-11 bg-white hover:bg-[#D13F7A] hover:text-white text-slate-800 border border-pink-100 rounded-full items-center justify-center shadow-md hover:shadow-lg transition-all active:scale-95 cursor-pointer"
              aria-label="Scroll left"
            >
              <ArrowLeft size={16} />
            </button>
          )}

          {/* Navigation Right Arrow */}
          {showRightArrow && (
            <button
              onClick={() => scroll("right")}
              className="hidden md:flex absolute -right-4 top-1/2 -translate-y-1/2 z-30 w-11 h-11 bg-white hover:bg-[#D13F7A] hover:text-white text-slate-800 border border-pink-100 rounded-full items-center justify-center shadow-md hover:shadow-lg transition-all active:scale-95 cursor-pointer"
              aria-label="Scroll right"
            >
              <ArrowRight size={16} />
            </button>
          )}

          {/* Carousel Inner Container */}
          <div
            ref={scrollContainerRef}
            className="flex gap-4 sm:gap-6 overflow-x-auto scroll-smooth scrollbar-none snap-x snap-mandatory py-4 px-4 sm:px-2"
            style={{ scrollbarWidth: "none" }}
          >
            
            {/* CLASSES / CATEGORIES OF PROGRAMS */}
            {activeTab === "classes" && (
              categories.length > 0 ? (
                categories.map((c) => {
                  const catPrograms = (programs || []).filter((p: any) => p && p.categoryId === c.id)
                  if (catPrograms.length === 0) return null

                  const coverImage = getCategoryImage(c.name || "", c.image)
                  
                  // Collect prices of all program options in this category
                  const categoryPrices = catPrograms.flatMap((p: any) => p?.options?.map((opt: any) => opt?.price) || [])
                  const startPrice = categoryPrices.length > 0 ? Math.min(...categoryPrices) : null
                  
                  // Calculate Capacity & spots remaining dynamically for this category
                  const totalCapacity = catPrograms.flatMap((p: any) => p?.options || []).reduce((acc: number, opt: any) => acc + (opt?.capacity || 0), 0)
                  const totalEnrollments = catPrograms.flatMap((p: any) => p?.options || []).reduce((acc: number, opt: any) => acc + (opt?._count?.enrollments || 0), 0)
                  const spotsLeft = Math.max(0, totalCapacity - totalEnrollments)
                  const isLowSpots = spotsLeft > 0 && spotsLeft <= 5

                  return (
                    <div
                      key={c.id}
                      className="w-[275px] xs:w-[295px] sm:w-[330px] shrink-0 bg-white rounded-[2rem] border border-pink-100/40 shadow-2xs hover:shadow-md hover:border-[#D13F7A]/30 transition-all duration-300 flex flex-col justify-between overflow-hidden snap-center sm:snap-start group/card"
                    >
                      {/* Top Cover Image with dynamic Zoom */}
                      <div className="h-44 sm:h-52 w-full overflow-hidden relative">
                        <img 
                          src={coverImage} 
                          alt={c.name || "Category Image"} 
                          className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover/card:scale-105"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-transparent"></div>
                        
                        {/* Category Name Badge (Top Left) */}
                        <span className="absolute top-4 left-4 bg-white text-[#D13F7A] border border-pink-100/30 text-[9px] font-black uppercase tracking-wider px-3.5 py-1.5 rounded-xl shadow-2xs flex items-center gap-1.5">
                          {getCategoryIcon(c.name || "")}
                          {c.name}
                        </span>

                        {/* Floating Price Pill (Top Right) */}
                        {startPrice !== null && (
                          <span className="absolute top-4 right-4 bg-black/60 backdrop-blur-md text-white border border-white/10 text-[10px] font-black px-3.5 py-1.5 rounded-full">
                            {startPrice} EGP
                          </span>
                        )}
                      </div>

                      {/* Content */}
                      <div className="p-5 sm:p-6 flex-1 flex flex-col justify-between space-y-4">
                        <div className="space-y-2 text-left">
                          
                          {/* Premium Status Tag */}
                          <span className={`text-[9px] font-extrabold uppercase tracking-widest ${isLowSpots ? "text-amber-600 bg-amber-50" : "text-[#D13F7A] bg-pink-50"} border border-transparent px-2.5 py-1 rounded-md inline-block`}>
                            {isLowSpots ? "★ Limited Spots" : "★ Popular Class"}
                          </span>

                          <h4 className="text-lg sm:text-xl font-black text-slate-800 group-hover/card:text-[#D13F7A] transition-colors duration-300 leading-tight font-display">
                            {c.name}
                          </h4>
                          <p className="text-slate-400 text-xs font-semibold leading-relaxed line-clamp-3">
                            {getCategoryDesc(c.name || "")}
                          </p>
                        </div>

                        {/* Footer Details */}
                        <div className="pt-4 border-t border-slate-100/50 flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            <span className={`w-2 h-2 rounded-full ${isLowSpots ? "bg-amber-500 animate-pulse" : "bg-emerald-500"}`}></span>
                            <span className="text-[10px] font-bold text-slate-400">
                              {spotsLeft > 0 ? `${spotsLeft} spots left` : "Available now"}
                            </span>
                          </div>
                          
                          <a 
                            href="#services" 
                            className="bg-[#D13F7A] hover:bg-[#B13064] text-white py-2.5 px-4 rounded-xl text-[10px] font-black transition-all duration-300 flex items-center gap-1 group/btn cursor-pointer"
                          >
                            <span>Book Spot</span>
                            <ArrowUpRight size={12} className="transition-transform group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5" />
                          </a>
                        </div>
                      </div>
                    </div>
                  )
                })
              ) : (
                <div className="w-full text-center text-slate-400 font-bold py-12">
                  No program categories available.
                </div>
              )
            )}

            {/* WORKSHOPS DATA */}
            {activeTab === "workshops" && (
              workshops.length > 0 ? (
                workshops.map((w) => {
                  const coverImage = getWorkshopImage(w.name || "")
                  const startStr = w.startDate ? new Date(w.startDate).toLocaleDateString('en-US', { day: 'numeric', month: 'short' }) : ""
                  const endStr = w.endDate ? new Date(w.endDate).toLocaleDateString('en-US', { day: 'numeric', month: 'short' }) : ""
                  
                  const spotsLeft = Math.max(0, w.capacity - (w._count?.enrollments || 0))
                  const isLowSpots = spotsLeft > 0 && spotsLeft <= 5

                  return (
                    <div
                      key={w.id}
                      className="w-[275px] xs:w-[295px] sm:w-[330px] shrink-0 bg-white rounded-[2rem] border border-orange-100/40 shadow-2xs hover:shadow-md hover:border-orange-400/30 transition-all duration-300 flex flex-col justify-between overflow-hidden snap-center sm:snap-start group/card"
                    >
                      {/* Top Cover Image with Zoom Effect */}
                      <div className="h-44 sm:h-52 w-full overflow-hidden relative">
                        <img 
                          src={coverImage} 
                          alt={w.name || "Workshop Image"} 
                          className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover/card:scale-105"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-transparent"></div>
                        
                        {/* Tag */}
                        <span className="absolute top-4 left-4 bg-orange-500 text-white text-[9px] font-black uppercase tracking-wider px-3 py-1.5 rounded-xl shadow-2xs flex items-center gap-1">
                          <Zap size={11} className="animate-pulse" />
                          Workshop
                        </span>

                        {/* Floating Price Pill */}
                        <span className="absolute top-4 right-4 bg-black/60 backdrop-blur-md text-white border border-white/10 text-[10px] font-black px-3.5 py-1.5 rounded-full">
                          {w.price} EGP
                        </span>
                      </div>

                      {/* Content */}
                      <div className="p-5 sm:p-6 flex-1 flex flex-col justify-between space-y-4">
                        <div className="space-y-3 text-left">
                          
                          {/* Status Tag */}
                          <span className={`text-[9px] font-extrabold uppercase tracking-widest ${isLowSpots ? "text-red-500 bg-red-50" : "text-orange-600 bg-orange-50"} border border-transparent px-2.5 py-1 rounded-md inline-block`}>
                            {isLowSpots ? "★ Selling Fast" : "★ Masterclass"}
                          </span>

                          <h4 className="text-lg sm:text-xl font-black text-slate-800 group-hover/card:text-orange-500 transition-colors duration-300 leading-tight font-display">
                            {w.name}
                          </h4>
                          
                          {/* Instructor */}
                          {w.instructor && (
                            <p className="text-[10px] font-bold text-orange-600 flex items-center gap-1">
                              <User size={12} className="text-orange-500" />
                              Instructor: {w.instructor}
                            </p>
                          )}

                          <p className="text-slate-400 text-xs font-semibold leading-relaxed line-clamp-3">
                            {w.description || "Learn new creative skills and make new besties in this immersive workshop."}
                          </p>
                        </div>

                        {/* Date details badge */}
                        {(startStr || endStr) && (
                          <div className="bg-orange-50/50 border border-orange-100/30 py-1.5 px-3 rounded-xl flex items-center gap-1.5 w-max mr-auto">
                            <CalendarDays size={12} className="text-orange-500" />
                            <span className="text-[10px] font-bold text-orange-700">{startStr} {endStr ? `- ${endStr}` : ""}</span>
                          </div>
                        )}

                        {/* Footer Details */}
                        <div className="pt-4 border-t border-slate-100/50 flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            <span className={`w-2 h-2 rounded-full ${isLowSpots ? "bg-red-500 animate-pulse" : "bg-emerald-500"}`}></span>
                            <span className="text-[10px] font-bold text-slate-400">
                              {spotsLeft > 0 ? `${spotsLeft} seats left` : "Sold Out"}
                            </span>
                          </div>
                          
                          <a 
                            href="#services" 
                            className="bg-[#D13F7A] hover:bg-[#B13064] text-white py-2.5 px-4 rounded-xl text-[10px] font-black transition-all duration-300 flex items-center gap-1 group/btn cursor-pointer"
                          >
                            <span>Get Ticket</span>
                            <ArrowUpRight size={12} className="transition-transform group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5" />
                          </a>
                        </div>
                      </div>
                    </div>
                  )
                })
              ) : (
                <div className="w-full text-center text-slate-400 font-bold py-12">
                  No workshops scheduled at the moment.
                </div>
              )
            )}

            {/* EVENTS / PARTIES DATA */}
            {activeTab === "events" && (
              events.length > 0 ? (
                events.map((e) => {
                  const coverImage = getEventImage(e.name || "")
                  const eventDate = e.date ? new Date(e.date) : null
                  const dateStr = eventDate ? eventDate.toLocaleDateString('en-US', { day: 'numeric', month: 'short' }) : ""
                  const timeStr = eventDate ? eventDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : ""
                  
                  const spotsLeft = Math.max(0, e.capacity - (e._count?.enrollments || 0))
                  const isLowSpots = spotsLeft > 0 && spotsLeft <= 10

                  return (
                    <div
                      key={e.id}
                      className="w-[275px] xs:w-[295px] sm:w-[330px] shrink-0 bg-white rounded-[2rem] border border-purple-100/40 shadow-2xs hover:shadow-md hover:border-purple-400/30 transition-all duration-300 flex flex-col justify-between overflow-hidden snap-center sm:snap-start group/card"
                    >
                      {/* Top Cover Image with Zoom Effect */}
                      <div className="h-44 sm:h-52 w-full overflow-hidden relative">
                        <img 
                          src={coverImage} 
                          alt={e.name || "Event Image"} 
                          className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover/card:scale-105"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-transparent"></div>
                        
                        {/* Tag */}
                        <span className="absolute top-4 left-4 bg-purple-600 text-white text-[9px] font-black uppercase tracking-wider px-3 py-1.5 rounded-xl shadow-2xs flex items-center gap-1">
                          <Music size={11} />
                          Event
                        </span>

                        {/* Floating Price Pill */}
                        <span className="absolute top-4 right-4 bg-black/60 backdrop-blur-md text-white border border-white/10 text-[10px] font-black px-3.5 py-1.5 rounded-full">
                          {e.price} EGP
                        </span>
                      </div>

                      {/* Content */}
                      <div className="p-5 sm:p-6 flex-1 flex flex-col justify-between space-y-4">
                        <div className="space-y-3 text-left">
                          
                          {/* Status Tag */}
                          <span className={`text-[9px] font-extrabold uppercase tracking-widest ${isLowSpots ? "text-purple-700 bg-purple-50" : "text-indigo-600 bg-indigo-50"} border border-transparent px-2.5 py-1 rounded-md inline-block`}>
                            {isLowSpots ? "★ Almost Full" : "★ Girls Night Out"}
                          </span>

                          <h4 className="text-lg sm:text-xl font-black text-slate-800 group-hover/card:text-purple-600 transition-colors duration-300 leading-tight font-display">
                            {e.name}
                          </h4>
                          
                          <p className="text-slate-400 text-xs font-semibold leading-relaxed line-clamp-3">
                            {e.description || "Join us for a fun gathering to laugh, connect, and celebrate girl power at the Space."}
                          </p>
                        </div>

                        {/* Date details badge */}
                        {dateStr && (
                          <div className="bg-purple-50/50 border border-purple-100/30 py-1.5 px-3 rounded-xl flex items-center gap-1.5 w-max mr-auto">
                            <CalendarDays size={12} className="text-purple-500" />
                            <span className="text-[10px] font-bold text-purple-700">{dateStr} {timeStr ? `at ${timeStr}` : ""}</span>
                          </div>
                        )}

                        {/* Footer Details */}
                        <div className="pt-4 border-t border-slate-100/50 flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            <span className={`w-2 h-2 rounded-full ${isLowSpots ? "bg-amber-500 animate-pulse" : "bg-emerald-500"}`}></span>
                            <span className="text-[10px] font-bold text-slate-400">
                              {spotsLeft > 0 ? `${spotsLeft} slots left` : "Sold Out"}
                            </span>
                          </div>
                          
                          <a 
                            href="#services" 
                            className="bg-[#D13F7A] hover:bg-[#B13064] text-white py-2.5 px-4 rounded-xl text-[10px] font-black transition-all duration-300 flex items-center gap-1 group/btn cursor-pointer"
                          >
                            <span>Book Ticket</span>
                            <ArrowUpRight size={12} className="transition-transform group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5" />
                          </a>
                        </div>
                      </div>
                    </div>
                  )
                })
              ) : (
                <div className="w-full text-center text-slate-400 font-bold py-12">
                  No events scheduled at the moment.
                </div>
              )
            )}

          </div>

          {/* Dots Indicator */}
          <div className="flex justify-center items-center gap-1.5 pt-4">
            <span className={`w-2 h-2 rounded-full transition-all duration-300 ${activeTab === "classes" ? "bg-[#D13F7A] w-4" : "bg-pink-100"}`}></span>
            <span className={`w-2 h-2 rounded-full transition-all duration-300 ${activeTab === "workshops" ? "bg-orange-400 w-4" : "bg-orange-100"}`}></span>
            <span className={`w-2 h-2 rounded-full transition-all duration-300 ${activeTab === "events" ? "bg-purple-600 w-4" : "bg-purple-100"}`}></span>
          </div>

        </div>

      </div>
    </section>
  )
}
