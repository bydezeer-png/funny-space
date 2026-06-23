import { getWorkshopsAnalytics } from "@/actions/analytics"
import DateRangeFilter from "@/components/DateRangeFilter"
import { Wrench } from "lucide-react"

export default async function WorkshopsReportPage({
  searchParams
}: {
  searchParams: Promise<{ from?: string, to?: string }>
}) {
  const params = await searchParams
  const from = params.from ? new Date(params.from) : undefined
  const to = params.to ? new Date(params.to) : undefined

  if (to) to.setHours(23, 59, 59, 999)

  const data = await getWorkshopsAnalytics(from, to)

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-card p-4 rounded-3xl border border-border">
        <h2 className="font-bold text-lg">تقارير ورش العمل</h2>
        <DateRangeFilter />
      </div>

      <div className="bg-card border border-border p-6 rounded-3xl">
        <p className="text-foreground/50 text-sm font-bold mb-2">إجمالي إيرادات الورش</p>
        <p className="text-4xl font-black text-primary">{data.totalRevenue.toLocaleString()} <span className="text-sm">ج.م</span></p>
      </div>

      <div className="bg-card border border-border rounded-3xl p-6">
        <h3 className="font-bold text-lg mb-4">أداء الورش</h3>
        {data.workshops.length === 0 ? (
          <p className="text-center text-foreground/50 py-10">لا توجد ورش مسجلة.</p>
        ) : (
          <div className="space-y-4">
            {data.workshops.map((w, idx) => (
              <div key={w.id} className="flex justify-between items-center p-4 bg-background rounded-2xl border border-border/50">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-primary/10 text-primary rounded-xl flex items-center justify-center">
                    <Wrench size={20} />
                  </div>
                  <div>
                    <h4 className="font-bold text-foreground">{w.name}</h4>
                    <p className="text-xs text-foreground/50">{w.enrollmentsCount} اشتراك مؤكد</p>
                  </div>
                </div>
                <div className="text-left">
                  <p className="font-black text-lg text-green-500">{w.revenue.toLocaleString()} ج.م</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
