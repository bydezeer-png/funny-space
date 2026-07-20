import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { checkUserPermission, PERMISSIONS } from "@/lib/permissions"
import AccessDenied from "@/components/AccessDenied"
import ClassesManager from "./ClassesManager"

export default async function ClassesPage() {
  const session = await auth()
  const currentUser = await prisma.user.findUnique({
    where: { id: session?.user?.id }
  })

  if (!checkUserPermission(currentUser, [PERMISSIONS.BOOK_ENROLLMENT, PERMISSIONS.RECORD_ATTENDANCE])) {
     return <AccessDenied message="هذه الصفحة مخصصة للموظفات اللواتي يملكن صلاحيات التسجيل أو عرض المشتركين." />
  }

  // Fetch programs, options, workshops, events, and enrollments
  const [programs, workshops, events, enrollments] = await Promise.all([
    prisma.program.findMany({
      include: {
        category: true,
        options: {
          include: {
            schedules: true
          }
        }
      },
      orderBy: { name: 'asc' }
    }),
    prisma.workshop.findMany({
      orderBy: { startDate: 'asc' }
    }),
    prisma.event.findMany({
      orderBy: { date: 'asc' }
    }),
    prisma.enrollment.findMany({
      where: {
        status: { in: ["PENDING", "CONFIRMED"] }
      },
      include: {
        client: true,
        program: true,
        option: true,
        workshop: true,
        event: true,
        attendances: true
      },
      orderBy: { createdAt: 'desc' }
    })
  ])

  const canBook = checkUserPermission(currentUser, PERMISSIONS.BOOK_ENROLLMENT)
  const canRecordAttendance = checkUserPermission(currentUser, PERMISSIONS.RECORD_ATTENDANCE)

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-black text-foreground mb-2 tracking-tight">إدارة الكلاسات والاشتراكات</h2>
          <p className="text-foreground/70 font-medium">متابعة المشتركات في كل كلاس، ورشة، أو حفلة، وتسجيل حضور الفتيات وإضافة حجوزات جديدة.</p>
        </div>
      </div>

      <ClassesManager
        initialPrograms={programs}
        initialWorkshops={workshops}
        initialEvents={events}
        initialEnrollments={enrollments}
        canBook={canBook}
        canRecordAttendance={canRecordAttendance}
      />
    </div>
  )
}
