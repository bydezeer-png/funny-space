import NewExpenseForm from "./NewExpenseForm"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { checkUserPermission, PERMISSIONS } from "@/lib/permissions"
import AccessDenied from "@/components/AccessDenied"

export default async function NewExpensePage() {
  const session = await auth()
  const currentUser = await prisma.user.findUnique({
    where: { id: session?.user?.id }
  })

  if (!checkUserPermission(currentUser, PERMISSIONS.ADD_EXPENSE)) {
    return <AccessDenied message="هذه الصفحة مخصصة لتسجيل المصروفات الجديدة للموظفات المخولات بذلك." />
  }

  return (
    <NewExpenseForm />
  )
}
