"use client"

import { useState } from "react"
import { restockInventory } from "@/actions/pos"
import { Search, PackagePlus, DollarSign } from "lucide-react"

type Item = {
  id: string
  name: string
  quantity: number
  category: string
}

export default function BuyStock({ items }: { items: Item[] }) {
  const [search, setSearch] = useState("")
  const [selectedItem, setSelectedItem] = useState<Item | null>(null)
  const [qtyToAdd, setQtyToAdd] = useState("")
  const [totalCost, setTotalCost] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  const filteredItems = items.filter(i => i.name.includes(search))

  const handleRestock = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedItem || !qtyToAdd || !totalCost) return
    
    setLoading(true)
    setError("")
    setSuccess("")
    
    try {
      await restockInventory(selectedItem.id, parseInt(qtyToAdd), parseFloat(totalCost))
      setSuccess(`تم إضافة ${qtyToAdd} وحدة إلى ${selectedItem.name} وتسجيل المصروف بنجاح.`)
      setSelectedItem(null)
      setQtyToAdd("")
      setTotalCost("")
    } catch (err: any) {
      setError(err.message || "حدث خطأ أثناء الإضافة")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col lg:flex-row gap-8">
      {/* Search & Select */}
      <div className="flex-1 bg-card rounded-3xl p-8 border border-border shadow-sm h-fit">
        <h3 className="text-2xl font-black text-foreground mb-6 flex items-center gap-2">
          <Search className="text-primary" /> اختر المنتج المراد تزويده
        </h3>
        
        <input 
          type="text" 
          placeholder="ابحث عن منتج..." 
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full bg-background border border-border rounded-xl py-3 px-4 focus:ring-2 focus:ring-primary outline-none transition-all shadow-sm mb-6"
        />

        <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
          {filteredItems.map(item => (
            <button 
              key={item.id}
              onClick={() => {
                setSelectedItem(item)
                setSuccess("")
                setError("")
              }}
              className={`w-full flex items-center justify-between p-4 rounded-2xl border transition-all ${selectedItem?.id === item.id ? 'border-primary bg-primary/5 shadow-sm' : 'border-border hover:border-primary/50'}`}
            >
              <div className="text-right">
                <h4 className="font-bold text-foreground">{item.name}</h4>
                <p className="text-sm font-medium text-foreground/60">{item.category}</p>
              </div>
              <div className="text-left">
                <span className="text-xs font-bold text-foreground/50 block">المخزون الحالي</span>
                <span className="font-black text-primary">{item.quantity}</span>
              </div>
            </button>
          ))}
          {filteredItems.length === 0 && (
            <p className="text-center text-foreground/50 font-bold py-8">لا يوجد منتج بهذا الاسم</p>
          )}
        </div>
      </div>

      {/* Restock Form */}
      <div className="flex-1 bg-card rounded-3xl p-8 border border-border shadow-sm h-fit">
        <h3 className="text-2xl font-black text-foreground mb-6 flex items-center gap-2">
          <PackagePlus className="text-primary" /> تفاصيل الشراء (فاتورة المورد)
        </h3>

        {error && <div className="p-4 mb-6 bg-red-50 text-red-600 rounded-xl text-sm font-bold border border-red-100">{error}</div>}
        {success && <div className="p-4 mb-6 bg-green-50 text-green-600 rounded-xl text-sm font-bold border border-green-100">{success}</div>}

        {selectedItem ? (
          <form onSubmit={handleRestock} className="space-y-6">
            <div className="p-4 bg-background border border-border rounded-xl flex justify-between items-center mb-6">
              <span className="font-bold text-foreground/70">المنتج المختار:</span>
              <span className="font-black text-lg text-primary">{selectedItem.name}</span>
            </div>

            <div>
              <label className="block text-sm font-bold text-foreground/70 mb-2">
                الكمية الجديدة (التي تم شراءها)
              </label>
              <input 
                type="number" 
                min="1"
                required
                value={qtyToAdd}
                onChange={e => setQtyToAdd(e.target.value)}
                className="w-full bg-background border border-border rounded-xl py-3 px-4 focus:ring-2 focus:ring-primary outline-none transition-all shadow-sm"
                placeholder="مثال: 50"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-foreground/70 mb-2">
                إجمالي التكلفة (لجميع الكمية)
              </label>
              <div className="relative">
                <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-foreground/50" size={20} />
                <input 
                  type="number" 
                  min="0"
                  step="0.01"
                  required
                  value={totalCost}
                  onChange={e => setTotalCost(e.target.value)}
                  className="w-full bg-background border border-border rounded-xl py-3 pr-4 pl-12 focus:ring-2 focus:ring-primary outline-none transition-all shadow-sm"
                  placeholder="مثال: 1500"
                />
              </div>
              <p className="text-xs text-foreground/50 font-bold mt-2">
                سيتم تسجيل هذا المبلغ كمصروفات في الحسابات العامة.
              </p>
            </div>

            <button 
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-primary text-primary-foreground font-black text-lg rounded-xl shadow-sm hover:bg-primary/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "جاري الحفظ..." : "تأكيد الإضافة وتحديث المخزون"}
            </button>
          </form>
        ) : (
          <div className="h-48 flex flex-col items-center justify-center text-foreground/40 font-bold border-2 border-dashed border-border rounded-2xl">
            <PackagePlus size={48} className="mb-4 opacity-50" />
            الرجاء اختيار منتج من القائمة أولاً
          </div>
        )}
      </div>
    </div>
  )
}
