import { signIn } from "@/auth"
import { AuthError } from "next-auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import Link from "next/link"

export default async function LoginPage(props: {
  searchParams: Promise<{ error?: string; minutes?: string; secret?: string }>
}) {
  const searchParams = await props.searchParams
  const error = searchParams?.error
  const minutes = searchParams?.minutes
  const secret = searchParams?.secret

  // Gate: only allow access if the secret matches the stored admin login secret
  const settings = await prisma.systemSettings.findUnique({ where: { id: "default" } })
  const adminSecret = settings?.adminLoginSecret || "soly-admin"
  if (secret !== adminSecret) {
    redirect("/")
  }

  const handleLogin = async (formData: FormData) => {
    "use server"
    const email = formData.get("email") as string

    // Fetch settings for lockout policy and admin secret
    const sett = await prisma.systemSettings.findUnique({
      where: { id: "default" }
    })
    const maxFailedAttempts = sett?.maxFailedAttempts ?? 5
    const lockoutDurationMinutes = sett?.lockoutDurationMinutes ?? 15
    const loginSecret = sett?.adminLoginSecret || "soly-admin"

    // Precheck for account lockout
    const user = await prisma.user.findUnique({
      where: { email }
    })

    if (user && user.lockoutUntil && user.lockoutUntil > new Date()) {
      const timeLeftMs = user.lockoutUntil.getTime() - Date.now()
      const minutesLeft = Math.ceil(timeLeftMs / (60 * 1000))
      return redirect(`/login?secret=${loginSecret}&error=LockedOut&minutes=${minutesLeft}`)
    }

    try {
      const data = Object.fromEntries(formData)
      await signIn("credentials", { ...data, redirectTo: "/dashboard" })
    } catch (error) {
      if (error instanceof AuthError) {
        // Double check if this attempt just locked out the user
        const updatedUser = await prisma.user.findUnique({
          where: { email }
        })
        if (updatedUser && updatedUser.failedAttempts >= maxFailedAttempts) {
          return redirect(`/login?secret=${loginSecret}&error=LockedOut&minutes=${lockoutDurationMinutes}`)
        }
        return redirect(`/login?secret=${loginSecret}&error=CredentialsSignin`)
      }
      throw error
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-transparent p-4 relative overflow-hidden font-sans selection:bg-primary/30 selection:text-primary-foreground">
      {/* Decorative Brand Glows */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-pink-100/30 rounded-full blur-[130px] pointer-events-none -z-10"></div>
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-pink-50/40 rounded-full blur-[130px] pointer-events-none -z-10"></div>

      <div className="max-w-md w-full bg-card rounded-[2.5rem] shadow-2xl border border-border/50 p-8 sm:p-10 relative z-10 animate-in zoom-in-95 duration-500">
        {/* Floating Brand Logo */}
        <div className="w-20 h-20 mx-auto mb-6 overflow-hidden rounded-2xl border border-border bg-card p-1.5 shadow-md shadow-pink-200/10">
          <img src="/logo.png" alt="Soly's Space" className="w-full h-full object-contain" />
        </div>

        <div className="text-center mb-8">
          <h1 className="text-2xl sm:text-3xl font-black text-foreground mb-2">بوابة الإدارة والتحكم</h1>
          <p className="text-foreground/50 font-bold text-xs sm:text-sm">
            تسجيل دخول المسؤولين والموظفين في Soly's Space ✨
          </p>
        </div>

        {error === "LockedOut" && (
          <div className="bg-amber-50 text-amber-700 p-4 rounded-2xl mb-6 text-xs sm:text-sm font-black border border-amber-100 text-center animate-in shake">
            ⚠️ تم قفل هذا الحساب مؤقتاً لمدة {minutes || 15} دقيقة بسبب محاولات دخول خاطئة متكررة.
          </div>
        )}

        {error === "CredentialsSignin" && (
          <div className="bg-red-50 text-red-500 p-4 rounded-2xl mb-6 text-xs sm:text-sm font-black border border-red-100 text-center animate-in shake">
            ⚠️ البريد الإلكتروني أو كلمة المرور غير صحيحة
          </div>
        )}

        <form action={handleLogin} className="space-y-5 text-right">
          <div>
            <label className="block text-xs font-black text-foreground/70 mb-2">
              البريد الإلكتروني ✉️
            </label>
            <input
              type="email"
              name="email"
              required
              className="w-full px-5 py-4 bg-background border border-border/60 rounded-2xl focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none transition-all text-left font-mono font-bold shadow-sm"
              placeholder="admin@funnyspace.com"
            />
          </div>
          <div>
            <label className="block text-xs font-black text-foreground/70 mb-2">
              كلمة المرور 🔒
            </label>
            <input
              type="password"
              name="password"
              required
              className="w-full px-5 py-4 bg-background border border-border/60 rounded-2xl focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none transition-all text-left font-mono font-bold shadow-sm"
              placeholder="********"
            />
          </div>
          <button
            type="submit"
            className="w-full bg-foreground hover:bg-primary text-white py-4 rounded-2xl font-black text-sm mt-3 transition-all duration-300 shadow-md shadow-pink-200/5 active:scale-[0.98] cursor-pointer"
          >
            دخول للنظام
          </button>
        </form>

        {/* Swapper navigation link */}
        <div className="mt-6 text-center pt-6 border-t border-pink-50 flex flex-col gap-3">
          <Link href="/client-login" className="text-xs sm:text-sm font-black text-primary hover:underline transition-all flex items-center justify-center gap-2">
            🔑 تسجيل دخول المشتركات
          </Link>
          <Link href="/" className="text-xs sm:text-sm font-black text-foreground/40 hover:text-primary transition-all flex items-center justify-center gap-2 group">
            العودة للموقع الرئيسي ←
          </Link>
        </div>
      </div>
    </div>
  )
}
