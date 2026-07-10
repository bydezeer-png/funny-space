import { getPOSReports } from "@/actions/pos"
import { Package, ArrowRight, MinusCircle } from "lucide-react"
import Link from "next/link"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { checkUserPermission, PERMISSIONS } from "@/lib/permissions"
import AccessDenied from "@/components/AccessDenied"

export const dynamic = "force-dynamic"

export default async function PurchasesLogPage() {
  const session = await auth()
  const currentUser = await prisma.user.findUnique({
    where: { id: session?.user?.id }
  })

  if (!checkUserPermission(currentUser, [PERMISSIONS.RETURN_ORDER, PERMISSIONS.VIEW_REPORTS])) {
    return <AccessDenied message="هذه الصفحة مخصصة لمسؤولات الإدارة والحسابات فقط لمراجعة فواتير وتكاليف المشتريات." />
  }

  const { purchases } = await getPOSReports()

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      <div className="flex items-center gap-4 mb-2">
        <Link href="/dashboard/pos/reports" className="p-2 bg-card border border-border rounded-xl hover:bg-background transition-colors text-foreground">
          <ArrowRight size={20} />
        </Link>
        <h2 className="text-2xl font-black text-foreground">سجل المشتريات والمصروفات</h2>
      </div>

      <div className="bg-card rounded-3xl shadow-sm border border-border overflow-hidden">
        <div className="p-8 border-b border-border/50 bg-background/50">
          <p className="text-foreground/70 font-medium max-w-2xl">
            هذا السجل يعرض جميع الحركات المالية الخاصة بـ (المصروفات) وشراء المخزون التي تم تسجيلها في النظام لتعقب التكاليف التشغيلية بدقة.
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-right border-collapse">
            <thead>
              <tr className="bg-background/50 text-foreground/70 border-b border-border/50">
                <th className="p-6 font-bold text-sm uppercase tracking-wider">التاريخ</th>
                <th className="p-6 font-bold text-sm uppercase tracking-wider">الوصف</th>
                <th className="p-6 font-bold text-sm uppercase tracking-wider">التصنيف</th>
                <th className="p-6 font-bold text-sm uppercase tracking-wider">المبلغ (التكلفة)</th>
              </tr>
            </thead>
            <tbody>
              {purchases.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-12 text-center text-foreground/50 font-bold">
                    لا توجد عمليات شراء بضاعة أو مصروفات مسجلة.
                  </td>
                </tr>
              ) : (
                purchases.map(purchase => (
                  <tr key={purchase.id} className="border-b border-border/30 hover:bg-card/5 transition-colors">
                    <td className="p-6 text-foreground/80 font-medium" dir="ltr">{new Date(purchase.createdAt).toLocaleString('ar-EG')}</td>
                    <td className="p-6 font-bold text-foreground">{purchase.description}</td>
                    <td className="p-6">
                      <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-500/10 text-red-500 text-xs font-bold rounded-lg">
                        <MinusCircle size={12}/> مصروفات
                      </span>
                    </td>
                    <td className="p-6 text-red-500 font-black">{purchase.amount} ج.م</td>
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
