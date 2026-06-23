"use client"

import React, { useState } from "react"
import { ArrowRight, Save, Receipt, Sparkles, AlertCircle } from "lucide-react"
import Link from "next/link"
import { createExpense } from "@/actions/accounting"

export default function NewExpenseForm() {
  const [category, setCategory] = useState("")
  const [amount, setAmount] = useState("")
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [description, setDescription] = useState("")
  
  const suggestions = [
    { label: "رواتب وأجور", value: "رواتب وأجور" },
    { label: "مشتريات بوفيه / كافيه", value: "مشتريات بوفيه" },
    { label: "أدوات ومستلزمات رياضية", value: "أدوات ومستلزمات رياضية" },
    { label: "أدوات رسم وفنون", value: "أدوات رسم وفنون" },
    { label: "صيانة وإصلاحات", value: "صيانة وإصلاحات" },
    { label: "كهرباء ومياه وغاز", value: "مرافق كهرباء ومياه" },
    { label: "إيجار المقر", value: "إيجار المقر" },
    { label: "دعاية وإعلان تسويق", value: "دعاية وتسويق" },
  ]

  const handleSelectSuggestion = (val: string) => {
    setCategory(val)
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 text-right">
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <Link 
          href="/dashboard/accounting" 
          className="p-3 bg-card hover:bg-pink-50/20 text-foreground border border-border rounded-2xl transition shadow-sm flex items-center gap-2 font-bold cursor-pointer"
        >
          <ArrowRight size={18} />
          العودة للماليات
        </Link>
        
        <h2 className="text-2xl font-black text-foreground flex items-center gap-2">
          تسجيل مصروفات جديدة
          <Receipt size={24} className="text-red-500" />
        </h2>
      </div>

      {/* Main Form Card */}
      <div className="bg-card p-8 rounded-[2.5rem] shadow-sm border border-border">
        <form action={createExpense} className="space-y-6">
          
          <div className="grid grid-cols-1 gap-6">
            
            {/* Category selection */}
            <div className="space-y-3">
              <label className="block text-sm font-black text-foreground">التصنيف (Category) *</label>
              
              <div className="relative">
                <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-foreground/40">
                  <Receipt size={18} />
                </div>
                <input 
                  type="text" 
                  name="category" 
                  required 
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full border border-border bg-background py-3.5 pl-4 pr-11 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary text-sm font-semibold transition text-right"
                  placeholder="مثال: رواتب، مشتريات خامات، كهرباء..."
                />
              </div>

              {/* Suggestions Grid */}
              <div className="space-y-2 pt-1">
                <span className="text-[10px] font-black text-foreground/40 flex items-center justify-end gap-1">
                  تصنيفات مقترحة سريعة
                  <Sparkles size={10} className="text-primary" />
                </span>
                <div className="flex flex-wrap gap-2 justify-end">
                  {suggestions.map((s, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleSelectSuggestion(s.value)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                        category === s.value 
                          ? "bg-primary text-white border-primary shadow-sm shadow-pink-200/20" 
                          : "bg-background text-foreground/75 border-border hover:border-primary/40"
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Amount input */}
            <div className="space-y-2">
              <label className="block text-sm font-black text-foreground">المبلغ (ج.م) *</label>
              <input 
                type="number" 
                name="amount" 
                required 
                min="0.01"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full text-left py-3.5 px-4 border border-border bg-background rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary text-base font-black transition dir-ltr"
                placeholder="0.00"
              />
            </div>

            {/* Date Picker */}
            <div className="space-y-2">
              <label className="block text-sm font-black text-foreground">تاريخ الحركة *</label>
              <input 
                type="date" 
                name="date" 
                required 
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full border border-border bg-background py-3.5 px-4 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary text-sm font-semibold transition text-left dir-ltr"
              />
            </div>

            {/* Description Textarea */}
            <div className="space-y-2">
              <label className="block text-sm font-black text-foreground">الوصف / البيان</label>
              <textarea 
                name="description" 
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full border border-border bg-background p-4 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary text-sm font-semibold transition resize-none text-right leading-relaxed"
                placeholder="تفاصيل إضافية عن المصروف (رقم الفاتورة، اسم المستلم، إلخ)..."
              ></textarea>
            </div>
          </div>

          {/* Submit Action */}
          <div className="pt-4 border-t border-border/50 flex justify-end">
            <button 
              type="submit" 
              className="w-full sm:w-auto flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white px-8 py-4 rounded-2xl font-black text-sm shadow-md hover:shadow-lg transition-all hover:scale-[1.02] active:scale-95 cursor-pointer"
            >
              <Save size={16} />
              <span>تسجيل المصروف</span>
            </button>
          </div>
          
        </form>
      </div>

    </div>
  )
}
