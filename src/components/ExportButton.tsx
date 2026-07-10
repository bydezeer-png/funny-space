"use client"

import { Download } from "lucide-react"

interface ExportButtonProps {
  data: any[]
  filename: string
  headers: { key: string; label: string }[]
  buttonText?: string
}

export default function ExportButton({ data, filename, headers, buttonText = "تصدير Excel/CSV" }: ExportButtonProps) {
  const handleExport = () => {
    if (!data || data.length === 0) return

    // Create CSV rows
    const headerRow = headers.map(h => `"${h.label.replace(/"/g, '""')}"`).join(',')
    
    const bodyRows = data.map(item => {
      return headers.map(h => {
        // Resolve nested keys e.g. "client.name"
        const keys = h.key.split('.')
        let val = item
        for (const k of keys) {
          val = val ? val[k] : ''
        }
        
        // Clean value
        let strVal = ''
        if (val === null || val === undefined) {
          strVal = ''
        } else if (val instanceof Date) {
          strVal = new Date(val).toLocaleDateString('ar-EG')
        } else {
          strVal = String(val)
        }
        
        return `"${strVal.replace(/"/g, '""')}"`
      }).join(',')
    })

    const csvContent = "\uFEFF" + [headerRow, ...bodyRows].join('\n') // UTF-8 BOM for Arabic text support in Excel
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.setAttribute("href", url)
    link.setAttribute("download", `${filename}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <button
      onClick={handleExport}
      className="flex items-center gap-2 px-4 py-2 text-xs font-black bg-primary/10 text-primary hover:bg-primary hover:text-white rounded-xl border border-primary/20 hover:border-primary transition-all shadow-sm cursor-pointer"
    >
      <Download size={14} />
      <span>{buttonText}</span>
    </button>
  )
}
