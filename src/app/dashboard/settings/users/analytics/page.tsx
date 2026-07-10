import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { BarChart3, TrendingUp, Users, ShoppingBag } from "lucide-react"

export const metadata = {
  title: 'إحصائيات الموظفين | Soly\'s Space',
}

export default async function EmployeeAnalyticsPage() {
  const session = await auth()
  
  if (!session?.user) {
    redirect("/login")
  }

  const currentUser = await prisma.user.findUnique({
    where: { id: session.user.id }
  })
  
  if (currentUser?.role !== "ADMIN" && !currentUser?.permissions.includes("CAN_VIEW_REPORTS")) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center">
        <div className="w-24 h-24 bg-red-100 text-red-500 rounded-full flex items-center justify-center mb-6 shadow-sm">
          <BarChart3 size={48} />
        </div>
        <h2 className="text-3xl font-black text-foreground mb-4">غير مصرح لك بالدخول</h2>
        <p className="text-foreground/60 text-lg">هذه الصفحة مخصصة لمديري النظام للاطلاع على التقارير.</p>
      </div>
    )
  }

  // Fetch all users with their generated enrollments and POS orders
  const users = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      role: true,
      isActive: true,
    }
  })

  // We have to aggregate manually since we want a combined view
  const userStats = await Promise.all(users.map(async (u) => {
    // Enrollments
    const enrollments = await prisma.enrollment.findMany({
      where: { createdByUserId: u.id, status: "CONFIRMED" },
      select: { amountPaid: true }
    })
    
    // POS Orders
    const posOrders = await prisma.pOSOrder.findMany({
      where: { createdByUserId: u.id, isReturned: false },
      select: { totalAmount: true }
    })

    const totalEnrollments = enrollments.length
    const enrollmentsRevenue = enrollments.reduce((sum, e) => sum + (e.amountPaid || 0), 0)
    
    const totalPOS = posOrders.length
    const posRevenue = posOrders.reduce((sum, o) => sum + o.totalAmount, 0)

    const totalRevenue = enrollmentsRevenue + posRevenue

    return {
      ...u,
      totalEnrollments,
      enrollmentsRevenue,
      totalPOS,
      posRevenue,
      totalRevenue
    }
  }))

  // Sort by highest revenue
  userStats.sort((a, b) => b.totalRevenue - a.totalRevenue)

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-primary to-pink-600 mb-2 flex items-center gap-3">
            إحصائيات وإنتاجية الموظفين <TrendingUp className="text-primary"/>
          </h1>
          <p className="text-foreground/60 font-medium">
            متابعة أداء كل موظفة بناءً على الاشتراكات والمبيعات التي قامت بتسجيلها.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {userStats.map(stat => (
          <div key={stat.id} className="bg-card border border-border p-6 rounded-3xl shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-14 h-14 rounded-full bg-gradient-to-r from-primary/20 to-pink-500/20 flex items-center justify-center text-primary font-black text-xl border border-primary/10">
                {stat.name.charAt(0)}
              </div>
              <div>
                <h3 className="font-black text-foreground text-xl">{stat.name}</h3>
                <span className={`text-xs font-bold px-2 py-0.5 rounded-md ${stat.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                  {stat.role} {stat.isActive ? '' : '(محظور)'}
                </span>
              </div>
            </div>

            <div className="space-y-4 mb-6">
              <div className="flex justify-between items-center p-3 bg-muted/30 rounded-2xl border border-border/50">
                <div className="flex items-center gap-2 text-foreground/70 font-bold text-sm">
                  <Users size={16} className="text-primary" /> حجوزات واشتراكات
                </div>
                <div className="text-left">
                  <div className="font-black text-foreground">{stat.totalEnrollments} <span className="text-xs font-normal">عميلة</span></div>
                  <div className="text-xs text-primary font-bold">{stat.enrollmentsRevenue} ج.م</div>
                </div>
              </div>

              <div className="flex justify-between items-center p-3 bg-muted/30 rounded-2xl border border-border/50">
                <div className="flex items-center gap-2 text-foreground/70 font-bold text-sm">
                  <ShoppingBag size={16} className="text-primary" /> مبيعات كاشير
                </div>
                <div className="text-left">
                  <div className="font-black text-foreground">{stat.totalPOS} <span className="text-xs font-normal">طلب</span></div>
                  <div className="text-xs text-primary font-bold">{stat.posRevenue} ج.م</div>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-border flex justify-between items-center">
              <span className="text-foreground/60 font-bold text-sm">إجمالي الإيرادات المُدخلة</span>
              <span className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-primary to-pink-600">
                {stat.totalRevenue} <span className="text-sm font-bold text-foreground/50">ج.م</span>
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
