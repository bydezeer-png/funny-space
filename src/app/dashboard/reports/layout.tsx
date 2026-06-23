import Link from "next/link"
import { BarChart3, GraduationCap, Wrench, Calendar, ShoppingBag } from "lucide-react"
import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"

export const metadata = {
  title: 'التقارير الشاملة | Soly\'s Space'
}

export default async function ReportsLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!session?.user) redirect("/login")

  const currentUser = await prisma.user.findUnique({ where: { id: session.user.id } })
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

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-black text-foreground mb-2 flex items-center gap-3">
          <BarChart3 className="text-primary" />
          مركز التقارير الشامل
        </h1>
        <p className="text-foreground/60">اختر القسم الذي تريد الاطلاع على تقاريره المفصلة.</p>
      </div>

      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
        <ReportTab href="/dashboard/reports" icon={<BarChart3 size={18}/>} label="النظرة العامة" exact />
        <ReportTab href="/dashboard/reports/programs" icon={<GraduationCap size={18}/>} label="البرامج التدريبية" />
        <ReportTab href="/dashboard/reports/workshops" icon={<Wrench size={18}/>} label="ورش العمل" />
        <ReportTab href="/dashboard/reports/events" icon={<Calendar size={18}/>} label="الفعاليات" />
        <ReportTab href="/dashboard/reports/pos" icon={<ShoppingBag size={18}/>} label="الكاشير والمخزون" />
      </div>

      <div>
        {children}
      </div>
    </div>
  )
}

function ReportTab({ href, icon, label, exact = false }: { href: string, icon: React.ReactNode, label: string, exact?: boolean }) {
  return (
    <Link 
      href={href}
      className="flex items-center gap-2 whitespace-nowrap bg-card border border-border px-5 py-3 rounded-2xl hover:bg-muted/50 hover:border-primary/50 transition font-bold text-sm text-foreground/80 focus:bg-primary focus:text-primary-foreground focus:border-primary"
    >
      {icon}
      {label}
    </Link>
  )
}
