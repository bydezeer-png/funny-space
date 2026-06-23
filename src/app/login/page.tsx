import { signIn } from "@/auth"
import { AuthError } from "next-auth"
import { redirect } from "next/navigation"

export default async function LoginPage(props: {
  searchParams: Promise<{ error?: string }>
}) {
  const searchParams = await props.searchParams
  const error = searchParams?.error

  const handleLogin = async (formData: FormData) => {
    "use server"
    try {
      const data = Object.fromEntries(formData)
      await signIn("credentials", { ...data, redirectTo: "/dashboard" })
    } catch (error) {
      if (error instanceof AuthError) {
        return redirect("/login?error=CredentialsSignin")
      }
      throw error
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-transparent p-4 relative overflow-hidden font-sans selection:bg-primary/30 selection:text-primary-foreground">
      {/* Decorative Brand Glows */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-pink-100/30 rounded-full blur-[130px] pointer-events-none -z-10"></div>
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-pink-50/40 rounded-full blur-[130px] pointer-events-none -z-10"></div>

      <div className="max-w-md w-full bg-white rounded-[2.5rem] shadow-2xl border border-pink-100/50 p-8 sm:p-10 relative z-10 animate-in zoom-in-95 duration-500">
        {/* Floating Brand Logo */}
        <div className="w-20 h-20 mx-auto mb-6 overflow-hidden rounded-2xl border border-pink-100 bg-white p-1.5 shadow-md shadow-pink-200/10">
          <img src="/logo.png" alt="Soly's Space Logo" className="w-full h-full object-contain" />
        </div>

        <div className="text-center mb-8">
          <h1 className="text-2xl sm:text-3xl font-black text-foreground mb-2">بوابة الإدارة والتحكم</h1>
          <p className="text-foreground/50 font-bold text-xs sm:text-sm">
            تسجيل دخول المسؤولين والموظفين في Soly's Space ✨
          </p>
        </div>

        {error && (
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
              className="w-full px-5 py-4 bg-background border border-pink-100/60 rounded-2xl focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none transition-all text-left font-mono font-bold shadow-sm"
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
              className="w-full px-5 py-4 bg-background border border-pink-100/60 rounded-2xl focus:border-primary focus:ring-2 focus:ring-primary/10 outline-none transition-all text-left font-mono font-bold shadow-sm"
              placeholder="********"
            />
          </div>
          <button
            type="submit"
            className="w-full bg-[#121212] hover:bg-primary text-white py-4 rounded-2xl font-black text-sm mt-3 transition-all duration-300 shadow-md shadow-pink-200/5 active:scale-[0.98] cursor-pointer"
          >
            دخول للنظام
          </button>
        </form>
      </div>
    </div>
  )
}
