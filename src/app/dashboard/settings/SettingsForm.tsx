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
    whatsappNumber: initialSettings?.whatsappNumber || "",
    address: initialSettings?.address || "",
    mapLink: initialSettings?.mapLink || "",
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
    <form onSubmit={handleSubmit} className="space-y-8 max-w-2xl">
      <div className="space-y-4">
        
        {/* WhatsApp */}
        <div>
          <label className="block text-sm font-bold text-foreground/80 mb-2">رقم الواتساب للحجوزات</label>
          <div className="relative">
            <Phone size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-primary/60" />
            <input 
              type="tel"
              value={form.whatsappNumber}
              onChange={e => setForm({...form, whatsappNumber: e.target.value})}
              placeholder="مثال: 01012345678"
              className="w-full bg-[#FFF5F8]/50 border border-pink-100/60 rounded-xl px-12 py-3.5 text-sm font-semibold outline-none focus:border-primary focus:bg-white transition-all shadow-inner text-left"
              dir="ltr"
            />
          </div>
        </div>

        {/* Address */}
        <div>
          <label className="block text-sm font-bold text-foreground/80 mb-2">العنوان التفصيلي</label>
          <div className="relative">
            <MapPin size={18} className="absolute right-4 top-4 text-primary/60" />
            <textarea 
              value={form.address}
              onChange={e => setForm({...form, address: e.target.value})}
              placeholder="اكتب عنوان المكان بالتفصيل..."
              rows={2}
              className="w-full bg-[#FFF5F8]/50 border border-pink-100/60 rounded-xl pr-12 pl-4 py-3.5 text-sm font-semibold outline-none focus:border-primary focus:bg-white transition-all shadow-inner resize-none"
            />
          </div>
        </div>

        {/* Map Link */}
        <div>
          <label className="block text-sm font-bold text-foreground/80 mb-2">رابط خرائط جوجل (Google Maps)</label>
          <div className="relative">
            <LinkIcon size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-primary/60" />
            <input 
              type="url"
              value={form.mapLink}
              onChange={e => setForm({...form, mapLink: e.target.value})}
              placeholder="https://maps.google.com/..."
              className="w-full bg-[#FFF5F8]/50 border border-pink-100/60 rounded-xl px-12 py-3.5 text-sm font-semibold outline-none focus:border-primary focus:bg-white transition-all shadow-inner text-left"
              dir="ltr"
            />
          </div>
        </div>

      </div>

      {/* Payment Methods Info */}
      <div className="pt-6 border-t border-pink-50">
        <div className="flex justify-between items-center mb-4">
          <div>
            <label className="block text-sm font-black text-[#121212] flex items-center gap-2">
              <CreditCard size={18} className="text-primary" />
              طرق الدفع المتاحة
            </label>
            <p className="text-[10px] text-foreground/45 mt-1 font-bold">ستظهر هذه التفاصيل للعميلة لتختار الطريقة المناسبة عند الحجز.</p>
          </div>
          <button 
            type="button" 
            onClick={addMethod}
            className="text-xs font-bold bg-pink-50 text-primary hover:bg-pink-100 px-3 py-2 rounded-lg flex items-center gap-1 transition-colors"
          >
            <Plus size={14} /> إضافة طريقة
          </button>
        </div>

        <div className="space-y-4">
          {methods.length === 0 && (
            <div className="text-center p-6 border border-dashed border-pink-200 rounded-2xl text-foreground/40 font-bold text-sm">
              لا توجد طرق دفع مضافة. (الدفع عند الحضور فقط)
            </div>
          )}
          {methods.map((m, index) => (
            <div key={m.id} className="bg-white border border-pink-100/80 rounded-2xl p-5 flex gap-4 shadow-sm relative group">
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
                      className="w-full bg-[#FFF5F8]/30 border border-pink-100/50 rounded-lg px-3 py-2 text-sm font-semibold outline-none focus:border-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-foreground/60 mb-1 flex items-center gap-1"><User size={12}/> اليوزر أو الرقم</label>
                    <input 
                      type="text"
                      value={m.account}
                      onChange={e => updateMethod(m.id, 'account', e.target.value)}
                      className="w-full bg-[#FFF5F8]/30 border border-pink-100/50 rounded-lg px-3 py-2 text-sm font-semibold outline-none focus:border-primary dir-ltr text-left"
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
                      className="w-full bg-[#FFF5F8]/30 border border-pink-100/50 rounded-lg px-3 py-2 text-sm font-semibold outline-none focus:border-primary dir-ltr text-left"
                      placeholder="https://..."
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-foreground/60 mb-1 flex items-center gap-1"><FileText size={12}/> ملحوظة (اختياري)</label>
                    <input 
                      type="text"
                      value={m.note}
                      onChange={e => updateMethod(m.id, 'note', e.target.value)}
                      className="w-full bg-[#FFF5F8]/30 border border-pink-100/50 rounded-lg px-3 py-2 text-sm font-semibold outline-none focus:border-primary"
                      placeholder="برجاء إرسال إيصال الدفع..."
                    />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="pt-2 border-t border-pink-50 flex justify-end">
        <button 
          type="submit" 
          disabled={loading}
          className="bg-[#121212] hover:bg-primary text-white py-3.5 px-8 rounded-xl font-black text-sm flex items-center justify-center gap-2 shadow-md hover:shadow-[0_10px_25px_rgba(236,72,153,0.3)] transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none"
        >
          <Save size={18} />
          {loading ? "جاري الحفظ..." : "حفظ الإعدادات"}
        </button>
      </div>
    </form>
  )
}
