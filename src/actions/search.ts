"use server"

import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"

export type SearchResult = {
  id: string
  title: string
  subtitle: string
  type: 'CLIENT' | 'ORDER' | 'INVENTORY' | 'USER'
  url: string
}

export async function globalSearch(query: string): Promise<SearchResult[]> {
  const session = await auth()
  if (!session?.user) return []

  if (!query || query.length < 2) return []

  const results: SearchResult[] = []

  // 1. Search Clients
  const clients = await prisma.client.findMany({
    where: {
      OR: [
        { name: { contains: query, mode: 'insensitive' } },
        { phone: { contains: query } }
      ]
    },
    take: 5
  })
  clients.forEach(c => results.push({
    id: c.id,
    title: c.name,
    subtitle: `رقم الهاتف: ${c.phone}`,
    type: 'CLIENT',
    url: `/dashboard/clients/${c.id}`
  }))

  // 2. Search Inventory Items
  const items = await prisma.inventoryItem.findMany({
    where: {
      OR: [
        { name: { contains: query, mode: 'insensitive' } },
        { barcode: { contains: query } }
      ]
    },
    take: 3
  })
  items.forEach(i => results.push({
    id: i.id,
    title: i.name,
    subtitle: `الكمية المتاحة: ${i.quantity}`,
    type: 'INVENTORY',
    url: `/dashboard/pos/inventory`
  }))

  // 3. Search Users (Admin only)
  const currentUser = await prisma.user.findUnique({ where: { id: session.user.id } })
  if (currentUser?.role === 'ADMIN') {
    const users = await prisma.user.findMany({
      where: {
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { email: { contains: query, mode: 'insensitive' } }
        ]
      },
      take: 3
    })
    users.forEach(u => results.push({
      id: u.id,
      title: u.name,
      subtitle: `الدور: ${u.role}`,
      type: 'USER',
      url: `/dashboard/users`
    }))
  }

  return results
}
