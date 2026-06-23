import { getPOSAnalytics } from "@/actions/analytics"
import DateRangeFilter from "@/components/DateRangeFilter"
import { Package } from "lucide-react"

export default async function POSReportPage({
  searchParams
}: {
  searchParams: Promise<{ from?: string, to?: string }>
}) {
  const params = await searchParams
  const from = params.from ? new Date(params.from) : undefined
  const to = params.to ? new Date(params.to) : undefined

  if (to) to.setHours(23, 59, 59, 999)

  const data = await getPOSAnalytics(from, to)

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-card p-4 rounded-3xl border border-border">
        <h2 className="font-bold text-lg">تقارير مبيعات الكاشير والمخزون</h2>
        <DateRangeFilter />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-card border border-border p-4 rounded-2xl">
          <p className="text-foreground/50 text-xs font-bold mb-1">إجمالي المبيعات</p>
          <p className="text-2xl font-black text-green-500">{data.totalSales.toLocaleString()}</p>
        </div>
        <div className="bg-card border border-border p-4 rounded-2xl">
          <p className="text-foreground/50 text-xs font-bold mb-1">تكلفة البضاعة المباعة</p>
          <p className="text-2xl font-black text-red-500">{data.totalCost.toLocaleString()}</p>
        </div>
        <div className="bg-gradient-to-tr from-primary/10 to-primary/5 border border-primary/20 p-4 rounded-2xl">
          <p className="text-primary text-xs font-bold mb-1">صافي ربح المبيعات</p>
          <p className="text-2xl font-black text-primary">{data.netSales.toLocaleString()}</p>
        </div>
        <div className="bg-card border border-border p-4 rounded-2xl">
          <p className="text-foreground/50 text-xs font-bold mb-1">المرتجعات (Returns)</p>
          <p className="text-2xl font-black text-red-500">{data.totalReturns.toLocaleString()}</p>
        </div>
        <div className="bg-card border border-border p-4 rounded-2xl">
          <p className="text-foreground/50 text-xs font-bold mb-1">مصروفات الورديات</p>
          <p className="text-2xl font-black text-red-500">{data.totalExpenses.toLocaleString()}</p>
        </div>
      </div>

      <div className="bg-card border border-border rounded-3xl p-6">
        <h3 className="font-bold text-lg mb-4">المنتجات الأكثر مبيعاً (Top Sellers)</h3>
        {data.bestSellers.length === 0 ? (
          <p className="text-center text-foreground/50 py-10">لا توجد مبيعات في هذه الفترة.</p>
        ) : (
          <div className="space-y-3">
            {data.bestSellers.map((item, idx) => (
              <div key={idx} className="flex justify-between items-center p-3 bg-background rounded-2xl border border-border/50">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-green-500/10 text-green-500 rounded-lg flex items-center justify-center">
                    <Package size={16} />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-foreground">{item.name}</h4>
                    <p className="text-xs text-foreground/50">تم بيع {item.quantity} وحدة</p>
                  </div>
                </div>
                <div className="text-left">
                  <p className="font-bold text-sm text-green-500">{item.revenue.toLocaleString()} ج.م</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
