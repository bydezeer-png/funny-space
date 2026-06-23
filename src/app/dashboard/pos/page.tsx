import { getInventoryItems, getClientsForPOS, getCurrentShift } from "@/actions/pos"
import SellPOS from "./SellPOS"
import Link from "next/link"
import { AlertCircle } from "lucide-react"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { checkUserPermission, PERMISSIONS } from "@/lib/permissions"
import AccessDenied from "@/components/AccessDenied"

export default async function POSPage() {
  const session = await auth()
  const currentUser = await prisma.user.findUnique({
    where: { id: session?.user?.id }
  })

  if (!checkUserPermission(currentUser, PERMISSIONS.SELL_POS)) {
    return <AccessDenied message="هذه الصفحة مخصصة لمسؤولات الكاشير والبيع المباشر لخدمات ومنتجات النادي." />
  }

  const items = await getInventoryItems()
  const clients = await getClientsForPOS()
  const shift = await getCurrentShift()
  
  if (!shift) {
    return (
      <div className="bg-card p-12 rounded-3xl border border-border shadow-sm flex flex-col items-center justify-center text-center animate-in fade-in slide-in-from-bottom-4">
        <div className="w-24 h-24 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mb-6">
          <AlertCircle size={48} />
        </div>
        <h2 className="text-3xl font-black text-foreground mb-4">لا توجد وردية مفتوحة!</h2>
        <p className="text-foreground/70 font-medium mb-8 max-w-md">
          للبدء في البيع وإصدار الفواتير، يجب عليك فتح وردية الكاشير أولاً لتسجيل الدرج.
        </p>
        <Link 
          href="/dashboard/pos/shift" 
          className="bg-primary text-primary-foreground px-8 py-4 rounded-xl font-bold hover:bg-primary/90 transition-colors shadow-lg"
        >
          الذهاب لفتح وردية جديدة
        </Link>
      </div>
    )
  }

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
      <SellPOS items={items} clients={clients} />
    </div>
  )
}
