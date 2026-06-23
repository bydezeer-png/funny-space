import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { checkUserPermission, PERMISSIONS } from "@/lib/permissions"
import POSTabs from "./POSTabs"
import { ShoppingCart } from "lucide-react"

export default async function POSLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  const currentUser = await prisma.user.findUnique({
    where: { id: session?.user?.id }
  })

  // Determine which tabs are allowed based on permissions
  const allowedTabs = [];
  
  if (checkUserPermission(currentUser, PERMISSIONS.SELL_POS)) {
    allowedTabs.push({ href: "/dashboard/pos", label: "بيع (كاشير)", icon: "ShoppingCart" });
  }
  
  if (checkUserPermission(currentUser, PERMISSIONS.MANAGE_INVENTORY)) {
    allowedTabs.push({ href: "/dashboard/pos/buy", label: "شراء بضاعة (Restock)", icon: "PackagePlus" });
    allowedTabs.push({ href: "/dashboard/pos/inventory", label: "إدارة المخزون والمنتجات", icon: "Box" });
  }
  
  if (checkUserPermission(currentUser, [PERMISSIONS.RETURN_ORDER, PERMISSIONS.VIEW_REPORTS])) {
    allowedTabs.push({ href: "/dashboard/pos/reports", label: "التقارير والأرباح", icon: "LineChart" });
  }
  
  if (checkUserPermission(currentUser, PERMISSIONS.OPEN_CLOSE_SHIFT)) {
    allowedTabs.push({ href: "/dashboard/pos/shift", label: "الوردية (Shift)", icon: "Clock" });
  }

  return (
    <div className="space-y-6 text-right">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-card p-8 rounded-3xl shadow-sm border border-border gap-4">
        <div className="flex items-center gap-4">
          <div className="p-4 bg-primary/10 rounded-2xl text-primary">
            <ShoppingCart size={32} />
          </div>
          <div>
            <h2 className="text-3xl font-black text-foreground">الكاشير والمبيعات (POS)</h2>
            <p className="text-foreground/70 font-medium">إدارة نقاط البيع، المخزون، والأرباح.</p>
          </div>
        </div>
      </div>

      <POSTabs tabs={allowedTabs} />

      <div className="pt-4">
        {children}
      </div>
    </div>
  )
}
