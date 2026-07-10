"use client"

import { useTheme } from "next-themes"
import { Sun, Moon } from "lucide-react"
import { useEffect, useState } from "react"

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  // Avoid hydration mismatch
  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return <div className="w-9 h-9 rounded-full bg-border/20 animate-pulse"></div>
  }

  return (
    <button
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      className="p-2.5 rounded-xl hover:bg-border/30 text-foreground transition-all duration-300 shadow-xs border border-border cursor-pointer flex items-center justify-center shrink-0"
      title="تبديل الوضع الليلي / النهاري"
    >
      {theme === "dark" ? <Sun size={16} className="text-amber-500 animate-spin-slow" /> : <Moon size={16} className="text-foreground/75" />}
    </button>
  )
}
