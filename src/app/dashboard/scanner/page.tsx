import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { checkUserPermission, PERMISSIONS } from "@/lib/permissions"
import AccessDenied from "@/components/AccessDenied"
import ScannerClient from "./ScannerClient"

export const metadata = {
  title: 'ماسح الدخول (QR) | Soly\'s Space',
}

export default async function ScannerPage() {
  const session = await auth()
  const currentUser = await prisma.user.findUnique({
    where: { id: session?.user?.id }
  })

  if (!checkUserPermission(currentUser, PERMISSIONS.RECORD_ATTENDANCE)) {
    return <AccessDenied message="هذه الصفحة مخصصة للموظفات اللواتي يملكن صلاحية تسجيل حضور العملاء (مسح الدخول)." />
  }

  return (
    <ScannerClient />
  )
}
