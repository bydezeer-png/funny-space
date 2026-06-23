"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams, usePathname } from "next/navigation"
import { Calendar, Filter } from "lucide-react"

export default function DateRangeFilter() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const pathname = usePathname()

  const [from, setFrom] = useState(searchParams.get("from") || "")
  const [to, setTo] = useState(searchParams.get("to") || "")

  const handleApply = () => {
    const params = new URLSearchParams(searchParams.toString())
    if (from) params.set("from", from)
    else params.delete("from")

    if (to) params.set("to", to)
    else params.delete("to")

    router.push(`${pathname}?${params.toString()}`)
  }

  const handleClear = () => {
    setFrom("")
    setTo("")
    const params = new URLSearchParams(searchParams.toString())
    params.delete("from")
    params.delete("to")
    router.push(`${pathname}?${params.toString()}`)
  }

  return (
    <div className="flex items-center gap-3 bg-card border border-border p-2 rounded-2xl">
      <div className="flex items-center gap-2 bg-background px-3 py-1.5 rounded-xl border border-border">
        <Calendar size={16} className="text-foreground/50" />
        <span className="text-sm font-medium text-foreground/50">من:</span>
        <input 
          type="date" 
          value={from} 
          onChange={(e) => setFrom(e.target.value)}
          className="bg-transparent outline-none text-sm font-mono"
        />
      </div>

      <div className="flex items-center gap-2 bg-background px-3 py-1.5 rounded-xl border border-border">
        <span className="text-sm font-medium text-foreground/50">إلى:</span>
        <input 
          type="date" 
          value={to} 
          onChange={(e) => setTo(e.target.value)}
          className="bg-transparent outline-none text-sm font-mono"
        />
      </div>

      <button 
        onClick={handleApply}
        className="bg-primary text-primary-foreground p-2 rounded-xl hover:opacity-90 transition"
      >
        <Filter size={18} />
      </button>

      {(from || to) && (
        <button 
          onClick={handleClear}
          className="text-xs font-bold text-red-500 hover:bg-red-500/10 px-3 py-2 rounded-xl transition"
        >
          مسح
        </button>
      )}
    </div>
  )
}
