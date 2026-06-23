const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  const items = await prisma.inventoryItem.findMany()
  console.log("Inventory Items:", items.map(i => ({ name: i.name, costPrice: i.costPrice, price: i.price })))

  const orders = await prisma.pOSOrder.findMany()
  console.log("Recent Orders:", orders.slice(-3).map(o => ({ totalAmount: o.totalAmount, totalCost: o.totalCost })))
}

main().catch(console.error).finally(() => prisma.$disconnect())
