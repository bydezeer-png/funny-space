import { getPOSReports } from "@/actions/pos"
import { TrendingUp, TrendingDown, DollarSign, Receipt, Package, Wallet, CreditCard, Banknote } from "lucide-react"
import Link from "next/link"
import OverviewChart from "./OverviewChart"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { checkUserPermission, PERMISSIONS } from "@/lib/permissions"
import AccessDenied from "@/components/AccessDenied"

export const dynamic = "force-dynamic"

export default async function POSReportsOverview() {
  const session = await auth()
  const currentUser = await prisma.user.findUnique({
    where: { id: session?.user?.id }
  })

  if (!checkUserPermission(currentUser, [PERMISSIONS.RETURN_ORDER, PERMISSIONS.VIEW_REPORTS])) {
    return <AccessDenied message="هذه الصفحة مخصصة لمسؤولات الإدارة والحسابات لمراجعة تقارير وأرباح مبيعات الكاشير." />
  }

  const { totalSales, totalCost, netProfit, salesByMethod, chartData } = await getPOSReports()

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-card p-6 rounded-3xl border border-border shadow-sm">
          <h3 className="text-lg font-bold text-foreground/70 mb-2 flex items-center gap-2">
            <TrendingUp size={24} className="text-green-500" /> إجمالي مبيعات (الإيرادات)
          </h3>
          <p className="text-4xl font-black text-green-600">
            {totalSales.toLocaleString()} <span className="text-lg font-bold text-green-600/50">ج.م</span>
          </p>
        </div>

        <div className="bg-card p-6 rounded-3xl border border-border shadow-sm">
          <h3 className="text-lg font-bold text-foreground/70 mb-2 flex items-center gap-2">
            <TrendingDown size={24} className="text-red-500" /> تكلفة البضاعة المباعة (COGS)
          </h3>
          <p className="text-4xl font-black text-red-600">
            {totalCost.toLocaleString()} <span className="text-lg font-bold text-red-600/50">ج.م</span>
          </p>
        </div>

        <div className="bg-card p-6 rounded-3xl border border-border shadow-sm relative overflow-hidden">
          <div className={`absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl -mr-10 -mt-10 opacity-20 ${netProfit >= 0 ? 'bg-primary' : 'bg-red-500'}`}></div>
          <div className="relative z-10">
            <h3 className="text-lg font-bold text-foreground/70 mb-2 flex items-center gap-2">
              <DollarSign size={24} className={netProfit >= 0 ? "text-primary" : "text-red-500"} /> صافي أرباح الكاشير
            </h3>
            <p className={`text-4xl font-black ${netProfit >= 0 ? "text-primary" : "text-red-600"}`}>
              {netProfit.toLocaleString()} <span className="text-lg font-bold text-foreground/50">ج.م</span>
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-card p-6 rounded-3xl border border-border shadow-sm">
          <h3 className="text-xl font-black text-foreground mb-6">المبيعات والأرباح (آخر 7 أيام)</h3>
          <OverviewChart data={chartData.reverse()} />
        </div>

        <div className="space-y-6">
          <div className="bg-card p-6 rounded-3xl border border-border shadow-sm">
            <h3 className="text-xl font-black text-foreground mb-6">المبيعات حسب طريقة الدفع</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-background border border-border rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-500/10 text-green-500 rounded-lg"><Banknote size={20}/></div>
                  <span className="font-bold">نقدي (كاش)</span>
                </div>
                <span className="font-black">{salesByMethod.CASH} ج.م</span>
              </div>
              <div className="flex items-center justify-between p-4 bg-background border border-border rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-500/10 text-blue-500 rounded-lg"><CreditCard size={20}/></div>
                  <span className="font-bold">بطاقة ائتمان</span>
                </div>
                <span className="font-black">{salesByMethod.CARD} ج.م</span>
              </div>
              <div className="flex items-center justify-between p-4 bg-background border border-border rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-500/10 text-purple-500 rounded-lg"><Wallet size={20}/></div>
                  <span className="font-bold">محفظة إلكترونية</span>
                </div>
                <span className="font-black">{salesByMethod.WALLET} ج.م</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4">
            <Link href="/dashboard/pos/reports/sales" className="bg-primary text-primary-foreground p-6 rounded-3xl shadow-sm hover:bg-primary/90 transition-all flex items-center justify-between group">
              <div>
                <h3 className="text-xl font-black mb-1">سجل المبيعات</h3>
                <p className="text-primary-foreground/70 text-sm font-medium">عرض كل الفواتير والتفاصيل</p>
              </div>
              <Receipt size={32} className="opacity-50 group-hover:opacity-100 group-hover:scale-110 transition-all" />
            </Link>
            
            <Link href="/dashboard/pos/reports/purchases" className="bg-card text-foreground p-6 rounded-3xl border border-border shadow-sm hover:border-primary transition-all flex items-center justify-between group">
              <div>
                <h3 className="text-xl font-black mb-1">سجل المشتريات والمصروفات</h3>
                <p className="text-foreground/50 text-sm font-medium">عرض كل حركات تزويد المخزون والتكاليف</p>
              </div>
              <Package size={32} className="text-primary opacity-50 group-hover:opacity-100 group-hover:scale-110 transition-all" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
