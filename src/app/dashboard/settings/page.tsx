import { getSystemSettings } from "@/actions/settings"
import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import SettingsForm from "./SettingsForm"

export const metadata = {
  title: 'إعدادات المكان | Soly\'s Space',
}

export default async function SettingsPage() {
  const session = await auth()
  if (!session?.user) redirect("/login")
  
  const currentUser = await prisma.user.findUnique({
    where: { id: session.user.id }
  })
  
  if (currentUser?.role !== "ADMIN") {
    redirect("/dashboard")
  }

  const settings = await getSystemSettings()

  return (
    <div className="bg-card border border-border/50 rounded-[2rem] p-6 sm:p-8 shadow-sm max-w-4xl">
      <div className="mb-8">
        <h2 className="text-2xl font-black text-foreground mb-2">معلومات المكان والتواصل</h2>
        <p className="text-foreground/60 font-semibold">تُستخدم هذه المعلومات لعرضها للعملاء في واجهة الحجز وتفاصيل الدفع.</p>
      </div>
      
      <SettingsForm initialSettings={settings} />
    </div>
  )
}
