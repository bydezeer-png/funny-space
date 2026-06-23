"use client"

import { usePathname } from "next/navigation"
import { ShoppingCart, PackagePlus, Box, LineChart, Clock } from "lucide-react"
import Link from "next/link"

const iconMap: Record<string, React.ReactNode> = {
  ShoppingCart: <ShoppingCart size={18} />,
  PackagePlus: <PackagePlus size={18} />,
  Box: <Box size={18} />,
  LineChart: <LineChart size={18} />,
  Clock: <Clock size={18} />
}

export default function POSTabs({ tabs }: { tabs: { href: string, label: string, icon: string }[] }) {
  const pathname = usePathname()

  return (
    <div className="bg-card rounded-2xl shadow-sm border border-border p-2 flex overflow-x-auto gap-1">
      {tabs.map((tab) => {
        const isActive = tab.href === "/dashboard/pos"
          ? pathname === "/dashboard/pos"
          : pathname.startsWith(tab.href)
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all flex-shrink-0 cursor-pointer ${
              isActive
                ? "bg-primary text-white shadow-sm shadow-pink-200/20"
                : "text-foreground/60 hover:text-foreground hover:bg-background"
            }`}
          >
            {iconMap[tab.icon]}
            {tab.label}
          </Link>
        )
      })}
    </div>
  )
}
