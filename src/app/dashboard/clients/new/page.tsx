import { createClient } from "@/actions/client"
import { ArrowRight, Save, User } from "lucide-react"
import Link from "next/link"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { checkUserPermission, PERMISSIONS } from "@/lib/permissions"
import AccessDenied from "@/components/AccessDenied"

export default async function NewClientPage() {
  const session = await auth()
  const currentUser = await prisma.user.findUnique({
    where: { id: session?.user?.id }
  })

  if (!checkUserPermission(currentUser, PERMISSIONS.ADD_CLIENT)) {
    return <AccessDenied message="هذه الصفحة مخصصة للموظفات اللواتي يملكن صلاحية إضافة عميلة جديدة." />
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/clients" className="p-2 hover:bg-secondary rounded-full transition text-foreground">
          <ArrowRight size={24} />
        </Link>
        <h2 className="text-2xl font-bold text-foreground">إضافة عميلة جديدة</h2>
      </div>

      <div className="bg-card p-8 rounded-2xl shadow-sm border border-border">
        <form action={createClient} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-foreground">اسم العميلة *</label>
              <div className="relative">
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-foreground/50">
                  <User size={18} />
                </div>
                <input 
                  type="text" 
                  name="name" 
                  required 
                  className="w-full border border-border bg-background py-3 pl-3 pr-10 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition"
                  placeholder="مثال: منى أحمد"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-semibold text-foreground">رقم الهاتف *</label>
              <input 
                type="tel" 
                name="phone" 
                required 
                dir="ltr"
                className="w-full text-right border border-border bg-background p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition"
                placeholder="010..."
              />
            </div>
            
            <div className="space-y-2 md:col-span-2">
              <label className="block text-sm font-semibold text-foreground">البريد الإلكتروني (اختياري)</label>
              <input 
                type="email" 
                name="email" 
                dir="ltr"
                className="w-full text-right border border-border bg-background p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition"
                placeholder="email@example.com"
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <label className="block text-sm font-semibold text-foreground">ملاحظات (اختياري)</label>
              <textarea 
                name="notes" 
                rows={4}
                className="w-full border border-border bg-background p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition resize-none"
                placeholder="أي ملاحظات صحية أو تفضيلات خاصة بالعميلة..."
              ></textarea>
            </div>
          </div>

          <div className="pt-4 flex justify-end">
            <button 
              type="submit" 
              className="flex items-center gap-2 bg-primary text-primary-foreground px-8 py-3 rounded-xl font-bold shadow-md hover:bg-primary/90 hover:shadow-lg transition-all"
            >
              <Save size={20} />
              <span>حفظ العميلة</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
