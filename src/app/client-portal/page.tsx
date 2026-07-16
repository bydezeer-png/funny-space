import { auth, signOut } from "@/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { 
  LogOut, 
  User, 
  Phone, 
  BookOpen, 
  Zap, 
  Music, 
  CheckCircle2, 
  Clock, 
  AlertTriangle,
  Sparkles,
  CalendarDays,
  UserCheck
} from "lucide-react"
import Link from "next/link"

export default async function ClientPortalPage() {
  const session = await auth()
  
  // Guard clause: redirect if not logged in or not a client
  if (!session?.user || (session.user as any).role !== "CLIENT") {
    redirect("/client-login")
  }

  // Fetch client details with enrollments
  const client = await prisma.client.findUnique({
    where: { id: session.user.id },
    include: {
      enrollments: {
        include: {
          program: {
            include: {
              category: true
            }
          },
          option: {
            include: {
              schedules: true
            }
          },
          workshop: true,
          event: true,
          attendances: {
            orderBy: { date: 'desc' }
          }
        },
        orderBy: { createdAt: 'desc' }
      }
    }
  })

  if (!client) {
    redirect("/client-login")
  }

  // Calculate statistics
  const confirmedEnrollments = client.enrollments.filter(e => e.status === "CONFIRMED")
  const pendingEnrollments = client.enrollments.filter(e => e.status === "PENDING")
  
  const totalAttendances = confirmedEnrollments.reduce((sum, e) => sum + e.attendances.length, 0)
  
  const totalRemainingBalance = confirmedEnrollments.reduce((sum, e) => {
    const price = e.option?.price || e.workshop?.price || e.event?.price || 0
    const paid = e.amountPaid || 0
    const remaining = price - paid
    return sum + (remaining > 0 ? remaining : 0)
  }, 0)

  const days = ["الأحد", "الإثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"]

  return (
    <div className="min-h-screen bg-secondary relative selection:bg-primary/30 selection:text-primary-foreground font-sans overflow-x-hidden">
      
      {/* Decorative Glows */}
      <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-pink-100/30 rounded-full blur-[120px] pointer-events-none -z-10"></div>
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-pink-50/40 rounded-full blur-[120px] pointer-events-none -z-10"></div>

      {/* Portal Navbar */}
      <nav className="bg-card/80 backdrop-blur-md border-b border-border/50 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-primary to-pink-300 p-[1px] shadow-sm">
              <div className="w-full h-full bg-card rounded-xl flex items-center justify-center font-black text-primary">S</div>
            </div>
            <div>
              <span className="text-sm font-black text-foreground">بوابة المشتركات</span>
              <p className="text-[8px] text-primary font-black uppercase tracking-wider">Soly's Space</p>
            </div>
          </div>

          <form action={async () => {
            "use server"
            await signOut({ redirectTo: "/" })
          }}>
            <button 
              type="submit"
              className="flex items-center gap-2 bg-pink-50 text-primary hover:bg-primary hover:text-white px-4 py-2.5 rounded-xl text-xs font-black transition-all border border-border/50"
            >
              <LogOut size={14} /> تسجيل الخروج
            </button>
          </form>
        </div>
      </nav>

      {/* Main Container */}
      <main className="max-w-5xl mx-auto px-6 py-10 space-y-10">
        
        {/* Welcome Profile Card */}
        <section className="bg-card border border-border/70 rounded-[2rem] p-6 sm:p-8 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-6 relative overflow-hidden">
          <div className="absolute -top-10 -right-10 w-28 h-28 bg-pink-50 rounded-full blur-2xl opacity-60"></div>
          
          <div className="flex items-center gap-4 text-center sm:text-right flex-col sm:flex-row">
            <div className="w-16 h-16 rounded-full bg-pink-100 flex items-center justify-center text-primary border border-pink-200/50 shadow-inner">
              <User size={28} />
            </div>
            <div>
              <div className="flex items-center gap-2 justify-center sm:justify-start">
                <h2 className="text-xl sm:text-2xl font-black text-foreground">{client.name}</h2>
                <span className="inline-flex items-center gap-1 py-0.5 px-2.5 rounded-full bg-pink-500 text-white font-black text-[9px] shadow-sm">
                  <Sparkles size={8} className="animate-spin duration-3000" /> عضوة مميزة
                </span>
              </div>
              <p className="text-xs sm:text-sm font-bold text-foreground/50 mt-1 flex items-center gap-1 justify-center sm:justify-start" dir="ltr">
                <span>{client.phone}</span> <Phone size={12} className="text-primary/70" />
              </p>
            </div>
          </div>

          <div className="flex gap-4 w-full sm:w-auto">
            <Link 
              href="/#services" 
              className="flex-1 sm:flex-none text-center bg-primary text-white hover:bg-primary/95 px-6 py-3.5 rounded-2xl text-sm font-black transition-all shadow-md shadow-pink-200/30"
            >
              حجز برنامج جديد +
            </Link>
          </div>
        </section>

        {/* Stats Grid */}
        <section className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {/* Stat 1 */}
          <div className="bg-card border border-border/70 p-6 rounded-3xl shadow-sm text-center">
            <span className="text-xs font-black text-foreground/40 block mb-2">الاشتراكات الفعالة</span>
            <div className="text-3xl font-black text-primary">{confirmedEnrollments.length}</div>
          </div>
          {/* Stat 2 */}
          <div className="bg-card border border-border/70 p-6 rounded-3xl shadow-sm text-center">
            <span className="text-xs font-black text-foreground/40 block mb-2">إجمالي الحضور</span>
            <div className="text-3xl font-black text-green-500">{totalAttendances} حصة</div>
          </div>
          {/* Stat 3 */}
          <div className="bg-card border border-border/70 p-6 rounded-3xl shadow-sm text-center">
            <span className="text-xs font-black text-foreground/40 block mb-2">المستحقات المالية المتبقية</span>
            <div className="text-3xl font-black text-orange-500">{totalRemainingBalance} ج.م</div>
          </div>
        </section>

        {/* Enrollments Title */}
        <section className="space-y-6">
          <h3 className="text-lg sm:text-xl font-black text-foreground border-r-4 border-primary pr-3 py-0.5">
            تفاصيل اشتراكاتكِ الحالية 🎟️
          </h3>

          {client.enrollments.length === 0 ? (
            <div className="bg-card border border-border/70 rounded-3xl p-12 text-center text-foreground/50 font-bold">
              لا توجد اشتراكات مسجلة حالياً. تفضلي بزيارة جدول الحصص لحجز برنامجكِ الأول!
            </div>
          ) : (
            <div className="space-y-6">
              {client.enrollments.map((e) => {
                // Determine item details
                let typeText = ""
                let title = ""
                let price = 0
                let icon = null
                let colorClass = ""
                let bgClass = ""

                if (e.program) {
                  typeText = "برنامج تدريبي"
                  title = e.program.name
                  price = e.option?.price || 0
                  icon = <BookOpen size={16} />
                  colorClass = "text-blue-500"
                  bgClass = "bg-blue-500/10 border-blue-100"
                } else if (e.workshop) {
                  typeText = "ورشة تدريبية"
                  title = e.workshop.name
                  price = e.workshop.price
                  icon = <Zap size={16} />
                  colorClass = "text-orange-500"
                  bgClass = "bg-orange-500/10 border-orange-100"
                } else if (e.event) {
                  typeText = "حفلة / فعالية"
                  title = e.event.name
                  price = e.event.price
                  icon = <Music size={16} />
                  colorClass = "text-purple-500"
                  bgClass = "bg-purple-500/10 border-purple-100"
                }

                const paid = e.amountPaid || 0
                const remaining = price - paid
                const totalSessions = e.option?.sessionsPerMonth || 0

                return (
                  <div 
                    key={e.id} 
                    className="bg-card border border-border/70 rounded-[2rem] p-6 shadow-sm flex flex-col md:flex-row justify-between items-stretch gap-6 relative overflow-hidden"
                  >
                    
                    {/* Right column: Name, Type, Schedule, Attendance Progress */}
                    <div className="flex-1 space-y-4 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                          <span className={`text-[10px] font-black px-3 py-1 rounded-full border flex items-center gap-1.5 ${colorClass} ${bgClass}`}>
                            {icon} {typeText}
                          </span>
                          
                          {e.status === "CONFIRMED" ? (
                            <span className="text-[10px] font-black px-3 py-1 rounded-full bg-green-50 text-green-600 border border-green-100 flex items-center gap-1">
                              <CheckCircle2 size={12}/> فعال ومؤكد
                            </span>
                          ) : e.status === "PENDING" ? (
                            <span className="text-[10px] font-black px-3 py-1 rounded-full bg-yellow-50 text-yellow-600 border border-yellow-100 flex items-center gap-1">
                              <Clock size={12}/> بانتظار التأكيد
                            </span>
                          ) : (
                            <span className="text-[10px] font-black px-3 py-1 rounded-full bg-red-50 text-red-600 border border-red-100">
                              ملغى
                            </span>
                          )}

                          <span className="text-[10px] text-foreground/40 font-bold">
                            تاريخ الحجز: {new Date(e.createdAt).toLocaleDateString('ar-EG')}
                          </span>
                        </div>

                        <h4 className="text-xl font-black text-foreground">{title}</h4>
                      </div>

                      {/* Display schedules for programs */}
                      {e.option && e.option.schedules.length > 0 && (
                        <div className="text-xs font-semibold bg-secondary border border-border/30 rounded-xl p-3 inline-flex flex-wrap gap-x-4 gap-y-1.5 w-max">
                          <span className="text-primary font-black flex items-center gap-1 shrink-0"><CalendarDays size={13}/> مواعيدكِ:</span>
                          {e.option.schedules.map((sch, i) => (
                            <span key={i} className="text-foreground/75">
                              {days[sch.dayOfWeek]} ({sch.startTime} - {sch.endTime})
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Attendance Progress Bar for confirmed programs */}
                      {e.status === "CONFIRMED" && e.program && (
                        <div className="space-y-2 max-w-md">
                          <div className="flex justify-between items-center text-xs font-bold text-foreground/70">
                            <span className="flex items-center gap-1"><UserCheck size={14} className="text-green-500" /> الحصص المستهلكة</span>
                            <span>{e.attendances.length} من أصل {totalSessions} حصة</span>
                          </div>
                          <div className="w-full bg-pink-50/50 rounded-full h-2.5 border border-border/30">
                            <div 
                              className="bg-green-500 h-full rounded-full transition-all duration-500" 
                              style={{ width: `${Math.min(100, (e.attendances.length / totalSessions) * 100)}%` }}
                            ></div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Left column: Financial status badge and details */}
                    <div className="w-full md:w-64 border-t md:border-t-0 md:border-r border-pink-50 pt-6 md:pt-0 md:pr-6 flex flex-col justify-between gap-4">
                      
                      {/* Financial values */}
                      <div className="space-y-2 text-xs font-bold text-foreground/70">
                        <div className="flex justify-between">
                          <span>قيمة الاشتراك:</span>
                          <span className="text-foreground font-black">{price} ج.م</span>
                        </div>
                        <div className="flex justify-between">
                          <span>المدفوع حالياً:</span>
                          <span className="text-green-600 font-black">{paid} ج.م</span>
                        </div>
                        
                        {e.status === "CONFIRMED" && remaining > 0 ? (
                          <div className="flex justify-between border-t border-pink-50/50 pt-2 text-orange-600">
                            <span>المبلغ المتبقي:</span>
                            <span className="font-black text-sm">{remaining} ج.م</span>
                          </div>
                        ) : e.status === "CONFIRMED" ? (
                          <div className="text-center bg-green-50 text-green-600 border border-green-100 py-1.5 rounded-lg text-[10px] font-black mt-2">
                            ✓ مدفوع بالكامل
                          </div>
                        ) : null}
                      </div>

                      {/* Action status note */}
                      {e.status === "PENDING" && (
                        <div className="bg-yellow-50/50 border border-yellow-100/60 p-3 rounded-xl flex items-start gap-2 text-[10px] text-yellow-800 leading-relaxed">
                          <AlertTriangle size={14} className="shrink-0 text-yellow-600 mt-0.5" />
                          <span>يرجى زيارة الاستقبال لتسوية الرسوم وتأكيد التفعيل لحضور الحصص.</span>
                        </div>
                      )}

                      {e.status === "CONFIRMED" && remaining > 0 && (
                        <div className="bg-orange-50/50 border border-orange-100/60 p-3 rounded-xl flex items-start gap-2 text-[10px] text-orange-800 leading-relaxed">
                          <AlertTriangle size={14} className="shrink-0 text-orange-600 mt-0.5" />
                          <span>الرجاء سداد المبلغ المتبقي ({remaining} ج.م) في مقر النادي لضمان استمرار التسجيل.</span>
                        </div>
                      )}

                    </div>

                  </div>
                )
              })}
            </div>
          )}
        </section>

      </main>
    </div>
  )
}
