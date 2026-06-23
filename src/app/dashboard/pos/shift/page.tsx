import { getCurrentShift } from "@/actions/pos"
import ShiftManager from "./ShiftManager"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { checkUserPermission, PERMISSIONS } from "@/lib/permissions"
import AccessDenied from "@/components/AccessDenied"

export const dynamic = "force-dynamic"

export default async function ShiftPage() {
  const session = await auth()
  const currentUser = await prisma.user.findUnique({
    where: { id: session?.user?.id }
  })

  if (!checkUserPermission(currentUser, PERMISSIONS.OPEN_CLOSE_SHIFT)) {
    return <AccessDenied message="هذه الصفحة مخصصة للمشرفات المخولات بفتح وإغلاق ورديات الكاشير وتسجيل عُهدة الخزينة." />
  }

  const currentShift = await getCurrentShift()
  
  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
      <ShiftManager initialShift={currentShift} />
    </div>
  )
}
