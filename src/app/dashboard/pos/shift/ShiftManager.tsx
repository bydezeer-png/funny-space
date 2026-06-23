"use client"

import { useState } from "react"
import { openShift, closeShift, addShiftExpense } from "@/actions/pos"
import { Clock, Play, Square, Banknote, MinusCircle } from "lucide-react"

type Shift = {
  id: string
  openedAt: Date
  expectedCash: number
  expectedCard?: number
  expectedWallet?: number
  startingCash?: number
  totalExpenses?: number
  openedBy: string | null
} | null

export default function ShiftManager({ initialShift }: { initialShift: Shift }) {
  const [shift, setShift] = useState<Shift>(initialShift)
  const [startingCash, setStartingCash] = useState("0")
  const [actualCash, setActualCash] = useState("")
  const [notes, setNotes] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  const [expenseAmount, setExpenseAmount] = useState("")
  const [expenseDesc, setExpenseDesc] = useState("")
  const [expenseLoading, setExpenseLoading] = useState(false)

  const handleOpenShift = async () => {
    setLoading(true)
    setError("")
    setSuccess("")
    try {
      // In a real app, openedBy would come from auth session.
      const newShift = await openShift("Cashier", parseFloat(startingCash || "0"))
      setShift(newShift)
      setSuccess("تم فتح الوردية بنجاح! يمكنك الآن البيع.")
      setStartingCash("0")
    } catch (err: any) {
      setError(err.message || "حدث خطأ أثناء فتح الوردية")
    } finally {
      setLoading(false)
    }
  }

  const handleCloseShift = async () => {
    if (!shift) return
    setLoading(true)
    setError("")
    setSuccess("")
    try {
      await closeShift(shift.id, parseFloat(actualCash || "0"), notes)
      setShift(null)
      setSuccess("تم إغلاق الوردية وجرد الدرج بنجاح!")
      setActualCash("")
      setNotes("")
    } catch (err: any) {
      setError(err.message || "حدث خطأ أثناء إغلاق الوردية")
    } finally {
      setLoading(false)
    }
  }

  const handleAddExpense = async () => {
    if (!shift || !expenseAmount || !expenseDesc) return
    setExpenseLoading(true)
    setError("")
    setSuccess("")
    try {
      await addShiftExpense(shift.id, parseFloat(expenseAmount), expenseDesc)
      setSuccess("تم تسجيل المصروف بنجاح وخصمه من درج الكاشير.")
      setExpenseAmount("")
      setExpenseDesc("")
      // Update local shift state
      setShift(prev => prev ? { ...prev, expectedCash: prev.expectedCash - parseFloat(expenseAmount), totalExpenses: (prev.totalExpenses || 0) + parseFloat(expenseAmount) } : prev)
    } catch (err: any) {
      setError(err.message || "حدث خطأ أثناء تسجيل المصروف")
    } finally {
      setExpenseLoading(false)
    }
  }

  if (shift) {
    const variance = parseFloat(actualCash || "0") - shift.expectedCash
    const varianceColor = variance === 0 ? "text-green-500" : variance > 0 ? "text-green-500" : "text-red-500"

    return (
      <div className="bg-card p-8 rounded-3xl border border-border shadow-sm max-w-2xl mx-auto">
        <div className="flex items-center gap-4 mb-8 pb-6 border-b border-border/50">
          <div className="p-4 bg-green-500/10 text-green-500 rounded-2xl">
            <Clock size={32} />
          </div>
          <div>
            <h2 className="text-2xl font-black text-foreground">وردية مفتوحة</h2>
            <p className="text-foreground/70 font-medium">الوردية الحالية مفتوحة منذ {new Date(shift.openedAt).toLocaleString('ar-EG')}</p>
          </div>
        </div>

        {error && <div className="p-4 mb-6 bg-red-50 text-red-600 rounded-xl font-bold border border-red-100">{error}</div>}
        {success && <div className="p-4 mb-6 bg-green-50 text-green-600 rounded-xl font-bold border border-green-100">{success}</div>}

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-background border border-border p-4 rounded-2xl text-center">
            <p className="text-foreground/70 text-xs font-bold mb-1">إجمالي الكاش المتوقع (الدرج + المبيعات)</p>
            <p className="text-2xl font-black text-foreground">{shift.expectedCash} <span className="text-sm">ج.م</span></p>
          </div>
          <div className="bg-background border border-border p-4 rounded-2xl text-center">
            <p className="text-foreground/70 text-xs font-bold mb-1">مبيعات بطاقات الائتمان (فيزا)</p>
            <p className="text-2xl font-black text-foreground">{shift.expectedCard} <span className="text-sm">ج.م</span></p>
          </div>
          <div className="bg-background border border-border p-4 rounded-2xl text-center">
            <p className="text-foreground/70 text-xs font-bold mb-1">مبيعات المحافظ الإلكترونية</p>
            <p className="text-2xl font-black text-foreground">{shift.expectedWallet} <span className="text-sm">ج.م</span></p>
          </div>
          <div className="bg-background border-primary/20 p-4 rounded-2xl text-center shadow-sm">
            <p className="text-foreground/70 text-xs font-bold mb-1">العجز أو الزيادة (كاش فقط)</p>
            <p className={`text-2xl font-black ${actualCash ? varianceColor : 'text-foreground/30'}`}>
              {actualCash ? `${variance > 0 ? '+' : ''}${variance} ج.م` : '-'}
            </p>
          </div>
        </div>

        <div className="bg-red-500/5 border border-red-500/20 p-6 rounded-2xl mb-8">
          <h3 className="font-bold text-red-500 flex items-center gap-2 mb-4"><MinusCircle size={20}/> تسجيل مصروف من الدرج</h3>
          <div className="flex flex-col md:flex-row gap-4">
            <input 
              type="text" 
              value={expenseDesc}
              onChange={e => setExpenseDesc(e.target.value)}
              className="flex-1 bg-background border border-border rounded-xl py-3 px-4 focus:ring-2 focus:ring-primary outline-none" 
              placeholder="وصف المصروف (مثال: مياه، ضيافة، توصيل...)"
            />
            <div className="relative w-full md:w-48">
              <input 
                type="number" 
                value={expenseAmount}
                onChange={e => setExpenseAmount(e.target.value)}
                className="w-full bg-background border border-border rounded-xl py-3 pr-4 pl-12 focus:ring-2 focus:ring-primary outline-none font-bold" 
                placeholder="المبلغ"
              />
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-foreground/50 font-bold text-sm">ج.م</span>
            </div>
            <button 
              onClick={handleAddExpense}
              disabled={expenseLoading || !expenseAmount || !expenseDesc}
              className="bg-red-500 text-white font-bold px-6 py-3 rounded-xl hover:bg-red-600 transition-all disabled:opacity-50"
            >
              {expenseLoading ? "جاري..." : "خصم"}
            </button>
          </div>
          {shift.totalExpenses ? <p className="text-sm font-bold text-red-500/70 mt-3">إجمالي المصروفات المسحوبة من الدرج اليوم: {shift.totalExpenses} ج.م</p> : null}
        </div>

        <div className="space-y-6">
          <h3 className="font-bold text-lg border-b border-border/50 pb-2">إغلاق الوردية (جرد الدرج)</h3>
          
          <div>
            <label className="block text-sm font-bold text-foreground/70 mb-2">النقد الفعلي الموجود في الدرج الآن</label>
            <div className="relative">
              <Banknote size={20} className="absolute right-4 top-1/2 -translate-y-1/2 text-foreground/50" />
              <input 
                type="number" 
                value={actualCash}
                onChange={e => setActualCash(e.target.value)}
                className="w-full bg-background border border-border rounded-xl py-4 pr-12 pl-4 text-xl font-bold focus:ring-2 focus:ring-primary outline-none" 
                placeholder="أدخل المبلغ الموجود فعلياً..."
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-foreground/70 mb-2">ملاحظات العجز/الزيادة (اختياري)</label>
            <textarea 
              value={notes}
              onChange={e => setNotes(e.target.value)}
              className="w-full bg-background border border-border rounded-xl py-4 px-4 focus:ring-2 focus:ring-primary outline-none min-h-[100px]" 
              placeholder="اكتب أي تفاصيل حول سبب العجز أو الزيادة هنا..."
            />
          </div>

          <button 
            onClick={handleCloseShift}
            disabled={loading || !actualCash}
            className="w-full py-4 bg-red-500 text-white font-black text-lg rounded-xl shadow-sm hover:bg-red-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <Square size={20} fill="currentColor" />
            {loading ? "جاري الإغلاق..." : "إغلاق الوردية"}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-card p-8 rounded-3xl border border-border shadow-sm max-w-xl mx-auto text-center">
      <div className="flex justify-center mb-6">
        <div className="w-24 h-24 bg-primary/10 text-primary rounded-full flex items-center justify-center">
          <Clock size={48} />
        </div>
      </div>
      
      <h2 className="text-3xl font-black text-foreground mb-4">لا توجد وردية مفتوحة</h2>
      <p className="text-foreground/70 font-medium mb-8">
        يجب فتح وردية جديدة لتتمكن من استخدام الكاشير والبدء في البيع للعملاء.
      </p>

      {error && <div className="p-4 mb-6 bg-red-50 text-red-600 rounded-xl font-bold border border-red-100 text-right">{error}</div>}
      {success && <div className="p-4 mb-6 bg-green-50 text-green-600 rounded-xl font-bold border border-green-100 text-right">{success}</div>}

      <div className="text-right space-y-6">
        <div>
          <label className="block text-sm font-bold text-foreground/70 mb-2">الكاش الافتتاحي (الفكة الموجودة في الدرج قبل بدء البيع)</label>
          <div className="relative">
            <Banknote size={20} className="absolute right-4 top-1/2 -translate-y-1/2 text-foreground/50" />
            <input 
              type="number" 
              value={startingCash}
              onChange={e => setStartingCash(e.target.value)}
              className="w-full bg-background border border-border rounded-xl py-4 pr-12 pl-4 text-xl font-bold focus:ring-2 focus:ring-primary outline-none" 
              placeholder="0"
            />
          </div>
        </div>

        <button 
          onClick={handleOpenShift}
          disabled={loading || startingCash === ""}
          className="w-full py-4 bg-primary text-primary-foreground font-black text-lg rounded-xl shadow-sm hover:bg-primary/90 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
        >
          <Play size={20} fill="currentColor" />
          {loading ? "جاري الفتح..." : "فتح وردية جديدة"}
        </button>
      </div>
    </div>
  )
}
