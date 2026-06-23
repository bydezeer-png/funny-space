import { getTestimonials } from "@/actions/testimonials"
import TestimonialsManager from "./TestimonialsManager"
import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { checkUserPermission, PERMISSIONS } from "@/lib/permissions"
import AccessDenied from "@/components/AccessDenied"

export default async function TestimonialsPage() {
  const session = await auth()
  if (!session) {
    redirect("/login")
  }

  const currentUser = await prisma.user.findUnique({
    where: { id: session.user?.id }
  })

  if (!checkUserPermission(currentUser, [PERMISSIONS.EDIT_CLIENT, PERMISSIONS.MANAGE_USERS])) {
    return <AccessDenied message="هذه الصفحة مخصصة لمديرات النادي والموظفات المسؤولات عن إدارة آراء العميلات." />
  }

  const testimonials = await getTestimonials()

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-black text-foreground mb-2 tracking-tight">إدارة آراء وتقييمات العميلات</h2>
          <p className="text-foreground/70 font-medium">إضافة وتعديل وحذف آراء العميلات التي تظهر في الصفحة الرئيسية للموقع.</p>
        </div>
      </div>
      
      <TestimonialsManager initialTestimonials={testimonials} />
    </div>
  )
}
