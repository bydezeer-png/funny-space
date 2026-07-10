import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import Link from "next/link"
import { 
  Users, 
  CreditCard, 
  CalendarDays, 
  TrendingUp, 
  BarChart3, 
  ShoppingCart, 
  UserPlus, 
  MessageSquare, 
  AlertTriangle, 
  ArrowUpLeft, 
  Clock, 
  Sparkles, 
  CheckCircle2, 
  ChevronLeft 
} from "lucide-react"
import { RevenueChart } from "@/components/RevenueChart"
import { checkUserPermission, PERMISSIONS } from "@/lib/permissions"

export default async function DashboardPage() {
  const session = await auth()
  
  if (!session) {
    redirect("/login")
  }

  // Fetch current user and check permissions
  const currentUser = await prisma.user.findUnique({
    where: { id: session.user?.id }
  })

  const canViewReports = checkUserPermission(currentUser, PERMISSIONS.VIEW_REPORTS)
  const canAddClient = checkUserPermission(currentUser, PERMISSIONS.ADD_CLIENT)
  const canBookEnrollment = checkUserPermission(currentUser, [PERMISSIONS.BOOK_ENROLLMENT, PERMISSIONS.CONFIRM_ENROLLMENT, PERMISSIONS.CANCEL_ENROLLMENT, PERMISSIONS.RECORD_ATTENDANCE])
  const canSellPos = checkUserPermission(currentUser, [PERMISSIONS.SELL_POS, PERMISSIONS.RETURN_ORDER, PERMISSIONS.MANAGE_INVENTORY, PERMISSIONS.OPEN_CLOSE_SHIFT])
  const canEditTestimonials = checkUserPermission(currentUser, [PERMISSIONS.EDIT_CLIENT, PERMISSIONS.MANAGE_USERS])

  // Fetch real stats
  const clientCount = await prisma.client.count()
  
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  
  const todayTransactions = await prisma.transaction.aggregate({
    where: { 
      createdAt: { gte: today },
      type: "REVENUE"
    },
    _sum: { amount: true }
  })
  
  const todayRevenue = todayTransactions._sum.amount || 0

  const activeEnrollments = await prisma.enrollment.count({
    where: { status: "CONFIRMED" }
  })

  // Fetch 5 most recent enrollments
  const recentEnrollments = await prisma.enrollment.findMany({
    take: 5,
    orderBy: { createdAt: "desc" },
    include: {
      client: true,
      program: true,
      workshop: true,
      event: true,
    }
  })

  // Fetch 5 items with low stock (quantity <= 5)
  const lowStockItems = await prisma.inventoryItem.findMany({
    where: { quantity: { lte: 5 } },
    take: 5,
    orderBy: { quantity: "asc" }
  })

  // Fetch testimonials count
  const testimonialsCount = await prisma.testimonial.count()
  const activeTestimonialsCount = await prisma.testimonial.count({
    where: { isActive: true }
  })

  // Fetch real chart data for the last 7 days
  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6)
  sevenDaysAgo.setHours(0, 0, 0, 0)

  const recentTransactions = await prisma.transaction.findMany({
    where: {
      createdAt: { gte: sevenDaysAgo },
      type: "REVENUE"
    },
    select: { amount: true, createdAt: true }
  })

  // Group by day of week
  const daysMap = ["الأحد", "الإثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"]
  
  // Initialize the last 7 days in order
  const chartDataMap = new Map()
  for (let i = 6; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    chartDataMap.set(daysMap[d.getDay()], 0)
  }

  // Aggregate transactions into the map
  recentTransactions.forEach(tx => {
    const dayName = daysMap[tx.createdAt.getDay()]
    if (chartDataMap.has(dayName)) {
      chartDataMap.set(dayName, chartDataMap.get(dayName) + tx.amount)
    }
  })

  const chartData = Array.from(chartDataMap.entries()).map(([name, total]) => ({
    name,
    total
  }))

  const getServiceInfo = (e: any) => {
    if (e.program) return { name: e.program.name, type: "برنامج", color: "bg-secondary text-primary border-border" }
    if (e.workshop) return { name: e.workshop.name, type: "ورشة عمل", color: "bg-orange-50 text-orange-600 border-orange-100" }
    if (e.event) return { name: e.event.name, type: "فعالية", color: "bg-purple-50 text-purple-600 border-purple-100" }
    return { name: "خدمة غير محددة", type: "أخرى", color: "bg-muted/30 text-foreground/50 border-border" }
  }

  return (
    <div className="space-y-6 md:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 text-right">
      
      {/* Welcome Banner */}
      <div className="bg-card p-6 md:p-8 rounded-2xl md:rounded-[2rem] border border-border shadow-sm relative overflow-hidden flex flex-col md:flex-row justify-between items-start md:items-center gap-4 md:gap-6">
        <div className="absolute -top-12 -left-12 w-32 h-32 bg-primary/5 rounded-full blur-3xl"></div>
        <div className="z-10">
          <h2 className="text-2xl md:text-3xl font-extrabold text-foreground mb-1 md:mb-2 flex items-center gap-2">
            <span>مرحباً بكِ، {session.user?.name || "مديرة النظام"} 👋</span>
          </h2>
          <p className="text-foreground/60 text-sm md:text-base font-semibold">
            إليكِ نظرة شاملة على أداء وفعاليات Soly's Space اليوم.
          </p>
        </div>
        <div className="z-10 bg-primary/10 border border-primary/20 px-4 py-2 rounded-2xl flex items-center gap-2">
          <Sparkles size={16} className="text-primary animate-pulse" />
          <span className="text-xs font-black text-primary">لوحة القيادة والتحكم</span>
        </div>
      </div>

      {/* Quick Action Shortcuts */}
      <div className="space-y-3 md:space-y-4">
        <h3 className="text-xs font-black text-foreground/45 uppercase tracking-wider">الوصول السريع والإجراءات</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
          
          {canBookEnrollment && (
            <Link href="/dashboard/reception" className="bg-card hover:bg-pink-50/10 border border-border hover:border-primary/30 p-4 md:p-5 rounded-2xl md:rounded-[2rem] shadow-sm hover:shadow-md transition-all duration-300 group flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-colors">
                <CalendarDays size={18} />
              </div>
              <div className="text-right">
                <h4 className="text-sm font-black text-foreground">الحجوزات والدفع</h4>
                <p className="text-[10px] text-foreground/45 font-bold mt-1">تأكيد حجوزات الفتيات</p>
              </div>
            </Link>
          )}

          {canSellPos && (
            <Link href="/dashboard/pos/buy" className="bg-card hover:bg-pink-50/10 border border-border hover:border-primary/30 p-4 md:p-5 rounded-2xl md:rounded-[2rem] shadow-sm hover:shadow-md transition-all duration-300 group flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl bg-secondary text-secondary-foreground flex items-center justify-center group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                <ShoppingCart size={18} />
              </div>
              <div className="text-right">
                <h4 className="text-sm font-black text-foreground">شاشة الكاشير</h4>
                <p className="text-[10px] text-foreground/45 font-bold mt-1">عملية بيع سريعة بالـ POS</p>
              </div>
            </Link>
          )}

          {canAddClient && (
            <Link href="/dashboard/clients/new" className="bg-card hover:bg-pink-50/10 border border-border hover:border-primary/30 p-4 md:p-5 rounded-2xl md:rounded-[2rem] shadow-sm hover:shadow-md transition-all duration-300 group flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-colors">
                <UserPlus size={18} />
              </div>
              <div className="text-right">
                <h4 className="text-sm font-black text-foreground">إضافة عميلة</h4>
                <p className="text-[10px] text-foreground/45 font-bold mt-1">تسجيل مشتركة جديدة</p>
              </div>
            </Link>
          )}

          {canEditTestimonials && (
            <Link href="/dashboard/testimonials" className="bg-card hover:bg-pink-50/10 border border-border hover:border-primary/30 p-4 md:p-5 rounded-2xl md:rounded-[2rem] shadow-sm hover:shadow-md transition-all duration-300 group flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl bg-secondary text-secondary-foreground flex items-center justify-center group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                <MessageSquare size={18} />
              </div>
              <div className="text-right">
                <h4 className="text-sm font-black text-foreground">آراء الموقع</h4>
                <p className="text-[10px] text-foreground/45 font-bold mt-1">تعديل المراجعات والتقييمات</p>
              </div>
            </Link>
          )}

        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
        
        <div className="bg-card p-5 md:p-6 rounded-2xl md:rounded-[2rem] border border-border hover:border-primary/30 transition-all shadow-sm group">
          <div className="flex justify-between items-start mb-4">
            <div className="p-4 bg-primary/10 text-primary rounded-2xl group-hover:bg-primary group-hover:text-white transition-colors"><Users size={24}/></div>
            <span className="text-xs font-bold text-green-600 bg-green-150/10 border border-green-100 px-3 py-1 rounded-full flex items-center gap-1"><TrendingUp size={12}/> نشط</span>
          </div>
          <h3 className="text-foreground/60 text-sm font-bold mb-1">إجمالي العميلات المسجلات</h3>
          <p className="text-4xl font-black text-foreground">{clientCount}</p>
        </div>

        {canViewReports ? (
          <div className="bg-card p-5 md:p-6 rounded-2xl md:rounded-[2rem] border border-border hover:border-primary/30 transition-all shadow-sm group">
            <div className="flex justify-between items-start mb-4">
              <div className="p-4 bg-secondary text-secondary-foreground rounded-2xl group-hover:bg-primary group-hover:text-primary-foreground transition-colors"><CreditCard size={24}/></div>
              <span className="text-[10px] font-bold text-primary bg-secondary border border-border px-2.5 py-1 rounded-full">اليوم</span>
            </div>
            <h3 className="text-foreground/60 text-sm font-bold mb-1">إيرادات الخزينة اليوم</h3>
            <p className="text-4xl font-black text-foreground">{todayRevenue} <span className="text-lg text-foreground/50">ج.م</span></p>
          </div>
        ) : (
          <div className="bg-card p-5 md:p-6 rounded-2xl md:rounded-[2rem] border border-border hover:border-primary/30 transition-all shadow-sm group">
            <div className="flex justify-between items-start mb-4">
              <div className="p-4 bg-secondary text-secondary-foreground rounded-2xl group-hover:bg-primary group-hover:text-primary-foreground transition-colors"><MessageSquare size={24}/></div>
              <span className="text-[10px] font-bold text-primary bg-secondary border border-border px-2.5 py-1 rounded-full">المراجعات</span>
            </div>
            <h3 className="text-foreground/60 text-sm font-bold mb-1">الآراء المفعلة بالموقع</h3>
            <p className="text-4xl font-black text-foreground">{activeTestimonialsCount} <span className="text-xs text-foreground/40 font-bold">/ {testimonialsCount} إجمالي</span></p>
          </div>
        )}

        <div className="bg-card p-5 md:p-6 rounded-2xl md:rounded-[2rem] border border-border hover:border-primary/30 transition-all shadow-sm group">
          <div className="flex justify-between items-start mb-4">
            <div className="p-4 bg-primary/10 text-primary rounded-2xl group-hover:bg-primary group-hover:text-white transition-colors"><CalendarDays size={24}/></div>
            <span className="text-[10px] font-bold text-green-600 bg-green-50 border border-green-100 px-2.5 py-1 rounded-full">مفعلة</span>
          </div>
          <h3 className="text-foreground/60 text-sm font-bold mb-1">الاشتراكات الفعالة حالياً</h3>
          <p className="text-4xl font-black text-foreground">{activeEnrollments}</p>
        </div>

      </div>

      {/* Main Grid: Analytics & Activities */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
        
        {/* Left Column (Chart & Activity) */}
        <div className="lg:col-span-2 space-y-4 md:space-y-6">
          
          {/* Revenue Chart */}
          {canViewReports ? (
            <div className="bg-card p-4 sm:p-6 md:p-8 rounded-2xl md:rounded-[2.5rem] border border-border shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-primary/10 rounded-2xl text-primary">
                    <BarChart3 size={20} />
                  </div>
                  <div className="text-right">
                    <h3 className="text-lg font-black text-foreground">نظرة عامة على الإيرادات</h3>
                    <p className="text-xs font-bold text-foreground/50">إحصائيات الأسبوع الحالي</p>
                  </div>
                </div>
              </div>
              <RevenueChart data={chartData} />
            </div>
          ) : (
            <div className="bg-card p-8 rounded-[2.5rem] border border-border shadow-sm text-center py-16">
              <div className="w-16 h-16 bg-secondary text-primary rounded-full flex items-center justify-center mx-auto mb-4 border border-border">
                <Sparkles size={28} />
              </div>
              <h3 className="text-xl font-black text-foreground mb-2">أهلاً بكِ في لوحة القيادة لـ Soly's Space</h3>
              <p className="text-xs text-foreground/55 font-bold max-w-md mx-auto leading-relaxed">
                استخدمي القائمة الجانبية أو الاختصارات بالأعلى لإدارة الحجوزات، العميلات، البرامج، والورديات بسهولة وسرعة تامة حسب صلاحيات حسابك.
              </p>
            </div>
          )}

          {/* Recent Booking Activity Feed */}
          <div className="bg-card p-4 sm:p-6 rounded-2xl md:rounded-[2.5rem] border border-border shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-border/50 pb-4">
              <Link href="/dashboard/reception" className="text-xs font-black text-primary hover:underline flex items-center gap-1">
                عرض الكل <ChevronLeft size={14} />
              </Link>
              <div className="flex items-center gap-2">
                <Clock size={18} className="text-foreground/45" />
                <h3 className="text-base font-black text-foreground">أحدث الحجوزات والطلبات</h3>
              </div>
            </div>

            {recentEnrollments.length === 0 ? (
              <p className="text-foreground/50 text-xs font-semibold py-8 text-center">لا توجد حجوزات مسجلة بعد.</p>
            ) : (
              <div className="divide-y divide-border/50">
                {recentEnrollments.map((e) => {
                  const service = getServiceInfo(e)
                  return (
                    <div key={e.id} className="py-3.5 flex items-center justify-between gap-4 first:pt-0 last:pb-0">
                      
                      {/* Right: User and service details */}
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-secondary border border-border text-primary flex items-center justify-center font-black text-xs shrink-0 select-none">
                          {e.client.name.trim().charAt(0)}
                        </div>
                        <div className="text-right min-w-0">
                          <h4 className="font-black text-sm text-foreground truncate">{e.client.name}</h4>
                          <div className="flex items-center gap-2 mt-1">
                            <span className={`text-[8px] font-black px-2 py-0.5 rounded-full border ${service.color}`}>
                              {service.type}
                            </span>
                            <span className="text-[10px] text-foreground/50 truncate font-semibold">{service.name}</span>
                          </div>
                        </div>
                      </div>

                      {/* Left: Price / Status */}
                      <div className="text-left shrink-0">
                        <span className="text-sm font-black text-foreground">
                          {e.totalAmount} ج.م
                        </span>
                        <div className="flex items-center justify-end gap-1.5 mt-1">
                          <span className="text-[9px] font-black text-foreground/40">
                            {e.status === 'CONFIRMED' ? 'مؤكد ودفع' : 'بانتظار الدفع'}
                          </span>
                          <span className={`w-1.5 h-1.5 rounded-full ${e.status === 'CONFIRMED' ? 'bg-green-500' : 'bg-amber-500'}`}></span>
                        </div>
                      </div>

                    </div>
                  )
                })}
              </div>
            )}
          </div>

        </div>

        {/* Right Column (Widgets) */}
        <div className="space-y-6">
          
          {/* Inventory Alerts Widget */}
          <div className="bg-card p-4 sm:p-6 rounded-2xl md:rounded-[2.5rem] border border-border shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-border/50 pb-4">
              <Link href="/dashboard/pos/inventory" className="text-xs font-black text-primary hover:underline flex items-center gap-1">
                إدارة المخزون <ChevronLeft size={14} />
              </Link>
              <div className="flex items-center gap-2">
                <AlertTriangle size={18} className="text-amber-500" />
                <h3 className="text-base font-black text-foreground">نواقص المخزن (نقص الكميات)</h3>
              </div>
            </div>

            {lowStockItems.length === 0 ? (
              <div className="py-6 text-center flex flex-col items-center justify-center">
                <div className="w-10 h-10 rounded-full bg-green-50 text-green-600 flex items-center justify-center border border-green-100 mb-2">
                  <CheckCircle2 size={18} />
                </div>
                <p className="text-xs font-black text-foreground/60">كل المنتجات متوفرة بشكل ممتاز!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {lowStockItems.map((item) => (
                  <div key={item.id} className="flex items-center justify-between p-3 rounded-2xl bg-amber-50/20 border border-amber-100/50">
                    <span className={`text-[10px] font-black px-2 py-1 rounded-full ${item.quantity === 0 ? 'bg-red-50 text-red-600 border border-red-100' : 'bg-amber-50 text-amber-600 border border-amber-100'}`}>
                      {item.quantity === 0 ? 'نفذت الكمية' : `متبقي: ${item.quantity}`}
                    </span>
                    <div className="text-right">
                      <h5 className="text-xs font-black text-foreground">{item.name}</h5>
                      <p className="text-[9px] text-foreground/45 font-bold mt-0.5">{item.category}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Testimonial Widget */}
          <div className="bg-card p-4 sm:p-6 rounded-2xl md:rounded-[2.5rem] border border-border shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-border/50 pb-4">
              <Link href="/dashboard/testimonials" className="text-xs font-black text-primary hover:underline flex items-center gap-1">
                تعديل الآراء <ChevronLeft size={14} />
              </Link>
              <div className="flex items-center gap-2">
                <MessageSquare size={18} className="text-foreground/45" />
                <h3 className="text-base font-black text-foreground">تقييمات وآراء العميلات</h3>
              </div>
            </div>

            <div className="flex justify-around items-center py-4 bg-pink-50/10 border border-border/30 rounded-2xl">
              <div className="text-center">
                <p className="text-3xl font-black text-primary">{activeTestimonialsCount}</p>
                <p className="text-[10px] font-black text-foreground/50 mt-1">النشطة بالموقع</p>
              </div>
              <div className="w-[1px] h-10 bg-border"></div>
              <div className="text-center">
                <p className="text-3xl font-black text-foreground">{testimonialsCount}</p>
                <p className="text-[10px] font-black text-foreground/50 mt-1">إجمالي الآراء</p>
              </div>
            </div>
            
            <p className="text-[10px] text-foreground/50 font-semibold leading-relaxed text-center">
              الآراء النشطة تظهر تلقائياً في أسفل الصفحة الرئيسية للزوار لبناء الثقة وجذب مشتركات جدد.
            </p>
          </div>

        </div>

      </div>

    </div>
  )
}
