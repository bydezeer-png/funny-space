import { getClientById } from "@/actions/client"
import ClientProfileManager from "./ClientProfileManager"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { checkUserPermission, PERMISSIONS } from "@/lib/permissions"
import AccessDenied from "@/components/AccessDenied"

export default async function ClientDetailsPage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params
  const session = await auth()
  const currentUser = await prisma.user.findUnique({
    where: { id: session?.user?.id }
  })

  if (!checkUserPermission(currentUser, [PERMISSIONS.EDIT_CLIENT, PERMISSIONS.DELETE_CLIENT])) {
    return <AccessDenied message="هذه الصفحة مخصصة للموظفات اللواتي يملكن صلاحية تعديل أو عرض تفاصيل ملفات العميلات." />
  }

  const client = await getClientById(params.id)

  if (!client) {
    return (
      <div className="text-center py-20 bg-card border border-border rounded-[2.5rem] shadow-sm">
        <h2 className="text-2xl font-black text-foreground mb-2">العميلة غير موجودة</h2>
        <p className="text-foreground/50 text-sm font-semibold">يبدو أن العميلة التي تبحث عنها تم حذفها أو أن الرابط غير صحيح.</p>
      </div>
    )
  }

  const canEdit = checkUserPermission(currentUser, PERMISSIONS.EDIT_CLIENT)
  const canDelete = checkUserPermission(currentUser, PERMISSIONS.DELETE_CLIENT)

  return (
    <ClientProfileManager client={client} canEdit={canEdit} canDelete={canDelete} />
  )
}
