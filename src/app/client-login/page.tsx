"use client"

import { useState } from "react"
import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowRight, Sparkles, Phone, Lock, Heart } from "lucide-react"

export default function ClientLoginPage() {
  const router = useRouter()
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    const formData = new FormData(e.currentTarget)
    const phone = formData.get("phone") as string
    const password = formData.get("password") as string

    if (!phone || !password) {
      setError("يرجى ملء جميع الحقول")
      setLoading(false)
      return
    }

    try {
      const res = await signIn("client", {
        phone: phone.trim(),
        password: password.trim(),
        redirect: false,
      })

      if (res?.error) {
        setError("رقم الهاتف أو كلمة المرور غير صحيحة")
        setLoading(false)
      } else {
        router.push("/client-portal")
        router.refresh()
      }
    } catch (err) {
      setError("حدث خطأ في الاتصال، يرجى المحاولة مرة أخرى")
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-transparent p-4 relative overflow-hidden font-sans selection:bg-primary/30 selection:text-primary-foreground">
      
      {/* Decorative Brand Glows */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-pink-100/30 rounded-full blur-[130px] pointer-events-none -z-10"></div>
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-pink-50/40 rounded-full blur-[130px] pointer-events-none -z-10"></div>

      <div className="max-w-md w-full bg-card rounded-[2.5rem] shadow-2xl border border-pink-100/50 p-8 sm:p-10 relative z-10 animate-in zoom-in-95 duration-500">
        
        {/* Floating Brand Logo */}
        <div className="w-20 h-20 mx-auto mb-6 overflow-hidden rounded-2xl border border-pink-100 bg-card p-1.5 shadow-md shadow-pink-200/10">
          <img src="/logo.png" alt="Soly's Space Logo" className="w-full h-full object-contain" />
        </div>

        {/* Title */}
        <div className="text-center mb-8">
          <h1 className="text-2xl sm:text-3xl font-black text-foreground mb-2">تسجيل دخول العضوات</h1>
          <p className="text-foreground/50 font-bold text-xs sm:text-sm">
            مرحباً بكِ مجدداً في مساحتكِ الخاصة بـ Soly's Space ✨
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="bg-red-50 text-red-500 p-4 rounded-2xl mb-6 text-xs sm:text-sm font-black border border-red-100 text-center animate-in shake">
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Phone Field */}
          <div>
            <label className="block text-xs font-black text-foreground/70 mb-2">
              رقم الموبايل للواتساب 💬
            </label>
            <div className="relative">
              <input
                type="text"
                name="phone"
                required
                dir="ltr"
                placeholder="01xxxxxxxxx"
                className="w-full px-5 py-4 pl-12 bg-background border border-pink-100/60 rounded-2xl focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none transition-all text-left font-mono font-bold shadow-sm"
              />
              <Phone size={18} className="absolute left-4 top-4.5 text-foreground/30" />
            </div>
          </div>

          {/* Password Field */}
          <div>
            <label className="block text-xs font-black text-foreground/70 mb-2">
              كلمة المرور 🔒
            </label>
            <div className="relative">
              <input
                type="password"
                name="password"
                required
                dir="ltr"
                placeholder="••••••••"
                className="w-full px-5 py-4 pl-12 bg-background border border-pink-100/60 rounded-2xl focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none transition-all text-left font-mono font-bold shadow-sm"
              />
              <Lock size={18} className="absolute left-4 top-4.5 text-foreground/30" />
            </div>
            
            {/* Helpful Hint Badge */}
            <div className="text-xs text-primary font-bold mt-4 text-center bg-pink-50/40 p-3 rounded-2xl border border-pink-100/40 flex items-center justify-center gap-1.5">
              <Heart size={12} className="animate-pulse text-primary shrink-0" />
              <span>تلميح: كلمة المرور الافتراضية لحسابكِ هي رقم هاتفكِ</span>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary text-white font-black py-4 rounded-2xl hover:bg-primary/95 hover:scale-[1.01] active:scale-95 transition-all shadow-lg shadow-pink-200/50 disabled:opacity-50 mt-4 text-base"
          >
            {loading ? "جاري التحقق والدخول..." : "دخول المساحة"}
          </button>
        </form>

        {/* Back Link */}
        <div className="mt-8 text-center pt-6 border-t border-pink-50">
          <Link href="/" className="text-xs sm:text-sm font-black text-foreground/40 hover:text-primary transition-all flex items-center justify-center gap-2 group">
            العودة للموقع الرئيسي <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </div>
    </div>
  )
}
