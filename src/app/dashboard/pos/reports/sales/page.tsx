import { getPOSReports } from "@/actions/pos"
import { Receipt, ArrowRight, Wallet, CreditCard, Banknote } from "lucide-react"
import Link from "next/link"
import ReturnButton from "./ReturnButton"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { checkUserPermission, PERMISSIONS } from "@/lib/permissions"
import AccessDenied from "@/components/AccessDenied"

export const dynamic = "force-dynamic"

export default async function SalesLogPage() {
  const session = await auth()
  const currentUser = await prisma.user.findUnique({
    where: { id: session?.user?.id }
  })

  if (!checkUserPermission(currentUser, [PERMISSIONS.RETURN_ORDER, PERMISSIONS.VIEW_REPORTS])) {
    return <AccessDenied message="هذه الصفحة مخصصة للمسؤولات الحسابية فقط لعرض وتفصيل فواتير المبيعات للكاشير." />
  }

  const { orders } = await getPOSReports()

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      <div className="flex items-center gap-4 mb-2">
        <Link href="/dashboard/pos/reports" className="p-2 bg-card border border-border rounded-xl hover:bg-background transition-colors text-foreground">
          <ArrowRight size={20} />
        </Link>
        <h2 className="text-2xl font-black text-foreground">سجل المبيعات التفصيلي</h2>
      </div>

      <div className="bg-card rounded-3xl shadow-sm border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right border-collapse">
            <thead>
              <tr className="bg-background/50 text-foreground/70 border-b border-border/50">
                <th className="p-6 font-bold text-sm uppercase tracking-wider">رقم الفاتورة</th>
                <th className="p-6 font-bold text-sm uppercase tracking-wider">التاريخ والوردية</th>
                <th className="p-6 font-bold text-sm uppercase tracking-wider">المنتجات المباعة</th>
                <th className="p-6 font-bold text-sm uppercase tracking-wider">طريقة الدفع</th>
                <th className="p-6 font-bold text-sm uppercase tracking-wider">التكلفة</th>
                <th className="p-6 font-bold text-sm uppercase tracking-wider">الإجمالي (البيع)</th>
                <th className="p-6 font-bold text-sm uppercase tracking-wider">الربح</th>
                <th className="p-6 font-bold text-sm uppercase tracking-wider">إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {orders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-12 text-center text-foreground/50 font-bold">
                    لا توجد عمليات بيع مسجلة بعد.
                  </td>
                </tr>
              ) : (
                orders.map(order => (
                  <tr key={order.id} className="border-b border-border/30 hover:bg-card/5 transition-colors">
                    <td className="p-6 font-black text-foreground/80" dir="ltr">#{order.id.slice(-6).toUpperCase()}</td>
                    <td className="p-6">
                      <div className="font-medium text-foreground">{new Date(order.createdAt).toLocaleString('ar-EG')}</div>
                      {order.shift && <div className="text-xs text-foreground/50 mt-1">وردية: {new Date(order.shift.openedAt).toLocaleDateString('ar-EG')}</div>}
                      {order.client && <div className="text-xs text-primary font-bold mt-1">العميل: {order.client.name}</div>}
                    </td>
                    <td className="p-6">
                      <div className="space-y-1">
                        {order.items.map(item => (
                          <div key={item.id} className="flex items-center gap-2 text-sm">
                            <span className="font-bold text-primary">{item.quantity}x</span>
                            <span className="font-medium text-foreground">{item.inventoryItem?.name || 'منتج محذوف'}</span>
                          </div>
                        ))}
                      </div>
                    </td>
                    <td className="p-6">
                      {order.paymentMethod === 'CASH' && <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-500/10 text-green-500 text-xs font-bold rounded-lg"><Banknote size={12}/> كاش</span>}
                      {order.paymentMethod === 'CARD' && <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-500/10 text-blue-500 text-xs font-bold rounded-lg"><CreditCard size={12}/> فيزا</span>}
                      {order.paymentMethod === 'WALLET' && <span className="inline-flex items-center gap-1 px-2 py-1 bg-purple-500/10 text-purple-500 text-xs font-bold rounded-lg"><Wallet size={12}/> محفظة</span>}
                    </td>
                    <td className="p-6 text-foreground/70 font-medium">{order.reliableCost} ج.م</td>
                    <td className="p-6 text-foreground font-black">
                      {order.totalAmount} ج.م
                      {order.discount > 0 && <div className="text-xs text-foreground/50 line-through mt-1">{order.totalAmount + order.discount} ج.م</div>}
                    </td>
                    <td className={`p-6 font-bold ${order.totalAmount - order.reliableCost >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                      +{order.totalAmount - order.reliableCost} ج.م
                    </td>
                    <td className="p-6">
                      <ReturnButton orderId={order.id} />
                    </td>
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
