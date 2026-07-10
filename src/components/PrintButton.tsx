"use client"

import { Printer } from "lucide-react"

export default function PrintButton() {
  return (
    <button
      onClick={() => window.print()}
      className="flex items-center gap-2 px-4 py-2 text-xs font-black bg-muted hover:bg-primary hover:text-white rounded-xl border border-border transition-all shadow-sm cursor-pointer text-foreground"
    >
      <Printer size={14} />
      <span>طباعة تقرير PDF</span>
    </button>
  )
}
