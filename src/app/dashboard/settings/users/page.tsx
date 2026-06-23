import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import UsersManager from "./UsersManager"

export const metadata = {
  title: 'إدارة الموظفين | Soly\'s Space',
}

export default async function UsersPage() {
  const session = await auth()
  
  if (!session?.user) {
    redirect("/login")
  }

  // Security check: Only Admins can view this page
  const currentUser = await prisma.user.findUnique({
    where: { id: session.user.id }
  })
  
  if (currentUser?.role !== "ADMIN") {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center">
        <div className="w-24 h-24 bg-red-100 text-red-500 rounded-full flex items-center justify-center mb-6 shadow-sm">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h2 className="text-3xl font-black text-foreground mb-4">غير مصرح لك بالدخول</h2>
        <p className="text-foreground/60 text-lg">هذه الصفحة مخصصة لمديري النظام فقط (ADMIN).</p>
      </div>
    )
  }

  const users = await prisma.user.findMany({
    orderBy: { createdAt: 'desc' }
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary mb-2">
          إدارة الموظفين والصلاحيات
        </h1>
        <p className="text-foreground/60 font-medium">
          أضف موظفين جدد، عين صلاحياتهم، وتحكم في إمكانية دخولهم للنظام.
        </p>
      </div>

      <UsersManager initialUsers={users} currentUserId={session.user.id!} />
    </div>
  )
}
