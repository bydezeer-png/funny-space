import { getPrograms, getProgramCategories } from "@/actions/programs"
import ProgramsManager from "./ProgramsManager"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { checkUserPermission, PERMISSIONS } from "@/lib/permissions"
import AccessDenied from "@/components/AccessDenied"

export default async function ProgramsPage() {
  const session = await auth()
  const currentUser = await prisma.user.findUnique({
    where: { id: session?.user?.id }
  })

  if (!checkUserPermission(currentUser, PERMISSIONS.MANAGE_PROGRAMS)) {
    return <AccessDenied message="هذه الصفحة مخصصة لمديرات النادي اللواتي يملكن صلاحية إدارة البرامج الرياضية والفنية." />
  }

  const programs = await getPrograms()
  const categories = await getProgramCategories()
  
  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-black text-foreground mb-2 tracking-tight">إدارة البرامج الفنية والرياضية</h2>
          <p className="text-foreground/70 font-medium">يمكنك هنا تنظيم البرامج، إضافة الفئات، وتحديد المواعيد الأسبوعية لكل مستوى.</p>
        </div>
      </div>
      
      <ProgramsManager initialPrograms={programs} initialCategories={categories} />
    </div>
  )
}
