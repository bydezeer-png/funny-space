"use client"
import { useState } from "react"
import { updateSystemSettings } from "@/actions/settings"
import { toast } from "sonner"
import { Save, Phone, MapPin, Link as LinkIcon, CreditCard, Plus, Trash2, User, FileText, Link2 } from "lucide-react"

export default function SettingsForm({ initialSettings }: { initialSettings: any }) {
  const [loading, setLoading] = useState(false)
  
  let initialMethods: { id: string, name: string, account: string, link: string, note: string }[] = []
  if (initialSettings?.paymentMethods) {
    try {
      const parsed = JSON.parse(initialSettings.paymentMethods)
      if (Array.isArray(parsed)) {
        // Map old structure to new if necessary
        initialMethods = parsed.map(m => ({
          id: m.id || Math.random().toString(),
          name: m.name || "",
          account: m.account || m.details || "",
          link: m.link || "",
          note: m.note || ""
        }))
      }
    } catch(e) {
      // old string format
    }
  }

  const [methods, setMethods] = useState(initialMethods)
  const [form, setForm] = useState({
    spaceName: initialSettings?.spaceName || "Soly's Space",
    spaceDescription: initialSettings?.spaceDescription || "",
    whatsappNumber: initialSettings?.whatsappNumber || "",
    address: initialSettings?.address || "",
    mapLink: initialSettings?.mapLink || "",
    membershipDurationDays: initialSettings?.membershipDurationDays || 30,
    preventDoubleCheckIn: initialSettings?.preventDoubleCheckIn ?? true,
    enablePublicBookings: initialSettings?.enablePublicBookings ?? true,
    instagramLink: initialSettings?.instagramLink || "https://instagram.com",
    tiktokLink: initialSettings?.tiktokLink || "https://tiktok.com",
    maxFailedAttempts: initialSettings?.maxFailedAttempts || 5,
    lockoutDurationMinutes: initialSettings?.lockoutDurationMinutes || 15,
    showTestimonials: initialSettings?.showTestimonials ?? true,
    topAlertBanner: initialSettings?.topAlertBanner || "",
    showTopAlertBanner: initialSettings?.showTopAlertBanner ?? true,
    heroTitle: initialSettings?.heroTitle || "Welcome to Soly's Space ✨",
    heroSubtitle: initialSettings?.heroSubtitle || "",
    showHeroSection: initialSettings?.showHeroSection ?? true,
    showClassesSection: initialSettings?.showClassesSection ?? true,
    showPerksSection: initialSettings?.showPerksSection ?? true,
    showBookingSection: initialSettings?.showBookingSection ?? true,
    adminLoginSecret: initialSettings?.adminLoginSecret || "soly-admin",
  })

  const addMethod = () => {
    setMethods([...methods, { id: Math.random().toString(), name: "", account: "", link: "", note: "" }])
  }

  const updateMethod = (id: string, field: string, value: string) => {
    setMethods(methods.map(m => m.id === id ? { ...m, [field]: value } : m))
  }

  const removeMethod = (id: string) => {
    setMethods(methods.filter(m => m.id !== id))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await updateSystemSettings({
        ...form,
        membershipDurationDays: Number(form.membershipDurationDays),
        maxFailedAttempts: Number(form.maxFailedAttempts),
        lockoutDurationMinutes: Number(form.lockoutDurationMinutes),
        paymentMethods: JSON.stringify(methods)
      })
      toast.success("تم تحديث الإعدادات بنجاح ✨")
    } catch (err: any) {
      toast.error(err.message || "حدث خطأ أثناء التحديث")
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8 max-w-2xl text-right" dir="rtl">
      <div className="space-y-6">
        
        {/* Branding Section */}
        <div className="bg-secondary/20 p-6 rounded-2xl border border-border/50 space-y-4">
          <h3 className="text-sm font-black text-primary uppercase tracking-wider mb-2">🎨 هوية المكان وتصميم الواجهة</h3>
          
          <div>
            <label className="block text-xs font-bold text-foreground/80 mb-2">اسم المكان (العلامة التجارية)</label>
            <input 
              type="text"
              value={form.spaceName}
              onChange={e => setForm({...form, spaceName: e.target.value})}
              placeholder="مثال: Soly's Space"
              className="w-full bg-background border border-border/60 rounded-xl px-4 py-3 text-sm font-semibold outline-none focus:border-primary focus:bg-card transition-all shadow-sm"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-foreground/80 mb-2">الوصف التعريفي العام (يظهر بالصفحة الرئيسية)</label>
            <textarea 
              value={form.spaceDescription}
              onChange={e => setForm({...form, spaceDescription: e.target.value})}
              placeholder="اكتب وصفاً يعبر عن هوية المكان ومميزاته للعملاء..."
              rows={3}
              className="w-full bg-background border border-border/60 rounded-xl px-4 py-3 text-sm font-semibold outline-none focus:border-primary focus:bg-card transition-all shadow-sm resize-none"
            />
          </div>
        </div>

        {/* Contact Info & Socials Section */}
        <div className="space-y-4">
          <h3 className="text-sm font-black text-foreground/80 mb-2">📞 معلومات الاتصال وعناوين التواصل</h3>
          
          {/* WhatsApp */}
          <div>
            <label className="block text-xs font-bold text-foreground/80 mb-2">رقم الواتساب للحجوزات</label>
            <div className="relative">
              <Phone size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-primary/60" />
              <input 
                type="tel"
                value={form.whatsappNumber}
                onChange={e => setForm({...form, whatsappNumber: e.target.value})}
                placeholder="مثال: 01012345678"
                className="w-full bg-secondary/50 border border-border/60 rounded-xl px-12 py-3 text-sm font-semibold outline-none focus:border-primary focus:bg-card transition-all shadow-inner text-left font-mono"
                dir="ltr"
              />
            </div>
          </div>

          {/* Instagram Link */}
          <div>
            <label className="block text-xs font-bold text-foreground/80 mb-2">رابط حساب الانستجرام (Instagram)</label>
            <input 
              type="url"
              value={form.instagramLink}
              onChange={e => setForm({...form, instagramLink: e.target.value})}
              placeholder="https://instagram.com/..."
              className="w-full bg-secondary/50 border border-border/60 rounded-xl px-4 py-3 text-sm font-semibold outline-none focus:border-primary focus:bg-card transition-all shadow-inner text-left font-mono"
              dir="ltr"
            />
          </div>

          {/* TikTok Link */}
          <div>
            <label className="block text-xs font-bold text-foreground/80 mb-2">رابط حساب التيك توك (TikTok)</label>
            <input 
              type="url"
              value={form.tiktokLink}
              onChange={e => setForm({...form, tiktokLink: e.target.value})}
              placeholder="https://tiktok.com/..."
              className="w-full bg-secondary/50 border border-border/60 rounded-xl px-4 py-3 text-sm font-semibold outline-none focus:border-primary focus:bg-card transition-all shadow-inner text-left font-mono"
              dir="ltr"
            />
          </div>

          {/* Address */}
          <div>
            <label className="block text-xs font-bold text-foreground/80 mb-2">العنوان التفصيلي</label>
            <div className="relative">
              <MapPin size={16} className="absolute right-4 top-4 text-primary/60" />
              <textarea 
                value={form.address}
                onChange={e => setForm({...form, address: e.target.value})}
                placeholder="اكتب عنوان المكان بالتفصيل..."
                rows={2}
                className="w-full bg-secondary/50 border border-border/60 rounded-xl pr-12 pl-4 py-3 text-sm font-semibold outline-none focus:border-primary focus:bg-card transition-all shadow-inner resize-none"
              />
            </div>
          </div>

          {/* Map Link */}
          <div>
            <label className="block text-xs font-bold text-foreground/80 mb-2">رابط خرائط جوجل (Google Maps)</label>
            <div className="relative">
              <LinkIcon size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-primary/60" />
              <input 
                type="url"
                value={form.mapLink}
                onChange={e => setForm({...form, mapLink: e.target.value})}
                placeholder="https://maps.google.com/..."
                className="w-full bg-secondary/50 border border-border/60 rounded-xl px-12 py-3 text-sm font-semibold outline-none focus:border-primary focus:bg-card transition-all shadow-inner text-left font-mono"
                dir="ltr"
              />
            </div>
          </div>
        </div>

        {/* Business Rules & Policies Section */}
        <div className="bg-[#FFF5F8] p-6 rounded-2xl border border-pink-100/50 space-y-4">
          <h3 className="text-sm font-black text-primary uppercase tracking-wider mb-2">⚙️ سياسات العمل والتحكم الذاتي</h3>

          <div>
            <label className="block text-xs font-bold text-foreground/80 mb-2">مدة صلاحية باقات الاشتراكات (بالأيام)</label>
            <input 
              type="number"
              value={form.membershipDurationDays}
              onChange={e => setForm({...form, membershipDurationDays: parseInt(e.target.value) || 30})}
              placeholder="مثال: 30"
              className="w-full bg-background border border-border/60 rounded-xl px-4 py-3 text-sm font-semibold outline-none focus:border-primary focus:bg-card transition-all shadow-sm text-left font-mono"
              dir="ltr"
              min={1}
              required
            />
            <p className="text-[10px] text-foreground/45 mt-1 font-bold">عدد الأيام الافتراضية الممنوحة لصلاحية الباقة بعد الحجز قبل أن يتم إلغاؤها تلقائياً.</p>
          </div>

          <div className="flex items-center justify-between p-3.5 bg-background rounded-xl border border-border/40">
            <div className="space-y-0.5 text-right pl-4">
              <span className="block text-xs font-bold text-foreground">منع الحضور المزدوج في نفس اليوم</span>
              <span className="block text-[10px] text-foreground/45 font-semibold">تفعيل هذا الخيار يمنع العميلة من تسجيل الحضور أكثر من مرة في اليوم الواحد للاشتراك نفسه.</span>
            </div>
            <input 
              type="checkbox"
              checked={form.preventDoubleCheckIn}
              onChange={e => setForm({...form, preventDoubleCheckIn: e.target.checked})}
              className="w-5 h-5 accent-primary rounded cursor-pointer"
            />
          </div>

          <div className="flex items-center justify-between p-3.5 bg-background rounded-xl border border-border/40">
            <div className="space-y-0.5 text-right pl-4">
              <span className="block text-xs font-bold text-foreground">تفعيل الحجز الإلكتروني العام بالرئيسية</span>
              <span className="block text-[10px] text-foreground/45 font-semibold">تعطيل هذا الخيار يخفي فورم الحجز من الصفحة الرئيسية للعملاء ويعرض رسالة إغلاق مخصصة ورابط واتساب.</span>
            </div>
            <input 
              type="checkbox"
              checked={form.enablePublicBookings}
              onChange={e => setForm({...form, enablePublicBookings: e.target.checked})}
              className="w-5 h-5 accent-primary rounded cursor-pointer"
            />
          </div>

          <div className="flex items-center justify-between p-3.5 bg-background rounded-xl border border-border/40">
            <div className="space-y-0.5 text-right pl-4">
              <span className="block text-xs font-bold text-foreground">عرض قسم الآراء والتقييمات بالرئيسية</span>
              <span className="block text-[10px] text-foreground/45 font-semibold">تفعيل هذا الخيار يظهر قسم آراء العميلات وتقييماتهن بالصفحة الرئيسية للعامة.</span>
            </div>
            <input 
              type="checkbox"
              checked={form.showTestimonials}
              onChange={e => setForm({...form, showTestimonials: e.target.checked})}
              className="w-5 h-5 accent-primary rounded cursor-pointer"
            />
          </div>
        </div>

        {/* Security Policy Section */}
        <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 space-y-4">
          <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider mb-2">🛡️ سياسة حماية الموظفين وتأمين النظام</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-foreground/80 mb-2">أقصى محاولات دخول خاطئة مسموحة</label>
              <input 
                type="number"
                value={form.maxFailedAttempts}
                onChange={e => setForm({...form, maxFailedAttempts: parseInt(e.target.value) || 5})}
                className="w-full bg-background border border-border/60 rounded-xl px-4 py-3 text-sm font-semibold outline-none focus:border-primary focus:bg-card transition-all shadow-sm text-left font-mono"
                dir="ltr"
                min={1}
                required
              />
              <p className="text-[10px] text-foreground/45 mt-1 font-bold">عدد محاولات تسجيل الدخول الخاطئة المتتالية قبل قفل الحساب مؤقتاً.</p>
            </div>

            <div>
              <label className="block text-xs font-bold text-foreground/80 mb-2">مدة قفل الحساب مؤقتاً (بالدقائق)</label>
              <input 
                type="number"
                value={form.lockoutDurationMinutes}
                onChange={e => setForm({...form, lockoutDurationMinutes: parseInt(e.target.value) || 15})}
                className="w-full bg-background border border-border/60 rounded-xl px-4 py-3 text-sm font-semibold outline-none focus:border-primary focus:bg-card transition-all shadow-sm text-left font-mono"
                dir="ltr"
                min={1}
                required
              />
              <p className="text-[10px] text-foreground/45 mt-1 font-bold">المدة بالدقائق التي يتم قفل الحساب فيها قبل السماح بالمحاولة مرة أخرى.</p>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-200/50">
            <label className="block text-xs font-bold text-foreground/80 mb-2">رابط أو رمز الدخول السري لوحة التحكم</label>
            <input 
              type="text"
              value={form.adminLoginSecret}
              onChange={e => setForm({...form, adminLoginSecret: e.target.value.trim()})}
              className="w-full bg-background border border-border/60 rounded-xl px-4 py-3 text-sm font-semibold outline-none focus:border-primary focus:bg-card transition-all shadow-sm text-left font-mono"
              dir="ltr"
              required
            />
            <p className="text-[10px] text-foreground/45 mt-1.5 font-bold font-sans">
              لحماية لوحة التحكم، يجب كتابة الرابط مع هذا الرمز للوصول لصفحة الدخول:{" "}
              <code className="bg-slate-100 text-pink-600 px-1 py-0.5 rounded text-[9px]">/login?secret={form.adminLoginSecret || "soly-admin"}</code>. 
              إذا حاول أي شخص الدخول بدون الرمز سيتم توجيهه تلقائياً للصفحة الرئيسية.
            </p>
          </div>
        </div>

        {/* Landing Page CMS & Controls Section */}
        <div className="bg-blue-50/20 p-6 rounded-2xl border border-blue-100/50 space-y-4">
          <h3 className="text-sm font-black text-blue-900 uppercase tracking-wider mb-2">🖥️ إدارة محتوى وأقسام الصفحة الرئيسية</h3>

          {/* Top Alert Banner Group */}
          <div className="space-y-3 p-4 bg-background rounded-xl border border-border/40">
            <div className="flex items-center justify-between">
              <span className="block text-xs font-bold text-foreground">تفعيل البانر الإعلاني العلوي</span>
              <input 
                type="checkbox"
                checked={form.showTopAlertBanner}
                onChange={e => setForm({...form, showTopAlertBanner: e.target.checked})}
                className="w-5 h-5 accent-primary rounded cursor-pointer"
              />
            </div>
            {form.showTopAlertBanner && (
              <div>
                <label className="block text-[10px] font-bold text-foreground/50 mb-1">نص البانر الإعلاني</label>
                <input 
                  type="text"
                  value={form.topAlertBanner}
                  onChange={e => setForm({...form, topAlertBanner: e.target.value})}
                  placeholder="مثال: 🎉 أهلاً بكِ في مساحتنا! استخدمي كود التخفيض FIRST10"
                  className="w-full bg-secondary/30 border border-border/50 rounded-lg px-3 py-2 text-sm font-semibold outline-none focus:border-primary"
                />
              </div>
            )}
          </div>

          {/* Hero Section Content */}
          <div className="space-y-4 p-4 bg-background rounded-xl border border-border/40">
            <div className="flex items-center justify-between">
              <span className="block text-xs font-bold text-foreground">عرض قسم الترحيب (Hero Section)</span>
              <input 
                type="checkbox"
                checked={form.showHeroSection}
                onChange={e => setForm({...form, showHeroSection: e.target.checked})}
                className="w-5 h-5 accent-primary rounded cursor-pointer"
              />
            </div>
            {form.showHeroSection && (
              <div className="space-y-3">
                <div>
                  <label className="block text-[10px] font-bold text-foreground/50 mb-1">العنوان الترحيبي الرئيسي</label>
                  <input 
                    type="text"
                    value={form.heroTitle}
                    onChange={e => setForm({...form, heroTitle: e.target.value})}
                    placeholder="مثال: Welcome to Soly's Space ✨"
                    className="w-full bg-secondary/30 border border-border/50 rounded-lg px-3 py-2 text-sm font-semibold outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-foreground/50 mb-1">الوصف الترحيبي الفرعي</label>
                  <textarea 
                    value={form.heroSubtitle}
                    onChange={e => setForm({...form, heroSubtitle: e.target.value})}
                    placeholder="اكتب الوصف الترحيبي الفرعي..."
                    rows={2}
                    className="w-full bg-secondary/30 border border-border/50 rounded-lg px-3 py-2 text-sm font-semibold outline-none focus:border-primary resize-none"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Section Visibility Toggles */}
          <div className="p-4 bg-background rounded-xl border border-border/40 space-y-3.5">
            <h4 className="text-xs font-bold text-foreground/70 mb-2">رؤية باقي أقسام الصفحة الرئيسية</h4>
            
            <div className="flex items-center justify-between">
              <div className="space-y-0.5 text-right">
                <span className="block text-xs font-bold text-foreground">قسم كلاسات وتصنيفات الأنشطة</span>
              </div>
              <input 
                type="checkbox"
                checked={form.showClassesSection}
                onChange={e => setForm({...form, showClassesSection: e.target.checked})}
                className="w-5 h-5 accent-primary rounded cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-between border-t border-border/30 pt-3">
              <div className="space-y-0.5 text-right">
                <span className="block text-xs font-bold text-foreground">قسم المميزات والعروض (Perks)</span>
              </div>
              <input 
                type="checkbox"
                checked={form.showPerksSection}
                onChange={e => setForm({...form, showPerksSection: e.target.checked})}
                className="w-5 h-5 accent-primary rounded cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-between border-t border-border/30 pt-3">
              <div className="space-y-0.5 text-right">
                <span className="block text-xs font-bold text-foreground">قسم فورمة الحجز (Booking Card)</span>
              </div>
              <input 
                type="checkbox"
                checked={form.showBookingSection}
                onChange={e => setForm({...form, showBookingSection: e.target.checked})}
                className="w-5 h-5 accent-primary rounded cursor-pointer"
              />
            </div>
          </div>
        </div>

      </div>

      {/* Payment Methods Info */}
      <div className="pt-6 border-t border-border">
        <div className="flex justify-between items-center mb-4">
          <div>
            <label className="block text-sm font-black text-foreground flex items-center gap-2">
              <CreditCard size={18} className="text-primary" />
              طرق الدفع المتاحة
            </label>
            <p className="text-[10px] text-foreground/45 mt-1 font-bold">ستظهر هذه التفاصيل للعميلة لتختار الطريقة المناسبة عند الحجز.</p>
          </div>
          <button 
            type="button" 
            onClick={addMethod}
            className="text-xs font-bold bg-secondary text-primary hover:bg-secondary px-3 py-2 rounded-lg flex items-center gap-1 transition-colors"
          >
            <Plus size={14} /> إضافة طريقة
          </button>
        </div>

        <div className="space-y-4">
          {methods.length === 0 && (
            <div className="text-center p-6 border border-dashed border-border rounded-2xl text-foreground/40 font-bold text-sm">
              لا توجد طرق دفع مضافة. (الدفع عند الحضور فقط)
            </div>
          )}
          {methods.map((m, index) => (
            <div key={m.id} className="bg-card border border-border/80 rounded-2xl p-5 flex gap-4 shadow-sm relative group">
              <button 
                type="button"
                onClick={() => removeMethod(m.id)}
                className="absolute top-4 left-4 text-red-300 hover:text-red-500 transition-colors"
              >
                <Trash2 size={16} />
              </button>
              
              <div className="flex-1 space-y-4 pr-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-bold text-foreground/60 mb-1">اسم الطريقة (مثال: محفظة إلكترونية، انستاباي)</label>
                    <input 
                      type="text"
                      value={m.name}
                      onChange={e => updateMethod(m.id, 'name', e.target.value)}
                      className="w-full bg-secondary/30 border border-border/50 rounded-lg px-3 py-2 text-sm font-semibold outline-none focus:border-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-foreground/60 mb-1 flex items-center gap-1"><User size={12}/> اليوزر أو الرقم</label>
                    <input 
                      type="text"
                      value={m.account}
                      onChange={e => updateMethod(m.id, 'account', e.target.value)}
                      className="w-full bg-secondary/30 border border-border/50 rounded-lg px-3 py-2 text-sm font-semibold outline-none focus:border-primary dir-ltr text-left"
                      placeholder="010... أو @user"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-bold text-foreground/60 mb-1 flex items-center gap-1"><Link2 size={12}/> رابط الدفع (اختياري)</label>
                    <input 
                      type="url"
                      value={m.link}
                      onChange={e => updateMethod(m.id, 'link', e.target.value)}
                      className="w-full bg-secondary/30 border border-border/50 rounded-lg px-3 py-2 text-sm font-semibold outline-none focus:border-primary dir-ltr text-left"
                      placeholder="https://..."
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-foreground/60 mb-1 flex items-center gap-1"><FileText size={12}/> ملحوظة (اختياري)</label>
                    <input 
                      type="text"
                      value={m.note}
                      onChange={e => updateMethod(m.id, 'note', e.target.value)}
                      className="w-full bg-secondary/30 border border-border/50 rounded-lg px-3 py-2 text-sm font-semibold outline-none focus:border-primary"
                      placeholder="برجاء إرسال إيصال الدفع..."
                    />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="pt-2 border-t border-border flex justify-end">
        <button 
          type="submit" 
          disabled={loading}
          className="bg-foreground hover:bg-primary text-white py-3.5 px-8 rounded-xl font-black text-sm flex items-center justify-center gap-2 shadow-md hover:shadow-[0_10px_25px_rgba(236,72,153,0.3)] transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none"
        >
          <Save size={18} />
          {loading ? "جاري الحفظ..." : "حفظ الإعدادات"}
        </button>
      </div>
    </form>
  )
}
