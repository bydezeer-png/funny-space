"use client"

import React, { useEffect, useState } from "react"
import Link from "next/link"

export default function AuthLink({ mobile = false }: { mobile?: boolean }) {
  const [session, setSession] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/auth/session")
      .then((res) => {
        if (!res.ok) return null
        return res.json()
      })
      .then((data) => {
        if (data && Object.keys(data).length > 0) {
          setSession(data)
        }
      })
      .catch((err) => console.error("Auth session fetch error:", err))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return mobile ? (
      <span className="block py-2 border-b border-pink-50/50 text-slate-400">تحميل...</span>
    ) : (
      <span className="text-white/40 font-semibold uppercase tracking-wider text-xs">...</span>
    )
  }

  if (session?.user) {
    const isClient = session.user.role === "CLIENT"
    const href = isClient ? "/client-portal" : "/dashboard"
    const label = isClient ? "My Space" : "Dashboard"

    return mobile ? (
      <Link href={href} className="block py-2 border-b border-pink-50/50 text-slate-700 hover:text-primary transition-colors">
        {label}
      </Link>
    ) : (
      <Link href={href} className="hover:text-white relative py-1 transition-all duration-300 after:absolute after:bottom-0 after:left-0 after:h-[2px] after:w-full after:origin-bottom-right after:scale-x-0 after:bg-white after:transition-transform after:duration-300 hover:after:origin-bottom-left hover:after:scale-x-100">
        {label}
      </Link>
    )
  }

  const loginLabel = mobile ? "Members Login" : "Members"
  return mobile ? (
    <Link href="/client-login" className="block py-2 border-b border-pink-50/50 text-slate-700 hover:text-primary transition-colors">
      {loginLabel}
    </Link>
  ) : (
    <Link href="/client-login" className="hover:text-white relative py-1 transition-all duration-300 after:absolute after:bottom-0 after:left-0 after:h-[2px] after:w-full after:origin-bottom-right after:scale-x-0 after:bg-white after:transition-transform after:duration-300 hover:after:origin-bottom-left hover:after:scale-x-100">
      {loginLabel}
    </Link>
  )
}
