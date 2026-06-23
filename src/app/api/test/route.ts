import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const items = await prisma.inventoryItem.findMany();
  const orders = await prisma.pOSOrder.findMany({
    include: { items: true }
  });
  
  return NextResponse.json({
    items: items.map(i => ({ name: i.name, cost: i.costPrice, price: i.price })),
    orders: orders.map(o => ({
      id: o.id,
      total: o.totalAmount,
      cost: o.totalCost,
      itemsCost: o.items.map(i => i.costPrice)
    }))
  });
}
