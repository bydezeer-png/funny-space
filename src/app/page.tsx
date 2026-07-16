import { getPrograms, getProgramCategories } from "@/actions/programs"
import { getEvents, getWorkshops } from "@/actions/events"
import { getTestimonials } from "@/actions/testimonials"
import { getSystemSettings } from "@/actions/settings"
import ClientPortal from "./ClientPortal"
import Link from "next/link"
import { 
  ArrowLeft, 
  MapPin, 
  Phone, 
  HeartPulse, 
  Sparkles, 
  Lock, 
  Coffee, 
  CalendarDays, 
  Grid, 
  Heart, 
  UserCheck, 
  CheckCircle2, 
  AlertTriangle, 
  Leaf, 
  Activity, 
  Palette, 
  Clock, 
  Search, 
  Camera, 
  Video, 
  Shield, 
  Mail, 
  Zap,
  Menu,
  Users,
  Ticket
} from "lucide-react"

export default async function Home() {
  const [programs, categories, events, workshops, testimonials, settings] = await Promise.all([
    getPrograms(),
    getProgramCategories(),
    getEvents(),
    getWorkshops(),
    getTestimonials(true),
    getSystemSettings()
  ])

  const fallbackTestimonials = [
    {
      id: "fallback-1",
      name: "Sara Ali",
      role: "Member for 4 months",
      content: "Soly's Space completely changed my life! The workouts are so much fun and the trainers are like supportive besties. I feel so much stronger and happier!",
      rating: 5,
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=150&auto=format&fit=crop"
    },
    {
      id: "fallback-2",
      name: "Hind Mohamed",
      role: "Member for 7 months",
      content: "The vibes here are so cozy and welcoming, every visit fills me with positive girl power. A judgment-free zone that gives you results in no time!",
      rating: 5,
      avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=150&auto=format&fit=crop"
    },
    {
      id: "fallback-3",
      name: "Nouf Khaled",
      role: "Member for 1 year",
      content: "The variety of classes and creative workshops is amazing! I discover a new passion every single week. Highly recommend every girl to join our club!",
      rating: 5,
      avatar: "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?q=80&w=150&auto=format&fit=crop"
    },
  ]

  return (
    <div dir="ltr" className="min-h-screen bg-transparent text-[#1A1A1A] relative selection:bg-hot-pink/20 selection:text-hot-pink font-sans overflow-x-hidden">
      
      {/* Dynamic Announcement Banner */}
      {settings.showTopAlertBanner && settings.topAlertBanner && (
        <div className="bg-[#FFF5F8] border-b border-pink-100/50 py-2.5 px-4 text-center text-xs font-bold text-[#D13F7A] tracking-wide relative z-50">
          {settings.topAlertBanner}
        </div>
      )}

      {/* Soft Decorative Grid Pattern */}
      <div className="absolute inset-0 bg-[radial-gradient(#ebdff9_1.2px,transparent_1.2px)] [background-size:48px_48px] opacity-15 pointer-events-none -z-20"></div>
      
      {/* Hero Section: Full-Width Immersive Banner containing integrated Glassmorphism Header */}
      <section className={`w-full pt-0 pb-0 relative overflow-hidden flex flex-col justify-between ${settings.showHeroSection ? 'min-h-[680px] md:min-h-[580px] lg:min-h-[640px]' : 'min-h-auto pb-12'}`}>
        
        {/* Background Image (Full-Width) */}
        <img 
          src="/IMG_5119.PNG" 
          alt="Elevate Your Vibe" 
          className="absolute inset-0 w-full h-full object-cover -z-10" 
        />
        {/* Dark Overlay (Full-Width) */}
        <div className="absolute inset-0 bg-black/20 md:bg-gradient-to-r md:from-black/45 md:to-transparent -z-10"></div>
        
        {/* Bottom White Mist Blend to smooth transition to the next white section (Full-Width) */}
        <div className="absolute inset-x-0 bottom-0 h-44 bg-gradient-to-t from-white via-white/60 to-transparent pointer-events-none z-10"></div>

        {/* Centered Content Wrapper (Constrained to standard site max-width) */}
        <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 flex-1 flex flex-col justify-between py-6 sm:py-10 lg:py-12 pb-10 sm:pb-12 lg:pb-12 z-20">
          
          {/* Integrated Glassmorphism Header */}
          <input type="checkbox" id="mobile-menu-toggle" className="hidden peer" />
          <header className="w-full bg-white/10 backdrop-blur-md border border-white/15 rounded-2xl md:rounded-3xl shadow-xs transition-all duration-300 h-16 md:h-18 flex items-center justify-between px-4 sm:px-8 text-white z-20">
            
            {/* Left Side: Burger Menu (Mobile Only) */}
            <label htmlFor="mobile-menu-toggle" className="md:hidden w-10 h-10 flex items-center justify-start text-white hover:text-pink-200 transition-colors cursor-pointer" aria-label="Menu">
              <Menu size={20} />
            </label>

            {/* Logo Section */}
            <div className="flex items-center gap-2 md:gap-3 justify-center flex-1 md:flex-initial">
               <div className="w-10 h-10 md:w-12 md:h-12 overflow-hidden rounded-xl border border-white/20 bg-white p-0.5 shadow-xs">
                 <img src="/logo.png" alt="Soly's Space" className="w-full h-full object-contain" />
               </div>
               <div className="text-left">
                 <h1 className="text-sm md:text-base font-black tracking-tight text-white leading-none font-display">{"Soly's Space"}</h1>
                 <p className="text-[6.5px] md:text-[8px] text-pink-200 font-extrabold tracking-[0.1em] uppercase mt-0.5 md:mt-1">EMBRACE THE VIBE</p>
               </div>
            </div>
            
            {/* Navigation Links */}
            <nav className="hidden md:flex items-center gap-5 lg:gap-7 text-xs font-semibold uppercase tracking-wider text-white/90">
              <a href="#about" className="hover:text-white relative py-1 transition-all duration-300 after:absolute after:bottom-0 after:left-0 after:h-[2px] after:w-full after:origin-bottom-right after:scale-x-0 after:bg-white after:transition-transform after:duration-300 hover:after:origin-bottom-left hover:after:scale-x-100">About Us</a>
              <a href="#about" className="hover:text-white relative py-1 transition-all duration-300 after:absolute after:bottom-0 after:left-0 after:h-[2px] after:w-full after:origin-bottom-right after:scale-x-0 after:bg-white after:transition-transform after:duration-300 hover:after:origin-bottom-left hover:after:scale-x-100">Our Team</a>
              <a href="#services" className="hover:text-white relative py-1 transition-all duration-300 after:absolute after:bottom-0 after:left-0 after:h-[2px] after:w-full after:origin-bottom-right after:scale-x-0 after:bg-white after:transition-transform after:duration-300 hover:after:origin-bottom-left hover:after:scale-x-100">Programs</a>
              <a href="#services" className="hover:text-white relative py-1 transition-all duration-300 after:absolute after:bottom-0 after:left-0 after:h-[2px] after:w-full after:origin-bottom-right after:scale-x-0 after:bg-white after:transition-transform after:duration-300 hover:after:origin-bottom-left hover:after:scale-x-100">Pricing</a>
              <a href="#services" className="hover:text-white relative py-1 transition-all duration-300 after:absolute after:bottom-0 after:left-0 after:h-[2px] after:w-full after:origin-bottom-right after:scale-x-0 after:bg-white after:transition-transform after:duration-300 hover:after:origin-bottom-left hover:after:scale-x-100">Events</a>
              <a href="#contact" className="hover:text-white relative py-1 transition-all duration-300 after:absolute after:bottom-0 after:left-0 after:h-[2px] after:w-full after:origin-bottom-right after:scale-x-0 after:bg-white after:transition-transform after:duration-300 hover:after:origin-bottom-left hover:after:scale-x-100">Blog</a>
            </nav>

            {/* CTA Button */}
            <div className="w-10 h-10 md:w-auto flex items-center justify-end">
              {/* Desktop Button */}
              <a href="#services" className="hidden md:flex bg-[#D13F7A] text-white hover:bg-[#B13064] hover:scale-[1.03] hover:shadow-[0_8px_20px_rgba(209,63,122,0.3)] active:scale-95 px-5 py-2 rounded-xl text-xs font-bold transition-all duration-300 items-center gap-2 group shadow-sm cursor-pointer">
                <span>Book Your Spot 🎀</span>
                <CalendarDays size={14} />
              </a>
              {/* Mobile Calendar Button */}
              <a href="#services" className="md:hidden w-10 h-10 bg-[#D13F7A] hover:bg-[#B13064] text-white rounded-xl flex items-center justify-center shadow-sm cursor-pointer">
                <CalendarDays size={18} />
              </a>
            </div>
          </header>

          {/* Mobile Drawer Panel */}
          <div className="fixed inset-y-0 left-0 w-64 bg-white/95 backdrop-blur-lg border-r border-pink-100 z-50 transform -translate-x-full peer-checked:translate-x-0 transition-transform duration-300 ease-in-out md:hidden shadow-2xl p-6 flex flex-col justify-between">
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-pink-100/50 pb-4">
                 <div className="flex items-center gap-2">
                    <div className="w-9 h-9 overflow-hidden rounded-lg border border-pink-100 bg-white p-0.5 shadow-2xs">
                      <img src="/logo.png" alt="Soly's Space" className="w-full h-full object-contain" />
                    </div>
                    <span className="text-sm font-black text-slate-800 font-display">Soly's Space</span>
                 </div>
                 <label htmlFor="mobile-menu-toggle" className="cursor-pointer text-slate-500 hover:text-slate-800">
                   <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                   </svg>
                 </label>
              </div>
              <nav className="flex flex-col gap-2 text-sm font-semibold uppercase tracking-wider text-slate-600 pt-2">
                <label htmlFor="mobile-menu-toggle" className="block w-full cursor-pointer">
                  <a href="#about" className="block py-2 border-b border-pink-50/50 text-slate-700 hover:text-primary transition-colors">About Us</a>
                </label>
                <label htmlFor="mobile-menu-toggle" className="block w-full cursor-pointer">
                  <a href="#about" className="block py-2 border-b border-pink-50/50 text-slate-700 hover:text-primary transition-colors">Our Team</a>
                </label>
                <label htmlFor="mobile-menu-toggle" className="block w-full cursor-pointer">
                  <a href="#services" className="block py-2 border-b border-pink-50/50 text-slate-700 hover:text-primary transition-colors">Programs</a>
                </label>
                <label htmlFor="mobile-menu-toggle" className="block w-full cursor-pointer">
                  <a href="#services" className="block py-2 border-b border-pink-50/50 text-slate-700 hover:text-primary transition-colors">Pricing</a>
                </label>
                <label htmlFor="mobile-menu-toggle" className="block w-full cursor-pointer">
                  <a href="#services" className="block py-2 border-b border-pink-50/50 text-slate-700 hover:text-primary transition-colors">Events</a>
                </label>
                <label htmlFor="mobile-menu-toggle" className="block w-full cursor-pointer">
                  <a href="#contact" className="block py-2 border-b border-pink-50/50 text-slate-700 hover:text-primary transition-colors">Blog</a>
                </label>
              </nav>
            </div>
            <div className="pt-6">
              <label htmlFor="mobile-menu-toggle" className="block w-full cursor-pointer">
                <a href="#services" className="flex bg-[#D13F7A] text-white hover:bg-[#B13064] px-5 py-3 rounded-xl text-xs font-bold transition-all justify-center items-center gap-2 shadow-sm">
                  <span>Book Your Spot 🎀</span>
                  <CalendarDays size={14} />
                </a>
              </label>
            </div>
          </div>
          {/* Dark Overlay when mobile menu is open */}
          <label htmlFor="mobile-menu-toggle" className="fixed inset-0 bg-black/40 z-40 hidden peer-checked:block md:peer-checked:hidden"></label>

          {/* Content Overlaid on Right (RTL displays on the right side) */}
          {settings.showHeroSection && (
            <div className="w-full md:w-3/5 flex flex-col justify-center items-start text-left text-white space-y-5 z-20 my-auto pt-6 md:pt-8">
              
              {/* Girls' Community Badge */}
              <span className="text-[10px] sm:text-xs font-extrabold tracking-wider text-[#D13F7A] uppercase flex items-center gap-1.5">
                <span className="hidden md:inline">✦ {"Girls' Community"} ✦</span>
                <span className="md:hidden">{"Girls' Community"}</span>
                <Users size={12} className="text-[#D13F7A] md:hidden" />
              </span>

              <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-5.5xl font-normal leading-[1.25] font-display text-white tracking-tight max-w-2xl">
                {settings.heroTitle || `Welcome to ${settings.spaceName} ✨`}
              </h2>
              
              <p className="text-xs sm:text-sm text-white/90 font-medium max-w-md leading-relaxed">
                {settings.heroSubtitle || settings.spaceDescription || "A safe, fun and empowering space for girls to explore their passions, build confidence and create unforgettable memories."}
              </p>
              
              <div className="flex flex-col sm:flex-row gap-3.5 w-full sm:w-auto pt-2">
                <a href="#services" className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-3 rounded-2xl bg-[#D13F7A] hover:bg-[#B13064] hover:scale-[1.02] hover:shadow-[0_6px_15px_rgba(209,63,122,0.25)] active:scale-98 text-white font-bold text-xs uppercase tracking-widest transition-all gap-1.5 shadow-sm group">
                  <span>Join The Community</span>
                  <span className="transition-transform group-hover:translate-x-1">→</span>
                </a>
                <a href="#services" className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-3 rounded-2xl border border-white/30 hover:border-white/70 hover:bg-white/5 hover:scale-[1.02] active:scale-98 text-white font-bold text-xs uppercase tracking-widest transition-all gap-1.5 shadow-sm group">
                  <span>Explore Programs</span>
                  <span className="transition-transform group-hover:translate-x-1">→</span>
                </a>
              </div>
            </div>
          )}

          {/* Bottom Translucent Benefits Card */}
          <div className="w-full bg-black/45 backdrop-blur-md border border-white/10 rounded-2xl md:rounded-full px-4 py-3 md:px-8 md:py-3.5 z-20 mt-6 grid grid-cols-2 md:grid-cols-4 md:flex md:flex-row md:items-center md:justify-between md:gap-0 md:divide-x md:divide-white/15 text-white">
            
            {/* Girls Only */}
            <div className="flex items-start gap-2.5 md:flex-1 md:justify-center md:px-6 md:first:pl-0">
              <div className="w-8 h-8 rounded-lg bg-[#D13F7A]/20 border border-[#D13F7A]/30 flex items-center justify-center shrink-0">
                <Shield size={16} className="text-[#D13F7A]" />
              </div>
              <div className="text-left">
                <h4 className="text-xs sm:text-sm font-bold leading-tight">Girls Only</h4>
                <p className="text-[10px] text-white/70 mt-0.5 leading-tight">Safe & supportive space</p>
              </div>
            </div>

            {/* Real Connections */}
            <div className="flex items-start gap-2.5 md:flex-1 md:justify-center md:px-6">
              <div className="w-8 h-8 rounded-lg bg-[#D13F7A]/20 border border-[#D13F7A]/30 flex items-center justify-center shrink-0">
                <Heart size={16} className="text-[#D13F7A]" />
              </div>
              <div className="text-left">
                <h4 className="text-xs sm:text-sm font-bold leading-tight">Real Connections</h4>
                <p className="text-[10px] text-white/70 mt-0.5 leading-tight">Friendships that last</p>
              </div>
            </div>

            {/* Fun & Growth */}
            <div className="flex items-start gap-2.5 md:flex-1 md:justify-center md:px-6">
              <div className="w-8 h-8 rounded-lg bg-[#D13F7A]/20 border border-[#D13F7A]/30 flex items-center justify-center shrink-0">
                <Sparkles size={16} className="text-[#D13F7A]" />
              </div>
              <div className="text-left">
                <h4 className="text-xs sm:text-sm font-bold leading-tight">Fun & Growth</h4>
                <p className="text-[10px] text-white/70 mt-0.5 leading-tight">Learn, grow & glow</p>
              </div>
            </div>

            {/* Amazing Events */}
            <div className="flex items-start gap-2.5 md:flex-1 md:justify-center md:px-6 md:last:pr-0">
              <div className="w-8 h-8 rounded-lg bg-[#D13F7A]/20 border border-[#D13F7A]/30 flex items-center justify-center shrink-0">
                <CalendarDays size={16} className="text-[#D13F7A]" />
              </div>
              <div className="text-left">
                <h4 className="text-xs sm:text-sm font-bold leading-tight">Amazing Events</h4>
                <p className="text-[10px] text-white/70 mt-0.5 leading-tight">Workshops & parties</p>
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* Mindful Space Section (Two Columns) */}
      <section id="about" className="py-12 md:py-16 bg-white border-b border-pink-100/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 md:gap-16 items-center">
            
            {/* Left Column: Text & Grid of 4 Small Cards (swapped order to order-1 in LTR to put text on the left) */}
            <div className="space-y-6 text-left order-1 lg:order-1">
              <span className="text-xs font-bold tracking-wider text-[#D13F7A] uppercase">
                OUR COZY SAFE ZONE
              </span>
              
              <h3 className="text-3xl sm:text-4xl lg:text-5xl font-semibold leading-[1.25] font-display text-[#1A1A1A] tracking-tight">
                Come as you are <br />
                Leave <span className="text-[#D13F7A] font-black italic border-b-2 border-[#D13F7A] pb-0.5 font-display inline-block">empowered</span><span className="text-[#D13F7A]">_ ♡</span>
              </h3>
              
              <p className="text-sm text-slate-500 leading-relaxed font-medium max-w-xl">
                No judgment. No pressure. Just positive energy, inspiring people and endless opportunities to be your best self.
              </p>
              
              {/* Grid of 4 small cards (2x2 on desktop, vertical stack on mobile) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 max-w-lg my-8">
                
                {/* Healthy & Happy Vibes */}
                <div className="bg-white border border-pink-100/70 p-4.5 rounded-2xl flex items-center gap-3 shadow-2xs hover:border-[#D13F7A]/30 hover:scale-[1.01] transition-all">
                  <Sparkles size={18} className="text-[#D13F7A] shrink-0" />
                  <span className="text-xs sm:text-sm font-semibold text-slate-700">Healthy & Happy Vibes</span>
                </div>

                {/* Workshops & Classes */}
                <div className="bg-white border border-pink-100/70 p-4.5 rounded-2xl flex items-center gap-3 shadow-2xs hover:border-[#D13F7A]/30 hover:scale-[1.01] transition-all">
                  <Ticket size={18} className="text-[#D13F7A] shrink-0" />
                  <span className="text-xs sm:text-sm font-semibold text-slate-700">Workshops & Classes</span>
                </div>

                {/* Creative & Artistic Soul */}
                <div className="bg-white border border-pink-100/70 p-4.5 rounded-2xl flex items-center gap-3 shadow-2xs hover:border-[#D13F7A]/30 hover:scale-[1.01] transition-all">
                  <Palette size={18} className="text-[#D13F7A] shrink-0" />
                  <span className="text-xs sm:text-sm font-semibold text-slate-700">Creative & Artistic Soul</span>
                </div>

                {/* Fun & Fitness */}
                <div className="bg-white border border-pink-100/70 p-4.5 rounded-2xl flex items-center gap-3 shadow-2xs hover:border-[#D13F7A]/30 hover:scale-[1.01] transition-all">
                  <Activity size={18} className="text-[#D13F7A] shrink-0" />
                  <span className="text-xs sm:text-sm font-semibold text-slate-700">Fun & Fitness</span>
                </div>

              </div>

              <div className="pt-2">
                <a href="#services" className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-3 rounded-xl border border-[#D13F7A]/60 hover:border-[#D13F7A] text-[#D13F7A] font-bold text-xs uppercase tracking-widest hover:bg-[#D13F7A] hover:text-white transition-all gap-1.5 group">
                  <span>Explore Our Safe Zone</span>
                  <span className="transition-transform group-hover:translate-x-1">→</span>
                </a>
              </div>
            </div>

            {/* Right Column: Portrait Image with Overlay Pill (swapped order to order-2 in LTR to put image on the right) */}
            <div className="w-full aspect-[4/4.5] rounded-[2.5rem] overflow-hidden shadow-2xs border border-pink-100/40 relative order-2 lg:order-2">
              <img 
                src="/cozy_safe_zone.png" 
                alt="Cozy Studio Inside" 
                className="w-full h-full object-cover"
              />
              
              {/* Floating Bottom Pill */}
              <div className="absolute bottom-6 inset-x-6 flex justify-center">
                <div className="bg-[#D13F7A]/85 backdrop-blur-xs text-white border border-white/10 px-6 py-2.5 rounded-xl shadow-md text-xs font-bold flex items-center gap-2 select-none">
                  <span>Your Space. Your Energy. Your Journey. 🤍</span> 
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>


      {/* Booking Steps Banner Section (Mockup Steps Layout) */}
      {settings.showClassesSection && (
        <section className="pt-8 pb-12 md:pt-10 md:pb-14 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          
          {/* Centered Headings */}
          <div className="text-center space-y-2">
            <span className="text-xs font-bold tracking-wider text-[#D13F7A] uppercase">
              Your Booking Gateway +
            </span>
            <h3 className="text-2xl sm:text-3xl font-black text-[#1A1A1A]">
              Book your favorite class or workshop in 3 simple steps
            </h3>
            <p className="text-xs text-slate-400 font-bold">
              Choose your session, reserve your spot, and get ready to shine!
            </p>
          </div>

          {/* Steps Main Box */}
          <div className="bg-[#FFFDFE] border border-pink-100 rounded-[2.5rem] p-6 lg:p-8 flex flex-col lg:flex-row items-stretch justify-between gap-6 max-w-5xl mx-auto shadow-2xs">
            
            {/* Left/Portal Image Card (rendered first in HTML, so it is on the left in LTR) */}
            <div className="w-full lg:w-72 rounded-3xl overflow-hidden relative aspect-[4/3] lg:aspect-[3/4] shadow-xs shrink-0 border border-pink-100/30">
              <img 
                src="https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?q=80&w=400&auto=format&fit=crop" 
                alt="Woman carrying pink yoga mat" 
                className="w-full h-full object-cover" 
              />
              <div className="absolute inset-0 bg-[#D13F7A]/80 flex flex-col justify-end p-6 text-white text-left">
                <div className="space-y-4">
                  <h4 className="text-xl font-normal font-display text-white">Unlock Your Potential</h4>
                  <p className="text-[10px] text-white/80 font-medium leading-relaxed">Log in to manage your schedule, track bookings, and update your profile.</p>
                  <Link href="/client-login" className="inline-flex items-center gap-1.5 bg-white text-[#D13F7A] hover:bg-pink-50 font-bold text-[10px] uppercase tracking-widest px-4 py-2 rounded-xl shadow-md transition-all self-start">
                    Member Portal Login <span className="text-[8px] font-sans">&gt;</span>
                  </Link>
                </div>
              </div>
            </div>

            {/* Right/Steps Row (rendered second in HTML, so it is on the right in LTR) */}
            <div className="flex-1 flex flex-col md:flex-row items-stretch justify-between gap-4">
              
              {/* Step 1 */}
              <div className="flex-1 w-full bg-white border border-pink-100/50 p-6 rounded-2xl shadow-2xs hover:border-[#D13F7A]/30 transition-all flex flex-col items-center justify-center text-center min-h-[180px]">
                <div className="w-10 h-10 rounded-full bg-white border-2 border-[#D13F7A] flex items-center justify-center text-[#D13F7A] shadow-2xs mb-4 shrink-0">
                  <Search size={18} />
                </div>
                <h4 className="font-bold text-sm text-[#1A1A1A]">Find Your Vibe</h4>
                <p className="text-[10px] text-slate-500 font-medium mt-1.5 leading-relaxed max-w-[170px]">Pick a class or workshop that speaks to your interests.</p>
              </div>

              {/* Step 2 */}
              <div className="flex-1 w-full bg-white border border-pink-100/50 p-6 rounded-2xl shadow-2xs hover:border-[#D13F7A]/30 transition-all flex flex-col items-center justify-center text-center min-h-[180px]">
                <div className="w-10 h-10 rounded-full bg-white border-2 border-[#D13F7A] flex items-center justify-center text-[#D13F7A] shadow-2xs mb-4 shrink-0">
                  <CalendarDays size={18} />
                </div>
                <h4 className="font-bold text-sm text-[#1A1A1A]">Pick Your Time</h4>
                <p className="text-[10px] text-slate-500 font-medium mt-1.5 leading-relaxed max-w-[170px]">Choose a slot from our schedule that fits your busy life.</p>
              </div>

              {/* Step 3 */}
              <div className="flex-1 w-full bg-white border border-pink-100/50 p-6 rounded-2xl shadow-2xs hover:border-[#D13F7A]/30 transition-all flex flex-col items-center justify-center text-center min-h-[180px]">
                <div className="w-10 h-10 rounded-full bg-white border-2 border-[#D13F7A] flex items-center justify-center text-[#D13F7A] shadow-2xs mb-4 shrink-0">
                  <CheckCircle2 size={18} />
                </div>
                <h4 className="font-bold text-sm text-[#1A1A1A]">Confirm & Shine</h4>
                <p className="text-[10px] text-slate-500 font-medium mt-1.5 leading-relaxed max-w-[170px]">Secure your spot and get ready to have absolute fun!</p>
              </div>

            </div>

          </div>

        </div>
      </section>
      )}

      {/* Main Booking Portal (ClientPortal) */}
      {settings.showBookingSection && (
        <section id="services" className="py-12 md:py-16 relative z-10 bg-[#FFF5F8] border-y border-pink-100/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Main Booking Header */}
          <div className="text-center mb-16 space-y-3">
            <h3 className="text-3xl sm:text-4xl lg:text-5xl font-normal font-display text-[#1A1A1A] uppercase tracking-widest">
              CLIENT PORTAL
            </h3>
            <p className="text-[10px] uppercase tracking-widest text-[#D13F7A] font-black">
              Choose a class or workshop, enter your details, and book your spot instantly!
            </p>
          </div>

          {/* ClientPortal Container styled elegantly */}
          <div className="bg-white rounded-[2.5rem] p-4 sm:p-8 border border-pink-100/30 shadow-xs">
            <ClientPortal 
              programs={programs} 
              categories={categories} 
              events={events} 
              workshops={workshops} 
              settings={settings}
            />
          </div>
        </div>
      </section>
      )}

      {/* Portal Promotion Section (Bottom Promotion Box) */}
      {settings.showPerksSection && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-12">
        <div className="relative w-full bg-gradient-to-r from-[#FFF0F4] via-[#FDF2F8] to-white rounded-[3rem] p-8 md:p-12 border border-pink-100/30 overflow-hidden shadow-2xs flex flex-col lg:flex-row items-center justify-between gap-12">
          
          {/* Left Column (swapped order to order-1 in LTR to put text on the left) */}
          <div className="flex-1 text-left space-y-6 z-10 order-1 lg:order-1">
            <span className="text-xs font-bold tracking-wider text-[#D13F7A] uppercase">
              + Member Perks
            </span>
            
            <h3 className="text-3xl sm:text-4xl font-normal leading-[1.25] font-display text-[#1A1A1A]">
              Discover Classes, <br />
              Workshops & More at <br />
              <span className="text-[#D13F7A]">{"Soly's Space ✨"}</span>
            </h3>
            
            <p className="text-sm text-slate-500 leading-relaxed font-medium max-w-xl">
              Your cozy personal corner to manage bookings, track schedules, and explore new workshops.
            </p>
            
            <div className="pt-2">
              <Link href="/client-login" className="inline-flex items-center gap-2 bg-[#D13F7A] hover:bg-[#B13064] text-white font-bold text-xs uppercase tracking-widest px-6 py-3 rounded-xl transition-all shadow-sm">
                <span>Member Portal Login</span>
                <Lock size={12} />
              </Link>
            </div>
          </div>

          {/* Right Column: Custom CSS Device Mockups (Laptop + Mobile Phone) (swapped order to order-2 in LTR to put image on the right) */}
          <div className="flex-1 flex justify-center items-center relative min-h-[250px] order-2 lg:order-2 shrink-0">
            
            {/* CSS Laptop Mockup */}
            <div className="relative">
              {/* Screen */}
              <div className="bg-slate-900 w-72 sm:w-80 h-44 sm:h-48 rounded-t-2xl border-[6px] border-slate-800 p-1.5 shadow-2xl relative overflow-hidden flex flex-col justify-between">
                {/* Top status bar */}
                <div className="flex justify-between items-center text-[7px] text-white/40 pb-1 border-b border-white/5 font-sans">
                  <span>{"Soly's Portal"}</span>
                  <div className="flex gap-1">
                    <span className="w-1 h-1 rounded-full bg-red-500"></span>
                    <span className="w-1 h-1 rounded-full bg-yellow-500"></span>
                    <span className="w-1 h-1 rounded-full bg-green-500"></span>
                  </div>
                </div>
                {/* Mini Dashboard Grid content */}
                <div className="flex-1 grid grid-cols-3 gap-2 p-1.5 text-left font-sans">
                  <div className="col-span-2 bg-white/5 rounded p-1 space-y-1">
                    <div className="h-1.5 w-12 bg-[#D13F7A]/80 rounded"></div>
                    <div className="h-1 w-20 bg-white/10 rounded"></div>
                    <div className="h-1 w-16 bg-white/10 rounded"></div>
                    {/* Tiny schedule dots */}
                    <div className="grid grid-cols-7 gap-0.5 pt-1.5">
                      {[...Array(14)].map((_, i) => (
                        <div key={i} className={`h-1 rounded-xs ${i === 3 || i === 8 ? 'bg-[#D13F7A]' : 'bg-white/10'}`}></div>
                      ))}
                    </div>
                  </div>
                  <div className="bg-white/5 rounded p-1 flex flex-col justify-between items-center text-center">
                    <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-[7px] text-[#D13F7A] font-black">S</div>
                    <div className="h-1 w-8 bg-white/20 rounded"></div>
                    <div className="h-1 w-6 bg-white/10 rounded"></div>
                  </div>
                </div>
              </div>
              {/* Keyboard base */}
              <div className="bg-slate-700 w-80 sm:w-88 h-3 rounded-b-2xl mx-auto border-t border-slate-600 shadow-xl relative z-10">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-1 bg-slate-800 rounded-b-xs"></div>
              </div>
            </div>

            {/* CSS Mobile Phone Mockup (overlaps the laptop) */}
            <div className="absolute -bottom-4 right-1/2 translate-x-20 sm:translate-x-24 bg-slate-900 w-32 sm:w-36 h-56 sm:h-64 rounded-[1.75rem] border-[5px] border-slate-800 p-2 shadow-2xl z-20 flex flex-col justify-between overflow-hidden">
              {/* Speaker / Camera notch */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-12 h-3.5 bg-slate-800 rounded-b-xl flex justify-center items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-black"></span>
                <span className="w-4 h-0.5 rounded-full bg-slate-700"></span>
              </div>
              {/* Screen Content */}
              <div className="flex-1 flex flex-col justify-between pt-3 pb-1 text-left font-sans">
                <div className="space-y-1 mt-1 text-center">
                  <div className="w-5 h-5 rounded-full bg-pink-50 flex items-center justify-center text-[7px] text-[#D13F7A] mx-auto border border-pink-100">S</div>
                  <div className="h-1.5 w-12 bg-white/20 rounded mx-auto"></div>
                </div>
                {/* Tiny buttons */}
                <div className="space-y-1 px-1">
                  <div className="bg-[#D13F7A] h-2.5 rounded-md flex items-center justify-center text-[5px] font-black text-white text-center">Book New Class</div>
                  <div className="bg-white/5 border border-white/10 h-2.5 rounded-md flex items-center justify-center text-[5px] text-white/60 text-center">Daily Schedule</div>
                  <div className="bg-white/5 border border-white/10 h-2.5 rounded-md flex items-center justify-center text-[5px] text-white/60 text-center">Balance: 5 Sessions</div>
                </div>
              </div>
            </div>

          </div>

        </div>
      </section>
      )}

      {/* Testimonials Section */}
      {settings.showTestimonials && testimonials.length > 0 && (
        <section id="testimonials" className="py-16 md:py-20 bg-white border-t border-pink-100/30">
          <div className="max-w-7xl mx-auto px-6 sm:px-8 space-y-16">
            
            <div className="text-center space-y-3">
              <span className="inline-flex items-center gap-1.5 text-xs font-black tracking-widest text-[#D13F7A] uppercase bg-pink-50 border border-pink-100/50 px-3.5 py-1.5 rounded-full">
                💬 Our Cozy Family
              </span>
              <h3 className="text-3xl sm:text-4xl lg:text-5xl font-normal font-display text-[#1A1A1A] uppercase tracking-widest text-center">
                WHAT THEY SAY
              </h3>
              <p className="text-[10px] uppercase tracking-widest text-[#D13F7A] font-black text-center">
                {"Love notes and stories from our lovely girls' community in Alexandria"}
              </p>
            </div>

            {/* Testimonial Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
              {testimonials.map((t) => {
                return (
                  <div
                    key={t.id}
                    className="bg-[#FFFDFE] border border-pink-100/50 rounded-[2rem] p-8 shadow-xs flex flex-col justify-between hover:shadow-sm transition-shadow text-left"
                  >
                    <div>
                      {/* 5 gold stars */}
                      <div className="flex gap-0.5 text-yellow-400 mb-5 justify-start">
                        {[...Array(5)].map((_, i) => (
                          <span key={i} className="text-sm">★</span>
                        ))}
                      </div>
                      {/* Content */}
                      <div className="text-foreground/75 font-semibold text-xs sm:text-sm leading-relaxed mb-8">
                        "{t.content}"
                      </div>
                    </div>
                    {/* User Profile */}
                    <div className="border-t border-pink-50/70 pt-5 flex items-center gap-3 justify-start">
                      <div className="text-left">
                        <h5 className="font-bold text-[#1A1A1A] text-xs">{t.name}</h5>
                        <p className="text-[10px] text-slate-400 font-medium mt-0.5">{t.role}</p>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Slider Pagination Dots */}
            <div className="flex justify-center items-center gap-2 pt-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#D13F7A]"></span>
              <span className="w-2.5 h-2.5 rounded-full bg-pink-200"></span>
              <span className="w-2.5 h-2.5 rounded-full bg-pink-200"></span>
            </div>

          </div>
        </section>
      )}

      <footer id="contact" className="bg-[#FFF5F8] border-t border-pink-100/50 pt-10 pb-12 md:pt-16 md:pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-12 mb-8 md:mb-12">
          
          {/* Column 1 - Brand Info */}
          <div className="space-y-4 text-left">
            <div className="flex items-center gap-3 justify-start">
               <div className="w-10 h-10 overflow-hidden rounded-xl border border-pink-100 bg-white p-0.5 shadow-2xs">
                 <img src="/logo.png" alt="Soly's Space" className="w-full h-full object-contain" />
               </div>
               <h2 className="text-lg font-normal text-[#1A1A1A] font-display">{"Soly's Space"}</h2>
            </div>
            <p className="text-slate-500 font-medium text-xs sm:text-sm leading-relaxed max-w-xs mr-auto">
              A cozy, strictly girls-only club to explore your passions, take fun classes, join creative workshops, and make new besties.
            </p>
            <div className="flex gap-3 justify-start pt-1">
              <a href="https://instagram.com" target="_blank" rel="noreferrer" className="w-8 h-8 rounded-lg bg-white hover:bg-[#D13F7A] hover:text-white transition-all flex items-center justify-center text-[#D13F7A] border border-pink-100/50 shadow-2xs">
                <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.051.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
                </svg>
              </a>
              <a href="https://tiktok.com" target="_blank" rel="noreferrer" className="w-8 h-8 rounded-lg bg-white hover:bg-[#D13F7A] hover:text-white transition-all flex items-center justify-center text-[#D13F7A] border border-pink-100/50 shadow-2xs">
                <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                  <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.05 1.62 4.2 1.21 1.4 2.93 2.38 4.78 2.64v3.86c-1.8-.24-3.55-1.12-4.83-2.42-.1.15-.22.3-.34.45-.04 3.9-.02 7.8-.03 11.7-.1 1.89-.83 3.73-2.18 5.08-1.72 1.72-4.22 2.58-6.64 2.3-2.62-.23-5.06-1.89-6.27-4.24-1.37-2.58-1.17-5.91.5-8.3 1.44-2.11 3.94-3.41 6.5-3.37v3.9c-1.4-.07-2.86.58-3.62 1.76-.84 1.25-.8 3 .1 4.14.93 1.21 2.64 1.62 4.01 1.02 1.07-.44 1.78-1.5 1.84-2.65.04-3.57.01-7.14.02-10.72 0-3.13-.01-6.27.02-9.4z"/>
                </svg>
              </a>
              <a href="https://snapchat.com" target="_blank" rel="noreferrer" className="w-8 h-8 rounded-lg bg-white hover:bg-[#D13F7A] hover:text-white transition-all flex items-center justify-center text-[#D13F7A] border border-pink-100/50 shadow-2xs">
                <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                  <path d="M12.002 2c-.116 0-.23.01-.341.026-.693.098-1.344.408-1.874.887-.665.602-1.127 1.39-1.392 2.247-.197.643-.538 1.229-1.002 1.706-.554.568-1.258.971-2.033 1.157-.367.088-.698.283-.93.551-.303.351-.433.822-.361 1.285.08.513.376.966.812 1.242.79.5 1.688.828 2.62 1.002.404.076.772.28 1.042.576.326.357.48.828.431 1.312-.086.852-.397 1.666-.9 2.355-.547.747-1.281 1.321-2.126 1.657-.655.26-.957.994-.683 1.644.22.52.723.86 1.284.86.136 0 .273-.02.408-.06.845-.25 1.62-.686 2.284-1.283.473-.424.847-.94 1.096-1.517.158-.367.432-.672.778-.867.391-.22.846-.334 1.307-.334s.916.114 1.307.334c.346.195.62.5.778.867.249.577.623 1.093 1.096 1.517.664.597 1.439 1.033 2.284 1.283.135.04.272.06.408.06.561 0 1.064-.34 1.284-.86.274-.65-.028-1.384-.683-1.644-.845-.336-1.579-.91-2.126-1.657-.503-.689-.814-1.503-.9-2.355-.049-.484.105-.955.431-1.312.27-.296.638-.5 1.042-.576.932-.174 1.83-.502 2.62-1.002.436-.276.732-.729.812-1.242.072-.463-.058-.934-.361-1.285-.232-.268-.563-.463-.93-.551-.775-.186-1.479-.589-2.033-1.157-.464-.477-.805-1.063-1.002-1.706-.265-.857-.727-1.645-1.392-2.247-.53-.479-1.181-.789-1.874-.887A3.208 3.208 0 0012.002 2z"/>
                </svg>
              </a>
            </div>
          </div>
          
          {/* Column 2 - Quick Links */}
          <div className="text-left">
            <h4 className="font-bold text-xs uppercase tracking-wider text-slate-400 mb-3">Quick Links</h4>
            <ul className="space-y-2 font-semibold text-slate-600 text-sm">
              <li><a href="#about" className="hover:text-[#D13F7A] transition-all">About Us</a></li>
              <li><a href="#services" className="hover:text-[#D13F7A] transition-all">Programs</a></li>
              <li><a href="#services" className="hover:text-[#D13F7A] transition-all">Pricing</a></li>
              <li><a href="#services" className="hover:text-[#D13F7A] transition-all">Events</a></li>
              <li><a href="#contact" className="hover:text-[#D13F7A] transition-all">Blog</a></li>
              <li><a href="#contact" className="hover:text-[#D13F7A] transition-all">Contact Us</a></li>
            </ul>
          </div>
          
          {/* Column 3 - Contact Info */}
          <div className="text-left">
            <h4 className="font-bold text-xs uppercase tracking-wider text-slate-400 mb-3">Contact Us</h4>
            <ul className="space-y-2.5 text-slate-600 text-sm">
              <li className="flex items-center gap-2.5 justify-start">
                <Phone size={15} className="text-primary shrink-0" />
                <span className="font-semibold text-slate-700">+20 100 123 4567</span>
              </li>
              <li className="flex items-center gap-2.5 justify-start">
                <Mail size={15} className="text-primary shrink-0" />
                <span className="font-semibold text-slate-700">hello@solysspace.com</span>
              </li>
              <li className="flex items-start gap-2.5 justify-start">
                <MapPin size={15} className="text-primary shrink-0 mt-0.5" />
                <span className="font-semibold text-slate-700 leading-relaxed">Fouad Street, Alexandria, Egypt</span>
              </li>
            </ul>
          </div>
          
        </div>
        
        {/* Bottom copyright line */}
        <div className="max-w-7xl mx-auto border-t border-pink-100/20 pt-6 text-center text-xs font-bold uppercase text-slate-400 tracking-wider font-display">
          {"© 2025 Soly's Space. All rights reserved."}
        </div>
      </footer>

    </div>
  )
}
