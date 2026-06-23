import { getClients } from "@/actions/client"
import Link from "next/link"
import { Users, Plus } from "lucide-react"
import ClientList from "./ClientList"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { checkUserPermission, PERMISSIONS } from "@/lib/permissions"
import AccessDenied from "@/components/AccessDenied"

export default async function ClientsPage() {
  const session = await auth()
  const currentUser = await prisma.user.findUnique({
    where: { id: session?.user?.id }
  })

  if (!checkUserPermission(currentUser, [PERMISSIONS.ADD_CLIENT, PERMISSIONS.EDIT_CLIENT, PERMISSIONS.DELETE_CLIENT])) {
    return <AccessDenied message="هذه الصفحة مخصصة للموظفات اللواتي يملكن صلاحية إدارة بيانات وعلاقات العميلات (CRM)." />
  }

  const clients = await getClients()
  const canAdd = checkUserPermission(currentUser, PERMISSIONS.ADD_CLIENT)

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-card p-8 rounded-[2rem] shadow-sm border border-border gap-4">
        <div className="flex items-center gap-4">
          <div className="p-4 bg-primary/10 rounded-2xl text-primary">
            <Users size={32} />
          </div>
          <div>
            <h2 className="text-3xl font-black text-foreground">العميلات (CRM)</h2>
            <p className="text-foreground/70 font-medium mt-1">إدارة بيانات المشتركات وباقاتهم بكل سهولة.</p>
          </div>
        </div>
        {canAdd && (
          <Link 
            href="/dashboard/clients/new" 
            className="flex items-center gap-2 bg-gradient-to-r from-primary to-secondary text-white px-6 py-4 rounded-xl font-bold shadow-xl shadow-primary/20 hover:scale-105 transition-all"
          >
            <Plus size={20} />
            <span>إضافة عميلة جديدة</span>
          </Link>
        )}
      </div>

      <ClientList initialClients={clients} />
    </div>
  )
}
