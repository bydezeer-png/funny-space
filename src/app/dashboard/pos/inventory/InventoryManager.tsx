"use client"

import { useState } from "react"
import { createInventoryItem, updateInventoryItem } from "@/actions/pos"
import { Search, Plus, Edit, Package, Save, X, AlertTriangle } from "lucide-react"

type Item = {
  id: string
  name: string
  description: string | null
  category: string
  barcode: string | null
  quantity: number
  costPrice: number
  price: number
}

export default function InventoryManager({ initialItems }: { initialItems: Item[] }) {
  const [items, setItems] = useState<Item[]>(initialItems)
  const [search, setSearch] = useState("")
  const [isAdding, setIsAdding] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    category: "SNACKS",
    barcode: "",
    quantity: "0",
    costPrice: "0",
    price: "0"
  })

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const filteredItems = items.filter(i => i.name.includes(search))

  const handleEditClick = (item: Item) => {
    setEditingId(item.id)
    setFormData({
      name: item.name,
      description: item.description || "",
      category: item.category,
      barcode: item.barcode || "",
      quantity: item.quantity.toString(),
      costPrice: item.costPrice.toString(),
      price: item.price.toString()
    })
    setIsAdding(false)
    setError("")
  }

  const handleAddClick = () => {
    setIsAdding(true)
    setEditingId(null)
    setFormData({
      name: "",
      description: "",
      category: "SNACKS",
      barcode: "",
      quantity: "0",
      costPrice: "0",
      price: "0"
    })
    setError("")
  }

  const handleCancel = () => {
    setIsAdding(false)
    setEditingId(null)
    setError("")
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      if (isAdding) {
        const newItem = await createInventoryItem({
          name: formData.name,
          description: formData.description,
          category: formData.category,
          barcode: formData.barcode,
          quantity: parseInt(formData.quantity),
          costPrice: parseFloat(formData.costPrice),
          price: parseFloat(formData.price)
        })
        setItems([newItem, ...items])
      } else if (editingId) {
        const updatedItem = await updateInventoryItem(editingId, {
          name: formData.name,
          description: formData.description,
          category: formData.category,
          barcode: formData.barcode,
          costPrice: parseFloat(formData.costPrice),
          price: parseFloat(formData.price)
        })
        setItems(items.map(i => i.id === editingId ? { ...i, ...updatedItem } : i))
      }
      handleCancel()
    } catch (err: any) {
      setError(err.message || "حدث خطأ أثناء الحفظ")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="relative w-full md:w-96">
          <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-foreground/50" size={20} />
          <input 
            type="text" 
            placeholder="ابحث عن منتج..." 
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-card border border-border rounded-xl py-3 pr-12 pl-4 focus:ring-2 focus:ring-primary outline-none transition-all shadow-sm"
          />
        </div>
        {!isAdding && !editingId && (
          <button 
            onClick={handleAddClick}
            className="flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-xl font-bold shadow-sm hover:bg-primary/90 transition-all w-full md:w-auto"
          >
            <Plus size={20} />
            <span>إضافة منتج جديد</span>
          </button>
        )}
      </div>

      {(isAdding || editingId) && (
        <div className="bg-card p-6 rounded-3xl shadow-sm border border-border animate-in fade-in slide-in-from-top-4">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-2xl font-black text-foreground flex items-center gap-2">
              {isAdding ? <Plus className="text-primary"/> : <Edit className="text-primary"/>}
              {isAdding ? "منتج جديد" : "تعديل المنتج"}
            </h3>
            <button onClick={handleCancel} className="p-2 hover:bg-background rounded-full transition-colors text-foreground/70">
              <X size={24} />
            </button>
          </div>

          {error && <div className="p-3 mb-4 bg-red-50 text-red-600 rounded-xl text-sm font-bold border border-red-100">{error}</div>}

          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-bold text-foreground/70 mb-2">اسم المنتج</label>
              <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full bg-background border border-border rounded-xl py-3 px-4 focus:ring-2 focus:ring-primary outline-none" />
            </div>
            
            <div>
              <label className="block text-sm font-bold text-foreground/70 mb-2">الفئة</label>
              <select value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} className="w-full bg-background border border-border rounded-xl py-3 px-4 focus:ring-2 focus:ring-primary outline-none">
                <option value="SNACKS">سناكس (مأكولات)</option>
                <option value="DRINKS">مشروبات</option>
                <option value="MERCH">بضائع (Merch)</option>
                <option value="OTHER">أخرى</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-bold text-foreground/70 mb-2">الباركود (اختياري)</label>
              <input type="text" value={formData.barcode} onChange={e => setFormData({...formData, barcode: e.target.value})} className="w-full bg-background border border-border rounded-xl py-3 px-4 focus:ring-2 focus:ring-primary outline-none" placeholder="مرر جهاز الباركود هنا" />
            </div>

            {isAdding && (
              <div>
                <label className="block text-sm font-bold text-foreground/70 mb-2">الكمية الافتتاحية</label>
                <input required type="number" value={formData.quantity} onChange={e => setFormData({...formData, quantity: e.target.value})} className="w-full bg-background border border-border rounded-xl py-3 px-4 focus:ring-2 focus:ring-primary outline-none" />
              </div>
            )}

            <div>
              <label className="block text-sm font-bold text-foreground/70 mb-2">سعر التكلفة (للشراء)</label>
              <input required type="number" step="0.01" value={formData.costPrice} onChange={e => setFormData({...formData, costPrice: e.target.value})} className="w-full bg-background border border-border rounded-xl py-3 px-4 focus:ring-2 focus:ring-primary outline-none" />
            </div>

            <div>
              <label className="block text-sm font-bold text-foreground/70 mb-2">سعر البيع (للعميل)</label>
              <input required type="number" step="0.01" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} className="w-full bg-background border border-border rounded-xl py-3 px-4 focus:ring-2 focus:ring-primary outline-none" />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-bold text-foreground/70 mb-2">الوصف (اختياري)</label>
              <textarea value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full bg-background border border-border rounded-xl py-3 px-4 focus:ring-2 focus:ring-primary outline-none h-24" />
            </div>

            <div className="md:col-span-2 flex justify-end gap-4 mt-4">
              <button type="button" onClick={handleCancel} className="px-6 py-3 font-bold text-foreground/70 hover:bg-background rounded-xl transition-all">إلغاء</button>
              <button type="submit" disabled={loading} className="flex items-center gap-2 bg-primary text-primary-foreground px-8 py-3 rounded-xl font-bold shadow-sm hover:bg-primary/90 transition-all disabled:opacity-50">
                <Save size={20} />
                {loading ? "جاري الحفظ..." : "حفظ المنتج"}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-card rounded-3xl shadow-sm border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right border-collapse">
            <thead>
              <tr className="bg-background/50 text-foreground/70 border-b border-border/50">
                <th className="p-6 font-bold text-sm uppercase tracking-wider">المنتج</th>
                <th className="p-6 font-bold text-sm uppercase tracking-wider">الباركود</th>
                <th className="p-6 font-bold text-sm uppercase tracking-wider">الفئة</th>
                <th className="p-6 font-bold text-sm uppercase tracking-wider">المخزون الحالي</th>
                <th className="p-6 font-bold text-sm uppercase tracking-wider">سعر التكلفة</th>
                <th className="p-6 font-bold text-sm uppercase tracking-wider">سعر البيع</th>
                <th className="p-6 font-bold text-sm uppercase tracking-wider">الربح المتوقع</th>
                <th className="p-6 font-bold text-sm uppercase tracking-wider">إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-12 text-center text-foreground/50 font-bold">
                    لا توجد منتجات مطابقة للبحث.
                  </td>
                </tr>
              ) : (
                filteredItems.map(item => (
                  <tr key={item.id} className="border-b border-border/30 hover:bg-card/5 transition-colors">
                    <td className="p-6 font-black text-foreground">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/10 rounded-lg text-primary"><Package size={18}/></div>
                        {item.name}
                        {item.quantity <= 5 && (
                          <span title="المخزون يوشك على النفاذ!" className="flex items-center gap-1 text-[10px] bg-red-100 text-red-600 px-2 py-0.5 rounded-full animate-pulse border border-red-200">
                            <AlertTriangle size={12} />
                            اطلب المزيد
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="p-6 text-foreground/50 font-medium font-mono text-sm">
                      {item.barcode || 'لا يوجد'}
                    </td>
                    <td className="p-6 text-foreground/80 font-medium">
                      <span className="bg-background px-3 py-1 rounded-full text-xs border border-border">{item.category}</span>
                    </td>
                    <td className="p-6 font-black">
                      <span className={item.quantity > 5 ? 'text-green-500' : 'text-red-500'}>{item.quantity}</span>
                    </td>
                    <td className="p-6 text-foreground/80 font-medium">{item.costPrice} ج.م</td>
                    <td className="p-6 text-primary font-black">{item.price} ج.م</td>
                    <td className="p-6 text-green-500 font-bold">+{item.price - item.costPrice} ج.م</td>
                    <td className="p-6">
                      <button onClick={() => handleEditClick(item)} className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors">
                        <Edit size={18} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
