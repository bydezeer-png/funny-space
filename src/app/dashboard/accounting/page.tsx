import { getAccountingSummary } from "@/actions/accounting"
import { DollarSign, TrendingUp, TrendingDown, Plus, Receipt } from "lucide-react"
import Link from "next/link"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { checkUserPermission, PERMISSIONS } from "@/lib/permissions"
import AccessDenied from "@/components/AccessDenied"
import ExportButton from "@/components/ExportButton"
import PrintButton from "@/components/PrintButton"

export default async function AccountingPage() {
  const session = await auth()
  const currentUser = await prisma.user.findUnique({
    where: { id: session?.user?.id }
  })

  if (!checkUserPermission(currentUser, [PERMISSIONS.VIEW_REPORTS, PERMISSIONS.ADD_EXPENSE])) {
    return <AccessDenied message="هذه الصفحة مخصصة للمحاسبات والإدارة فقط لمراجعة البيانات المالية وتسجيل المصاريف." />
  }

  const { transactions, totalRevenue, totalExpenses, netIncome } = await getAccountingSummary()

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-card p-8 rounded-3xl shadow-sm border border-border gap-4 print:hidden">
        <div className="flex items-center gap-4">
          <div className="p-4 bg-primary/10 rounded-2xl text-primary">
            <DollarSign size={32} />
          </div>
          <div>
            <h2 className="text-3xl font-black text-foreground">الحسابات والماليات</h2>
            <p className="text-foreground/70 font-medium">متابعة الإيرادات والمصروفات وصافي الأرباح بدقة.</p>
          </div>
        </div>
        <Link 
          href="/dashboard/accounting/new" 
          className="flex items-center gap-2 bg-red-600 text-white px-6 py-3 rounded-xl font-bold shadow-sm hover:bg-red-700 transition-all"
        >
          <Plus size={20} />
          <span>تسجيل مصروفات</span>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="bg-card p-6 rounded-3xl border border-border hover:border-green-500/50 transition-all shadow-sm">
          <h3 className="text-lg font-bold text-foreground/70 mb-2 flex items-center gap-2">
            <TrendingUp size={24} className="text-green-500" /> إجمالي الإيرادات
          </h3>
          <p className="text-4xl font-black text-green-600">
            {totalRevenue.toLocaleString()} <span className="text-lg font-bold text-green-600/50">ج.م</span>
          </p>
        </div>

        <div className="bg-card p-6 rounded-3xl border border-border hover:border-red-500/50 transition-all shadow-sm">
          <h3 className="text-lg font-bold text-foreground/70 mb-2 flex items-center gap-2">
            <TrendingDown size={24} className="text-red-500" /> إجمالي المصروفات
          </h3>
          <p className="text-4xl font-black text-red-600">
            {totalExpenses.toLocaleString()} <span className="text-lg font-bold text-red-600/50">ج.م</span>
          </p>
        </div>

        <div className="bg-card p-6 rounded-3xl border border-border hover:border-primary/50 transition-all shadow-sm">
          <h3 className="text-lg font-bold text-foreground/70 mb-2 flex items-center gap-2">
            <Receipt size={24} className={netIncome >= 0 ? "text-primary" : "text-red-500"} /> صافي الربح
          </h3>
          <p className={`text-4xl font-black ${netIncome >= 0 ? "text-primary" : "text-red-600"}`}>
            {netIncome.toLocaleString()} <span className="text-lg font-bold text-foreground/50">ج.م</span>
          </p>
        </div>
      </div>

      <div className="bg-card rounded-3xl shadow-sm border border-border overflow-hidden print:border-none print:shadow-none">
        <div className="p-8 border-b border-border/50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 print:hidden">
          <h3 className="text-xl font-black text-foreground">أحدث المعاملات</h3>
          <div className="flex gap-2">
            <PrintButton />
            <ExportButton
              data={transactions}
              filename="التقرير_المالي_المعاملات"
              headers={[
                { key: "createdAt", label: "التاريخ" },
                { key: "type", label: "النوع" },
                { key: "amount", label: "المبلغ (ج.م)" },
                { key: "description", label: "البيان / الوصف" }
              ]}
              buttonText="تصدير المعاملات"
            />
          </div>
        </div>
        <div className="p-8 border-b border-border/50 hidden print:block text-right">
          <h3 className="text-2xl font-black text-foreground">تقرير المعاملات المالية الرسمي - Soly's Space</h3>
          <p className="text-xs text-foreground/50 mt-1">تاريخ استخراج التقرير: {new Date().toLocaleDateString('ar-EG')}</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-right border-collapse">
            <thead>
              <tr className="bg-background/50 text-foreground/70 border-b border-border/50">
                <th className="p-6 font-bold text-sm uppercase tracking-wider">التاريخ</th>
                <th className="p-6 font-bold text-sm uppercase tracking-wider">النوع</th>
                <th className="p-6 font-bold text-sm uppercase tracking-wider">المبلغ (ج.م)</th>
                <th className="p-6 font-bold text-sm uppercase tracking-wider">البيان / الوصف</th>
              </tr>
            </thead>
            <tbody>
              {transactions.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-12 text-center text-foreground/50 font-bold">
                    لا توجد معاملات مسجلة بعد.
                  </td>
                </tr>
              ) : (
                transactions.map(tx => (
                  <tr key={tx.id} className="border-b border-border/30 hover:bg-white/5 transition-colors">
                    <td className="p-6 text-foreground/80 font-medium" dir="ltr">{new Date(tx.createdAt).toLocaleString('ar-EG')}</td>
                    <td className="p-6">
                      {tx.type === "REVENUE" ? (
                        <span className="px-3 py-1 rounded-full bg-green-500/10 text-green-500 text-xs font-black border border-green-500/20">إيرادات</span>
                      ) : (
                        <span className="px-3 py-1 rounded-full bg-red-500/10 text-red-500 text-xs font-black border border-red-500/20">مصروفات</span>
                      )}
                    </td>
                    <td className={`p-6 font-black text-lg ${tx.type === "REVENUE" ? "text-green-500" : "text-red-500"}`}>
                      {tx.type === "REVENUE" ? "+" : "-"}{tx.amount}
                    </td>
                    <td className="p-6 text-foreground/90 font-medium">{tx.description}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
