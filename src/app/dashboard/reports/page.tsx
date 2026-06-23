import { getGlobalAnalytics } from "@/actions/analytics"
import DateRangeFilter from "@/components/DateRangeFilter"

export default async function ReportsOverviewPage({
  searchParams
}: {
  searchParams: Promise<{ from?: string, to?: string }>
}) {
  const params = await searchParams
  const from = params.from ? new Date(params.from) : undefined
  const to = params.to ? new Date(params.to) : undefined

  // Adjust `to` date to include the entire day
  if (to) {
    to.setHours(23, 59, 59, 999)
  }

  const data = await getGlobalAnalytics(from, to)

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-card p-4 rounded-3xl border border-border">
        <h2 className="font-bold text-lg">النظرة العامة (دفتر الأستاذ)</h2>
        <DateRangeFilter />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-card border border-border p-6 rounded-3xl">
          <p className="text-foreground/50 text-sm font-bold mb-2">إجمالي الإيرادات</p>
          <p className="text-4xl font-black text-green-500">{data.revenue.toLocaleString()} <span className="text-sm">ج.م</span></p>
        </div>
        <div className="bg-card border border-border p-6 rounded-3xl">
          <p className="text-foreground/50 text-sm font-bold mb-2">إجمالي المصروفات</p>
          <p className="text-4xl font-black text-red-500">{data.expense.toLocaleString()} <span className="text-sm">ج.م</span></p>
        </div>
        <div className="bg-gradient-to-tr from-primary to-secondary p-6 rounded-3xl text-primary-foreground shadow-xl">
          <p className="text-primary-foreground/80 text-sm font-bold mb-2">صافي الربح</p>
          <p className="text-4xl font-black">{data.netProfit.toLocaleString()} <span className="text-sm">ج.م</span></p>
        </div>
      </div>

      {/* Transactions List Preview */}
      <div className="bg-card border border-border rounded-3xl p-6">
        <h3 className="font-bold text-lg mb-4">أحدث الحركات المالية في هذه الفترة</h3>
        {data.transactions.length === 0 ? (
          <p className="text-center text-foreground/50 py-10">لا توجد حركات مالية في هذه الفترة.</p>
        ) : (
          <div className="space-y-3">
            {data.transactions.slice(-10).reverse().map((t, idx) => (
              <div key={idx} className="flex justify-between items-center p-4 bg-background rounded-2xl border border-border/50">
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${t.type === 'REVENUE' ? 'bg-green-500' : 'bg-red-500'}`}></div>
                  <span className="font-bold text-sm">
                    {t.type === 'REVENUE' ? 'إيراد' : 'مصروف'}
                  </span>
                </div>
                <div className="text-left font-mono">
                  <span className={`font-bold ${t.type === 'REVENUE' ? 'text-green-500' : 'text-red-500'}`}>
                    {t.type === 'REVENUE' ? '+' : '-'}{t.amount} ج.م
                  </span>
                  <div className="text-xs text-foreground/40">{t.createdAt.toLocaleDateString('ar-EG')}</div>
                </div>
              </div>
            ))}
            <div className="text-center pt-4">
              <a href="/dashboard/accounting" className="text-primary text-sm font-bold hover:underline">عرض دفتر الأستاذ كاملاً &rarr;</a>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
