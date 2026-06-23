"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

export function SidebarNavLink({ href, children, icon }: { href: string, children: React.ReactNode, icon: React.ReactNode }) {
  const pathname = usePathname()
  const isActive = pathname === href

  return (
    <Link 
      href={href} 
      className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-semibold group ${
        isActive 
          ? "bg-primary/10 text-primary shadow-sm ring-1 ring-primary/20" 
          : "text-foreground/80 hover:bg-gradient-to-l hover:from-primary/10 hover:to-transparent hover:text-primary"
      }`}
    >
      <span className={`${isActive ? "text-primary" : "text-foreground/50 group-hover:text-primary"} transition-colors`}>
        {icon}
      </span>
      {children}
    </Link>
  )
}
