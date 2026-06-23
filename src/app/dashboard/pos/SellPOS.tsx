"use client"

import { useState, useRef, useEffect } from "react"
import { createPOSOrder } from "@/actions/pos"
import { Search, Plus, Minus, Trash2, ShoppingBag, CreditCard, ShoppingCart, User, Printer, CheckCircle, PauseCircle, PlayCircle, Percent } from "lucide-react"

type Item = {
  id: string
  name: string
  price: number
  costPrice: number
  quantity: number
  category: string
  barcode: string | null
}

type Client = {
  id: string
  name: string
  phone: string
}

export default function SellPOS({ items, clients }: { items: Item[], clients: Client[] }) {
  const [cart, setCart] = useState<{item: Item, qty: number}[]>([])
  const [search, setSearch] = useState("")
  const [paymentMethod, setPaymentMethod] = useState("CASH")
  const [clientId, setClientId] = useState("")
  const [discount, setDiscount] = useState<number>(0)
  const [discountInput, setDiscountInput] = useState("")
  const [heldOrders, setHeldOrders] = useState<any[]>([])
  const [showHeldOrders, setShowHeldOrders] = useState(false)
  
  // Custom states for category filtering and scanner focus tracking
  const [activeCategory, setActiveCategory] = useState("ALL")
  const [isSearchFocused, setIsSearchFocused] = useState(true)

  useEffect(() => {
    const saved = localStorage.getItem('funny_space_held_orders')
    if (saved) setHeldOrders(JSON.parse(saved))
  }, [])

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)
  const [lastOrderInfo, setLastOrderInfo] = useState<{total: number, items: any[], date: Date, method: string, discount: number} | null>(null)

  const searchInputRef = useRef<HTMLInputElement>(null)

  // Dynamically extract all unique categories from database items
  const categories = ["ALL", ...Array.from(new Set(items.map(i => i.category)))]

  // Filter items based on search text AND selected category tab
  const filteredItems = items.filter(i => {
    const matchesSearch = i.name.toLowerCase().includes(search.toLowerCase()) || 
                          (i.barcode && i.barcode.includes(search.trim()))
    const matchesCategory = activeCategory === "ALL" || i.category === activeCategory
    return matchesSearch && matchesCategory
  })

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && search.trim() !== '') {
      if (filteredItems.length === 1) {
        addToCart(filteredItems[0])
        setSearch("")
      } else {
        const exactMatch = items.find(i => i.barcode === search.trim())
        if (exactMatch) {
          addToCart(exactMatch)
          setSearch("")
        }
      }
    }
  }

  const addToCart = (item: Item) => {
    setCart(prev => {
      const existing = prev.find(p => p.item.id === item.id)
      if (existing) {
        if (existing.qty >= item.quantity) return prev
        return prev.map(p => p.item.id === item.id ? { ...p, qty: p.qty + 1 } : p)
      }
      if (item.quantity <= 0) return prev
      return [...prev, { item, qty: 1 }]
    })
  }

  const updateQty = (id: string, delta: number) => {
    setCart(prev => prev.map(p => {
      if (p.item.id === id) {
        const newQty = p.qty + delta
        if (newQty <= 0) return p
        if (newQty > p.item.quantity) return p
        return { ...p, qty: newQty }
      }
      return p
    }))
  }

  const removeFromCart = (id: string) => {
    setCart(prev => prev.filter(p => p.item.id !== id))
  }

  const total = cart.reduce((sum, p) => sum + (p.item.price * p.qty), 0)

  const handleCheckout = async () => {
    if (cart.length === 0) return
    setLoading(true)
    setError("")
    setSuccess(false)
    
    try {
      await createPOSOrder({
        items: cart.map(c => ({
          id: c.item.id,
          quantity: c.qty,
          price: c.item.price
        })),
        paymentMethod,
        clientId: clientId || undefined,
        discount
      })
      
      setLastOrderInfo({
        total: Math.max(0, total - discount),
        items: [...cart],
        date: new Date(),
        method: paymentMethod,
        discount
      })
      
      setSuccess(true)
      setCart([])
      setClientId("")
      setDiscount(0)
      setDiscountInput("")
    } catch (err: any) {
      setError(err.message || "حدث خطأ أثناء البيع")
    } finally {
      setLoading(false)
    }
  }

  const handleHoldOrder = () => {
    if (cart.length === 0) return
    const newHold = {
      id: Date.now().toString(),
      cart,
      clientId,
      paymentMethod,
      discount,
      date: new Date().toISOString()
    }
    const updated = [...heldOrders, newHold]
    setHeldOrders(updated)
    localStorage.setItem('funny_space_held_orders', JSON.stringify(updated))
    
    setCart([])
    setClientId("")
    setDiscount(0)
    setDiscountInput("")
  }

  const handleResumeOrder = (hold: any) => {
    setCart(hold.cart)
    setClientId(hold.clientId)
    setPaymentMethod(hold.paymentMethod)
    setDiscount(hold.discount)
    setDiscountInput(hold.discount ? hold.discount.toString() : "")
    
    const updated = heldOrders.filter(h => h.id !== hold.id)
    setHeldOrders(updated)
    localStorage.setItem('funny_space_held_orders', JSON.stringify(updated))
    setShowHeldOrders(false)
  }

  const printReceipt = () => {
    window.print()
  }

  if (success && lastOrderInfo) {
    return (
      <div className="bg-card p-12 rounded-3xl border border-border shadow-sm flex flex-col items-center justify-center text-center animate-in zoom-in-95 duration-500 text-right">
        <div className="w-24 h-24 bg-green-500/10 text-green-500 rounded-full flex items-center justify-center mb-6 mx-auto">
          <CheckCircle size={48} />
        </div>
        <h2 className="text-3xl font-black text-foreground mb-2 text-center w-full">تم البيع بنجاح!</h2>
        <p className="text-foreground/70 font-medium mb-8 text-center w-full">تم تسجيل الفاتورة في النظام وخصم المنتجات من المخزون.</p>
        
        {/* Receipt printable area */}
        <div className="bg-background border border-border p-6 rounded-2xl w-full max-w-sm mb-8 print-area mx-auto">
          <div className="text-center mb-4 border-b border-border/50 pb-4">
            <h3 className="font-black text-xl mb-1">Soly's Space</h3>
            <p className="text-xs text-foreground/50">فاتورة كاشير</p>
            <p className="text-xs text-foreground/50">{lastOrderInfo.date.toLocaleString('ar-EG')}</p>
          </div>
          <div className="space-y-2 mb-4">
            {lastOrderInfo.items.map((c, i) => (
              <div key={i} className="flex justify-between text-sm">
                <span>{c.item.name} (x{c.qty})</span>
                <span className="font-bold">{c.item.price * c.qty} ج.م</span>
              </div>
            ))}
          </div>
          <div className="border-t border-border/50 pt-4 flex justify-between items-center font-black">
            <span>الإجمالي:</span>
            <span className="text-xl">{lastOrderInfo.total} ج.م</span>
          </div>
          {lastOrderInfo.discount > 0 && (
            <div className="flex justify-between items-center text-sm mt-1 text-foreground/70">
              <span>قيمة الخصم:</span>
              <span>{lastOrderInfo.discount} ج.م</span>
            </div>
          )}
          <div className="text-center mt-4 text-xs text-foreground/50">
            طريقة الدفع: {lastOrderInfo.method === 'CASH' ? 'كاش' : lastOrderInfo.method === 'CARD' ? 'بطاقة ائتمان' : 'محفظة إلكترونية'}
            <br/><br/>شكراً لزيارتكم!
          </div>
        </div>

        <div className="flex gap-4 mx-auto justify-center">
          <button onClick={printReceipt} className="bg-background border border-border text-foreground px-6 py-3 rounded-xl font-bold hover:bg-border/50 transition-colors flex items-center gap-2 cursor-pointer">
            <Printer size={20} />
            طباعة الفاتورة
          </button>
          <button onClick={() => setSuccess(false)} className="bg-primary text-primary-foreground px-8 py-3 rounded-xl font-bold hover:bg-primary/90 transition-colors cursor-pointer">
            فاتورة جديدة
          </button>
        </div>
        
        <style dangerouslySetInnerHTML={{__html: `
          @media print {
            body * { visibility: hidden; }
            .print-area, .print-area * { visibility: visible; }
            .print-area { position: absolute; left: 0; top: 0; width: 100%; max-width: 100%; border: none; padding: 0; box-shadow: none; }
          }
        `}} />
      </div>
    )
  }

  return (
    <div className="flex flex-col lg:flex-row gap-6 text-right">
      
      {/* Products Column */}
      <div className="flex-1 space-y-6">
        
        {/* Search bar & Barcode gun indicator */}
        <div className="space-y-3">
          <div className="flex justify-between items-center text-xs font-semibold">
            {isSearchFocused ? (
              <span className="text-green-500 bg-green-50 border border-green-100 px-3 py-1 rounded-xl flex items-center gap-1 animate-pulse">
                القارئ متصل وجاهز للمسح 🟢
              </span>
            ) : (
              <button 
                onClick={() => searchInputRef.current?.focus()}
                className="text-amber-500 bg-amber-50 border border-amber-100 px-3 py-1 rounded-xl flex items-center gap-1 animate-bounce cursor-pointer"
              >
                اضغطي لتنشيط قارئ الباركود ⚠️
              </button>
            )}
            <span className="text-foreground/50">البحث وقراءة المنتجات</span>
          </div>

          <div className="relative">
            <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-foreground/50" size={20} />
            <input 
              ref={searchInputRef}
              type="text" 
              placeholder="ابحث باسم المنتج أو وجه قارئ الباركود..." 
              value={search}
              onChange={e => setSearch(e.target.value)}
              onKeyDown={handleSearchKeyDown}
              onFocus={() => setIsSearchFocused(true)}
              onBlur={() => setIsSearchFocused(false)}
              className="w-full bg-card border border-border rounded-2xl py-3.5 pr-12 pl-4 focus:ring-2 focus:ring-primary outline-none transition-all shadow-sm text-right"
            />
          </div>
        </div>

        {/* Category Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-1 justify-end">
          {categories.map((cat, idx) => {
            const label = cat === "ALL" ? "الكل" : cat === "SNACKS" ? "وجبات خفيفة" : cat === "DRINKS" ? "مشروبات" : cat === "MERCH" ? "منتجات وهدايا" : cat
            return (
              <button
                key={idx}
                onClick={() => setActiveCategory(cat)}
                className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all border cursor-pointer shrink-0 ${
                  activeCategory === cat 
                    ? "bg-primary text-white border-primary shadow-sm shadow-pink-200/20" 
                    : "bg-card text-foreground/60 border-border hover:border-primary/40"
                }`}
              >
                {label}
              </button>
            )
          })}
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredItems.map(item => (
            <button 
              key={item.id}
              onClick={() => addToCart(item)}
              disabled={item.quantity <= 0}
              className={`bg-card p-4 rounded-2xl border ${item.quantity <= 0 ? 'border-red-200 opacity-50 cursor-not-allowed' : 'border-border hover:border-primary cursor-pointer'} text-right transition-all shadow-sm flex flex-col justify-between aspect-square`}
            >
              <div>
                <span className="text-[9px] font-black text-foreground/50 bg-background px-2.5 py-1 rounded-lg mb-2 inline-block border border-border/50">{item.category}</span>
                <h3 className="font-black text-foreground text-sm leading-snug mb-1">{item.name}</h3>
                <p className={`text-[10px] font-bold flex items-center gap-1 justify-end ${item.quantity > 5 ? 'text-green-500' : 'text-red-500'}`}>
                  المتبقي: {item.quantity}
                  {item.quantity <= 5 && <span className="animate-pulse w-2 h-2 rounded-full bg-red-500 inline-block mr-1"></span>}
                </p>
              </div>
              <div className="mt-2 flex items-center justify-between">
                <span className="text-primary font-black text-lg">{item.price} <span className="text-xs">ج.م</span></span>
                <ShoppingBag size={16} className="text-foreground/30" />
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Cart Summary Column */}
      <div className="w-full lg:w-[450px] flex-shrink-0 flex flex-col gap-4 h-[calc(100vh-200px)] sticky top-6">
        
        {/* Settings Panel */}
        <div className="bg-card rounded-3xl shadow-sm border border-border p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-foreground/70 mb-2">العميل (اختياري)</label>
              <div className="relative">
                <User size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground/50 pointer-events-none" />
                <select 
                  value={clientId} 
                  onChange={e => setClientId(e.target.value)}
                  className="w-full bg-background border border-border rounded-xl py-2.5 pr-9 pl-3 text-xs focus:ring-2 focus:ring-primary outline-none appearance-none cursor-pointer text-right"
                >
                  <option value="">عميل نقدي عام</option>
                  {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
            </div>
            
            <div>
              <label className="block text-xs font-bold text-foreground/70 mb-2">طريقة الدفع</label>
              <div className="relative">
                <CreditCard size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground/50 pointer-events-none" />
                <select 
                  value={paymentMethod} 
                  onChange={e => setPaymentMethod(e.target.value)}
                  className="w-full bg-background border border-border rounded-xl py-2.5 pr-9 pl-3 text-xs focus:ring-2 focus:ring-primary outline-none appearance-none cursor-pointer text-right"
                >
                  <option value="CASH">كاش (نقدي)</option>
                  <option value="CARD">بطاقة بنكية (فيزا)</option>
                  <option value="WALLET">محفظة إلكترونية</option>
                </select>
              </div>
            </div>
          </div>
          
          <div>
            <label className="block text-xs font-bold text-foreground/70 mb-2">إضافة خصم (ج.م)</label>
            <div className="relative">
              <Percent size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground/50 pointer-events-none" />
              <input 
                type="number"
                value={discountInput}
                onChange={(e) => {
                  setDiscountInput(e.target.value)
                  setDiscount(parseFloat(e.target.value) || 0)
                }}
                className="w-full bg-background border border-border rounded-xl py-2.5 pr-9 pl-3 text-xs focus:ring-2 focus:ring-primary outline-none text-right"
                placeholder="قيمة الخصم..."
              />
            </div>
            
            {/* Quick Discount Presets */}
            <div className="flex gap-1.5 mt-2 justify-end">
              {[5, 10, 20, 50].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => {
                    setDiscountInput(preset.toString())
                    setDiscount(preset)
                  }}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-black border transition-all cursor-pointer ${
                    discount === preset 
                      ? "bg-primary text-white border-primary" 
                      : "bg-background text-foreground/60 border-border hover:border-primary/45"
                  }`}
                >
                  {preset} ج.م
                </button>
              ))}
              {discount > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    setDiscountInput("")
                    setDiscount(0)
                  }}
                  className="px-2.5 py-1 rounded-lg text-[10px] font-black border border-red-100 bg-red-50 text-red-600 transition-all cursor-pointer"
                >
                  إلغاء الخصم
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Cart Summary */}
        <div className="flex-1 bg-card rounded-3xl shadow-sm border border-border p-6 flex flex-col min-h-0">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-black text-foreground flex items-center gap-2">
              <ShoppingCart className="text-primary" /> الفاتورة
            </h3>
            {heldOrders.length > 0 && (
              <div className="relative">
                <button 
                  onClick={() => setShowHeldOrders(!showHeldOrders)}
                  className="text-xs bg-orange-500/10 text-orange-500 font-bold px-3 py-1.5 rounded-lg flex items-center gap-1 cursor-pointer"
                >
                  <PauseCircle size={14} /> معلقة ({heldOrders.length})
                </button>
                {showHeldOrders && (
                  <div className="absolute left-0 top-full mt-2 w-64 bg-card border border-border shadow-lg rounded-xl p-2 z-50 max-h-48 overflow-y-auto">
                    {heldOrders.map((h) => (
                      <div key={h.id} className="flex justify-between items-center p-2 hover:bg-background rounded-lg border-b border-border/50 last:border-0">
                        <div>
                          <span className="text-xs font-bold block">منتجات: {h.cart.length}</span>
                          <span className="text-[10px] text-foreground/50">{new Date(h.date).toLocaleTimeString('ar-EG')}</span>
                        </div>
                        <button onClick={() => handleResumeOrder(h)} className="text-primary hover:bg-primary/10 p-1.5 rounded-md cursor-pointer">
                          <PlayCircle size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {error && <div className="p-3 mb-4 bg-red-50 text-red-600 rounded-xl text-xs font-bold border border-red-100">{error}</div>}

          <div className="flex-1 overflow-y-auto pr-2 space-y-4 mb-6">
            {cart.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-foreground/40 font-bold">
                <ShoppingBag size={48} className="mb-4 opacity-50" />
                لا توجد منتجات في الفاتورة
              </div>
            ) : (
              cart.map(c => (
                <div key={c.item.id} className="flex justify-between items-center bg-background p-3 rounded-xl border border-border">
                  <div className="flex-1 text-right">
                    <h4 className="font-bold text-foreground text-sm">{c.item.name}</h4>
                    <p className="text-primary font-black text-xs mt-0.5">{c.item.price} ج.م</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 bg-card border border-border rounded-lg p-1">
                      <button onClick={() => updateQty(c.item.id, -1)} className="p-1 hover:bg-background rounded-md text-foreground cursor-pointer"><Minus size={14}/></button>
                      <span className="font-bold w-4 text-center text-sm">{c.qty}</span>
                      <button onClick={() => updateQty(c.item.id, 1)} className="p-1 hover:bg-background rounded-md text-foreground cursor-pointer"><Plus size={14}/></button>
                    </div>
                    <button onClick={() => removeFromCart(c.item.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors cursor-pointer">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="border-t border-border pt-6">
            {discount > 0 && (
              <div className="flex justify-between items-end mb-2 text-foreground/50 line-through">
                <span className="text-sm font-bold">الإجمالي قبل الخصم:</span>
                <span className="text-lg font-black">{total} ج.م</span>
              </div>
            )}
            <div className="flex justify-between items-end mb-6">
              <span className="text-foreground/70 font-bold">الإجمالي المطلوب:</span>
              <span className="text-3xl font-black text-foreground">{Math.max(0, total - discount)} <span className="text-lg">ج.م</span></span>
            </div>
            
            <div className="flex gap-2">
              <button 
                onClick={handleHoldOrder}
                disabled={cart.length === 0 || loading}
                className="px-4 py-4 bg-orange-500/10 text-orange-600 font-bold text-sm rounded-xl hover:bg-orange-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center cursor-pointer"
                title="تعليق الفاتورة"
              >
                <PauseCircle size={20} />
              </button>
              <button 
                onClick={handleCheckout}
                disabled={cart.length === 0 || loading}
                className="flex-1 py-4 bg-primary text-primary-foreground font-black text-base rounded-xl shadow-sm hover:bg-primary/95 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
              >
                <Printer size={20} />
                {loading ? "جاري التأكيد..." : "دفع وإصدار الفاتورة"}
              </button>
            </div>
          </div>
        </div>
      </div>
      
    </div>
  )
}
