import { getEnrollments } from "@/actions/enrollments"
import ReceptionManager from "./ReceptionManager"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { checkUserPermission, PERMISSIONS } from "@/lib/permissions"
import AccessDenied from "@/components/AccessDenied"

export default async function ReceptionPage() {
  const session = await auth()
  const currentUser = await prisma.user.findUnique({
    where: { id: session?.user?.id }
  })

  if (!checkUserPermission(currentUser, [
    PERMISSIONS.BOOK_ENROLLMENT, 
    PERMISSIONS.CONFIRM_ENROLLMENT, 
    PERMISSIONS.CANCEL_ENROLLMENT, 
    PERMISSIONS.RECORD_ATTENDANCE
  ])) {
    return <AccessDenied message="هذه الصفحة مخصصة لموظفات الاستقبال اللواتي يملكن صلاحيات التسجيل أو الحضور أو الحجوزات المباشرة." />
  }

  const enrollments = await getEnrollments()
  
  const canBook = checkUserPermission(currentUser, PERMISSIONS.BOOK_ENROLLMENT)
  const canConfirm = checkUserPermission(currentUser, PERMISSIONS.CONFIRM_ENROLLMENT)
  const canCancel = checkUserPermission(currentUser, PERMISSIONS.CANCEL_ENROLLMENT)
  const canRecordAttendance = checkUserPermission(currentUser, PERMISSIONS.RECORD_ATTENDANCE)

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-black text-foreground mb-2 tracking-tight">الاستقبال وإدارة الحجوزات</h2>
          <p className="text-foreground/70 font-medium">مراجعة حجوزات العملاء، تأكيد الدفع، وتسجيل الحضور.</p>
        </div>
      </div>
      
      <ReceptionManager 
        initialEnrollments={enrollments} 
        canBook={canBook}
        canConfirm={canConfirm}
        canCancel={canCancel}
        canRecordAttendance={canRecordAttendance}
      />
    </div>
  )
}
