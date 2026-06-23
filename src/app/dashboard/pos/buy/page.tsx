import { getInventoryItems } from "@/actions/pos"
import BuyStock from "./BuyStock"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { checkUserPermission, PERMISSIONS } from "@/lib/permissions"
import AccessDenied from "@/components/AccessDenied"

export default async function BuyStockPage() {
  const session = await auth()
  const currentUser = await prisma.user.findUnique({
    where: { id: session?.user?.id }
  })

  if (!checkUserPermission(currentUser, PERMISSIONS.MANAGE_INVENTORY)) {
    return <AccessDenied message="هذه الصفحة مخصصة للموظفات المسؤولات عن شراء البضائع وتزويد المستودع (Restock)." />
  }

  const items = await getInventoryItems()
  
  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
      <BuyStock items={items} />
    </div>
  )
}
