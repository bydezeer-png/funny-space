"use client"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Building2, Users, ShieldAlert, BarChart3 } from "lucide-react"

export function SettingsTabs() {
  const pathname = usePathname()
  
  const tabs = [
    { name: "معلومات المكان", href: "/dashboard/settings", icon: <Building2 size={18} />, exact: true },
    { name: "إدارة الموظفين", href: "/dashboard/settings/users", icon: <Users size={18} />, exact: true },
    { name: "سجل الحركات", href: "/dashboard/settings/users/logs", icon: <ShieldAlert size={18} />, exact: false },
    { name: "الإحصائيات", href: "/dashboard/settings/users/analytics", icon: <BarChart3 size={18} />, exact: false },
  ]

  return (
    <div className="bg-secondary border border-border/50 p-1.5 rounded-2xl flex w-full max-w-max overflow-x-auto gap-2 shadow-inner">
      {tabs.map(t => {
        let isMatch = false
        if (t.exact) {
          isMatch = pathname === t.href
        } else {
           isMatch = pathname.startsWith(t.href)
        }

        return (
          <Link 
            key={t.href} 
            href={t.href}
            className={`shrink-0 px-5 py-2.5 rounded-xl font-black text-sm transition-all flex items-center gap-2 ${
              isMatch 
                ? 'bg-card text-primary shadow-sm border border-border/40' 
                : 'text-foreground/50 hover:text-foreground border border-transparent hover:bg-secondary/50'
            }`}
          >
            {t.icon}
            {t.name}
          </Link>
        )
      })}
    </div>
  )
}
