"use client"

import { useState, useEffect, useRef } from "react"
import { Search, X, User, Package, Shield, ArrowLeft } from "lucide-react"
import { useRouter } from "next/navigation"
import { globalSearch, SearchResult } from "@/actions/search"

export default function GlobalSearch() {
  const [isOpen, setIsOpen] = useState(false)
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // e.code === "KeyK" ensures it works even if keyboard is in Arabic ("ن")
      if ((e.ctrlKey || e.metaKey) && (e.key === "k" || e.code === "KeyK")) {
        e.preventDefault()
        setIsOpen(true)
      }
      if (e.key === "Escape") {
        setIsOpen(false)
      }
    }
    window.addEventListener("keydown", handleKeyDown, { capture: true })
    return () => window.removeEventListener("keydown", handleKeyDown, { capture: true })
  }, [])

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100)
    } else {
      setQuery("")
      setResults([])
    }
  }, [isOpen])

  useEffect(() => {
    if (query.length < 2) {
      setResults([])
      return
    }

    const delayDebounceFn = setTimeout(async () => {
      setLoading(true)
      try {
        const res = await globalSearch(query)
        setResults(res)
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }, 300)

    return () => clearTimeout(delayDebounceFn)
  }, [query])

  const handleSelect = (url: string) => {
    setIsOpen(false)
    router.push(url)
  }

  const getIcon = (type: string) => {
    switch (type) {
      case 'CLIENT': return <User size={18} className="text-blue-500" />
      case 'INVENTORY': return <Package size={18} className="text-green-500" />
      case 'USER': return <Shield size={18} className="text-red-500" />
      default: return <Search size={18} />
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-[100] flex items-start justify-center pt-[10vh] px-4 animate-in fade-in duration-200">
      <div className="bg-card w-full max-w-2xl rounded-3xl shadow-2xl border border-border overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Search Header */}
        <div className="relative border-b border-border/50">
          <Search className="absolute right-5 top-1/2 -translate-y-1/2 text-foreground/40" size={24} />
          <input 
            ref={inputRef}
            type="text" 
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="ابحث عن المشتركات، الكاشير، الموظفين... (أو استخدم الباركود)"
            className="w-full bg-transparent text-foreground text-xl px-14 py-6 outline-none placeholder:text-foreground/30"
          />
          <button 
            onClick={() => setIsOpen(false)}
            className="absolute left-5 top-1/2 -translate-y-1/2 bg-muted text-foreground/50 px-2 py-1 rounded text-xs font-mono font-bold"
          >
            ESC
          </button>
        </div>

        {/* Results Body */}
        <div className="max-h-[50vh] overflow-y-auto p-2">
          {loading ? (
            <div className="p-10 text-center text-foreground/40 font-bold animate-pulse">
              جاري البحث...
            </div>
          ) : results.length > 0 ? (
            <div className="space-y-1">
              {results.map((result, idx) => (
                <button 
                  key={`${result.type}-${result.id}-${idx}`}
                  onClick={() => handleSelect(result.url)}
                  className="w-full text-right flex items-center justify-between p-4 rounded-2xl hover:bg-muted/50 transition-colors group"
                >
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-background border border-border rounded-xl group-hover:scale-110 transition-transform">
                      {getIcon(result.type)}
                    </div>
                    <div>
                      <h4 className="font-bold text-foreground">{result.title}</h4>
                      <p className="text-sm text-foreground/50 font-medium">{result.subtitle}</p>
                    </div>
                  </div>
                  <ArrowLeft size={18} className="text-foreground/30 opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>
              ))}
            </div>
          ) : query.length >= 2 ? (
            <div className="p-10 text-center text-foreground/40 font-bold">
              لا توجد نتائج مطابقة لبحثك.
            </div>
          ) : (
            <div className="p-10 text-center text-foreground/30 font-medium">
              اكتب حرفين أو أكثر للبدء في البحث السريع.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
