"use client"

import { useState } from "react"
import { returnPOSOrder } from "@/actions/pos"
import { RotateCcw } from "lucide-react"
import { useConfirm } from "@/components/ConfirmProvider"
import { toast } from "sonner"

export default function ReturnButton({ orderId }: { orderId: string }) {
  const [loading, setLoading] = useState(false)
  const confirm = useConfirm()

  const handleReturn = async () => {
    const ok = await confirm("هل أنت متأكد من إرجاع هذه الفاتورة بالكامل؟ سيتم إرجاع المنتجات للمخزون وخصم قيمتها من أرباح الوردية.")
    if (!ok) return
    
    setLoading(true)
    try {
      await returnPOSOrder(orderId)
      toast.success("تم إرجاع الفاتورة بنجاح")
    } catch (err: any) {
      toast.error(err.message || "حدث خطأ أثناء إرجاع الفاتورة")
    } finally {
      setLoading(false)
    }
  }

  return (
    <button 
      onClick={handleReturn}
      disabled={loading}
      className="p-2 text-red-500 hover:bg-red-50 rounded-xl transition-colors disabled:opacity-50"
      title="إرجاع الفاتورة (مرتجع)"
    >
      <RotateCcw size={18} />
    </button>
  )
}
