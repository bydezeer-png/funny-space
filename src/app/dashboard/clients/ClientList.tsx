"use client"

import { useState } from "react"
import Link from "next/link"
import { Phone, Search } from "lucide-react"

export default function ClientList({ initialClients }: { initialClients: any[] }) {
  const [searchTerm, setSearchTerm] = useState("")

  const filteredClients = initialClients.filter(client => 
    client.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    client.phone.includes(searchTerm)
  )

  return (
    <div className="bg-card rounded-[2rem] shadow-sm border border-border overflow-hidden">
      <div className="p-6 border-b border-border/50 bg-background/30">
        <div className="relative max-w-md">
          <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-foreground/40" size={20} />
          <input 
            type="text" 
            placeholder="ابحث بالاسم أو رقم الهاتف..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-background border border-border rounded-xl py-3 pr-12 pl-4 focus:border-primary outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium"
          />
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-right border-collapse">
          <thead>
            <tr className="bg-muted/30 text-foreground/70 border-b border-border/50">
              <th className="p-6 font-bold text-sm uppercase tracking-wider">الاسم</th>
              <th className="p-6 font-bold text-sm uppercase tracking-wider">رقم الهاتف</th>
              <th className="p-6 font-bold text-sm uppercase tracking-wider">الباقة الحالية</th>
              <th className="p-6 font-bold text-sm uppercase tracking-wider">تاريخ الانضمام</th>
            </tr>
          </thead>
          <tbody>
            {filteredClients.length === 0 ? (
              <tr>
                <td colSpan={4} className="p-16 text-center text-foreground/50 font-bold bg-background/10">
                  {searchTerm ? "لم يتم العثور على نتائج تطابق بحثك." : "لا يوجد عميلات حتى الآن. أضف عميلة جديدة للبدء. 💅"}
                </td>
              </tr>
            ) : (
              filteredClients.map(client => (
                <tr key={client.id} className="border-b border-border/30 hover:bg-muted/30 transition-colors group">
                  <td className="p-6 font-black text-foreground text-lg group-hover:text-primary transition-colors">
                    <Link href={`/dashboard/clients/${client.id}`} className="block w-full">
                      {client.name}
                    </Link>
                  </td>
                  <td className="p-6 text-foreground/80 font-medium">
                    <Link href={`/dashboard/clients/${client.id}`} className="flex items-center gap-2 mt-1 block w-full">
                      <div className="p-1.5 bg-secondary/10 text-secondary rounded-lg"><Phone size={14} /></div>
                      <span dir="ltr">{client.phone}</span>
                    </Link>
                  </td>
                  <td className="p-6">
                    <Link href={`/dashboard/clients/${client.id}`} className="block w-full">
                      {client.enrollments.length > 0 ? (
                        <span className="inline-flex items-center px-4 py-1.5 rounded-full text-xs font-black bg-primary/10 text-primary border border-primary/20 shadow-sm">
                          لديه {client.enrollments.length} حجز/اشتراك
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-4 py-1.5 rounded-full text-xs font-black bg-foreground/10 text-foreground/70 border border-border">
                          لا يوجد اشتراك
                        </span>
                      )}
                    </Link>
                  </td>
                  <td className="p-6 text-foreground/70 font-semibold">
                    <Link href={`/dashboard/clients/${client.id}`} className="block w-full">
                      {new Date(client.createdAt).toLocaleDateString('ar-EG')}
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
