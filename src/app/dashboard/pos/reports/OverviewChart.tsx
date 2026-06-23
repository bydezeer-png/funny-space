"use client"

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

export default function OverviewChart({ data }: { data: any[] }) {
  return (
    <div className="h-[400px] w-full" dir="ltr">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
          <XAxis dataKey="date" stroke="hsl(var(--foreground)/0.5)" fontSize={12} />
          <YAxis stroke="hsl(var(--foreground)/0.5)" fontSize={12} tickFormatter={(value) => `${value}`} />
          <Tooltip 
            cursor={{ fill: 'hsl(var(--foreground)/0.05)' }}
            contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '16px', color: 'hsl(var(--foreground))' }}
          />
          <Bar dataKey="sales" name="إجمالي المبيعات" fill="#10b981" radius={[4, 4, 0, 0]} />
          <Bar dataKey="profit" name="صافي الربح" fill="#3b82f6" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
