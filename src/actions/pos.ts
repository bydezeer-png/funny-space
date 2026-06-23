"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { auth } from "@/auth"
import { logAction } from "@/lib/audit"
import { verifyPermission } from "./users"
import { PERMISSIONS } from "@/lib/permissions"

export async function getInventoryItems() {
  return await prisma.inventoryItem.findMany({
    orderBy: { createdAt: 'desc' }
  })
}

export async function createInventoryItem(data: {
  name: string
  description?: string
  category: string
  barcode?: string
  quantity: number
  costPrice: number
  price: number
}) {
  await verifyPermission(PERMISSIONS.MANAGE_INVENTORY)
  const item = await prisma.inventoryItem.create({
    data: {
      name: data.name,
      description: data.description,
      category: data.category,
      barcode: data.barcode || null,
      quantity: data.quantity,
      costPrice: data.costPrice,
      price: data.price
    }
  })
  
  await logAction("CREATE_INVENTORY_ITEM", { itemId: item.id, name: data.name })

  revalidatePath('/dashboard/pos/inventory')
  return item
}

export async function updateInventoryItem(id: string, data: {
  name: string
  description?: string
  category: string
  barcode?: string
  costPrice: number
  price: number
}) {
  await verifyPermission(PERMISSIONS.MANAGE_INVENTORY)
  const item = await prisma.inventoryItem.update({
    where: { id },
    data: {
      name: data.name,
      description: data.description,
      category: data.category,
      barcode: data.barcode || null,
      costPrice: data.costPrice,
      price: data.price
    }
  })
  
  await logAction("UPDATE_INVENTORY_ITEM", { itemId: id, name: data.name })

  revalidatePath('/dashboard/pos/inventory')
  return item
}

export async function restockInventory(id: string, quantityToAdd: number, totalCost: number) {
  await verifyPermission(PERMISSIONS.MANAGE_INVENTORY)
  // Use a transaction to update inventory and record the expense
  await prisma.$transaction(async (tx) => {
    // Fetch the existing item to calculate WAC
    const existingItem = await tx.inventoryItem.findUnique({ where: { id } })
    if (!existingItem) throw new Error("المنتج غير موجود")

    const currentStock = existingItem.quantity
    const currentCostPrice = existingItem.costPrice

    // Weighted Average Cost Calculation
    const currentValue = currentStock * currentCostPrice
    const newValue = currentValue + totalCost
    const newStock = currentStock + quantityToAdd
    const newCostPrice = newStock > 0 ? newValue / newStock : 0
    const newCostPriceValue = Number(newCostPrice.toFixed(2))

    const item = await tx.inventoryItem.update({
      where: { id },
      data: {
        quantity: newStock,
        costPrice: newCostPriceValue
      }
    })

    await tx.transaction.create({
      data: {
        type: "EXPENSE",
        amount: totalCost,
        description: `شراء مخزون: ${quantityToAdd} ${item.name} بمتوسط تكلفة جديد ${newCostPrice.toFixed(2)} ج.م`
      }
    })
  })

  await logAction("RESTOCK_INVENTORY", { inventoryId: id, quantityAdded: quantityToAdd, totalCost })

  revalidatePath('/dashboard/pos')
  revalidatePath('/dashboard/pos/buy')
  revalidatePath('/dashboard/pos/inventory')
  revalidatePath('/dashboard/accounting')
}

export async function getClientsForPOS() {
  return await prisma.client.findMany({
    select: { id: true, name: true, phone: true },
    orderBy: { createdAt: 'desc' }
  })
}

export async function createPOSOrder(data: {
  items: { id: string, quantity: number, price: number }[],
  paymentMethod: string,
  clientId?: string,
  discount?: number
}) {
  await verifyPermission(PERMISSIONS.SELL_POS)
  const { items, paymentMethod, clientId } = data;
  const discount = data.discount || 0;
  
  const session = await auth()

  // Validate quantities and fetch latest cost prices
  let totalCost = 0;
  const processedItems: { id: string; quantity: number; sellPrice: number; costPrice: number }[] = [];

  for (const item of items) {
    const inventoryItem = await prisma.inventoryItem.findUnique({ where: { id: item.id } })
    if (!inventoryItem || inventoryItem.quantity < item.quantity) {
      throw new Error(`الكمية غير متوفرة للمنتج: ${inventoryItem?.name || item.id}`)
    }
    
    const itemCostPrice = inventoryItem.costPrice;
    totalCost += itemCostPrice * item.quantity;
    
    processedItems.push({
      id: item.id,
      quantity: item.quantity,
      sellPrice: item.price,
      costPrice: itemCostPrice // Accurate WAC at the moment of sale
    });
  }

  const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0)
  const totalAmount = Math.max(0, subtotal - discount)

  // Get current active shift
  const shift = await prisma.pOSShift.findFirst({
    where: { closedAt: null },
    orderBy: { openedAt: 'desc' }
  })

  if (!shift) {
    throw new Error("لا توجد وردية مفتوحة. يرجى فتح وردية أولاً.")
  }

  // Create order and transaction atomically
  const result = await prisma.$transaction(async (tx) => {
    // Create POS Order
    const order = await tx.pOSOrder.create({
      data: {
        totalAmount,
        totalCost,
        discount,
        paymentMethod,
        clientId: clientId || null,
        shiftId: shift.id,
        createdByUserId: session?.user?.id,
        items: {
          create: processedItems.map(item => ({
            inventoryItemId: item.id,
            quantity: item.quantity,
            sellPrice: item.sellPrice,
            costPrice: item.costPrice
          }))
        }
      }
    })

    // (Dynamically calculated in getCurrentShift instead of mutating expectedCash here)

    // Deduct inventory
    for (const item of processedItems) {
      await tx.inventoryItem.update({
        where: { id: item.id },
        data: {
          quantity: { decrement: item.quantity }
        }
      })
    }

    // Record Revenue
    await tx.transaction.create({
      data: {
        type: "REVENUE",
        amount: totalAmount,
        description: `مبيعات كاشير (POS) - طلب رقم #${order.id.slice(-5)}`
      }
    })
    
    return order
  })

  await logAction("CREATE_POS_ORDER", { orderId: result.id, totalAmount })

  revalidatePath('/dashboard/pos')
  revalidatePath('/dashboard/pos/inventory')
  revalidatePath('/dashboard/pos/reports')
  revalidatePath('/dashboard/accounting')
}

export async function returnPOSOrder(orderId: string) {
  await verifyPermission(PERMISSIONS.RETURN_ORDER)
  const result = await prisma.$transaction(async (tx) => {
    const order = await tx.pOSOrder.findUnique({
      where: { id: orderId },
      include: { items: true }
    })

    if (!order || order.isReturned) throw new Error("الطلب غير موجود أو تم إرجاعه مسبقاً")

    await tx.pOSOrder.update({
      where: { id: orderId },
      data: { isReturned: true }
    })

    for (const item of order.items) {
      await tx.inventoryItem.update({
        where: { id: item.inventoryItemId },
        data: { quantity: { increment: item.quantity } }
      })
    }
    
    // Reverse Revenue
    await tx.transaction.create({
      data: {
        type: "EXPENSE",
        amount: order.totalAmount,
        description: `إرجاع مبيعات كاشير (POS) - طلب رقم #${order.id.slice(-5)}`
      }
    })
    
    return order
  })

  await logAction("RETURN_POS_ORDER", { orderId, totalAmount: result.totalAmount })
  
  revalidatePath('/dashboard/pos')
  revalidatePath('/dashboard/pos/inventory')
  revalidatePath('/dashboard/pos/reports')
  revalidatePath('/dashboard/accounting')
  revalidatePath('/dashboard/users/analytics')
}

export async function getPOSReports() {
  const orders = await prisma.pOSOrder.findMany({
    where: { isReturned: false },
    orderBy: { createdAt: 'desc' },
    include: {
      items: {
        include: {
          inventoryItem: true
        }
      },
      shift: true,
      client: true
    }
  })

  // Enhance orders with a reliable totalCost
  const enhancedOrders = orders.map(o => {
    let reliableCost = o.totalCost;
    if (!reliableCost || reliableCost === 0) {
      reliableCost = o.items.reduce((sum, item) => sum + ((item.costPrice || item.inventoryItem?.costPrice || 0) * item.quantity), 0);
    }
    return { ...o, reliableCost };
  });

  const totalSales = enhancedOrders.reduce((sum, o) => sum + o.totalAmount, 0)
  const totalCost = enhancedOrders.reduce((sum, o) => sum + o.reliableCost, 0)
  const netProfit = totalSales - totalCost

  // Group by payment method
  const salesByMethod = {
    CASH: enhancedOrders.filter(o => o.paymentMethod === 'CASH').reduce((sum, o) => sum + o.totalAmount, 0),
    CARD: enhancedOrders.filter(o => o.paymentMethod === 'CARD').reduce((sum, o) => sum + o.totalAmount, 0),
    WALLET: enhancedOrders.filter(o => o.paymentMethod === 'WALLET').reduce((sum, o) => sum + o.totalAmount, 0),
  }

  // Generate chart data (last 7 days)
  const chartData = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    d.setHours(0, 0, 0, 0)
    
    const nextDay = new Date(d)
    nextDay.setDate(nextDay.getDate() + 1)
    
    const dayOrders = enhancedOrders.filter(o => new Date(o.createdAt) >= d && new Date(o.createdAt) < nextDay)
    const sales = dayOrders.reduce((sum, o) => sum + o.totalAmount, 0)
    const profit = dayOrders.reduce((sum, o) => sum + (o.totalAmount - o.reliableCost), 0)
    
    chartData.push({
      date: d.toLocaleDateString('ar-EG', { weekday: 'short', day: 'numeric' }),
      sales,
      profit
    })
  }

  // Purchases Log (Inventory restocks via Transaction model or just Expenses)
  const purchases = await prisma.transaction.findMany({
    where: { type: 'EXPENSE' },
    orderBy: { createdAt: 'desc' }
  })

  return {
    orders: enhancedOrders,
    totalSales,
    totalCost,
    netProfit,
    salesByMethod,
    chartData,
    purchases
  }
}

export async function addShiftExpense(shiftId: string, amount: number, description: string) {
  await verifyPermission(PERMISSIONS.ADD_EXPENSE)
  const shift = await prisma.pOSShift.findUnique({ where: { id: shiftId } })
  if (!shift) throw new Error("الوردية غير موجودة")

  await prisma.$transaction([
    prisma.shiftExpense.create({
      data: { amount, description, shiftId }
    }),
    prisma.pOSShift.update({
      where: { id: shiftId },
      data: { expectedCash: { decrement: amount } }
    }),
    prisma.transaction.create({
      data: {
        type: "EXPENSE",
        amount,
        description: `مصروفات وردية كاشير: ${description}`
      }
    })
  ])
  
  revalidatePath('/dashboard/pos')
  revalidatePath('/dashboard/accounting')
}

// ----------------------------------------------------------------------
// SHIFT MANAGEMENT
// ----------------------------------------------------------------------

export async function getCurrentShift() {
  const shift = await prisma.pOSShift.findFirst({
    where: { closedAt: null },
    orderBy: { openedAt: 'desc' },
    include: { orders: { where: { isReturned: false } }, expenses: true }
  })

  if (!shift) return null;

  // Calculate sum of cash sales explicitly (ignoring returned orders)
  const cashSalesAgg = await prisma.pOSOrder.aggregate({
    _sum: { totalAmount: true },
    where: { shiftId: shift.id, paymentMethod: 'CASH', isReturned: false }
  })
  const cashSales = cashSalesAgg._sum.totalAmount || 0;

  const cardSalesAgg = await prisma.pOSOrder.aggregate({
    _sum: { totalAmount: true },
    where: { shiftId: shift.id, paymentMethod: 'CARD', isReturned: false }
  })
  const cardSales = cardSalesAgg._sum.totalAmount || 0;

  const walletSalesAgg = await prisma.pOSOrder.aggregate({
    _sum: { totalAmount: true },
    where: { shiftId: shift.id, paymentMethod: 'WALLET', isReturned: false }
  })
  const walletSales = walletSalesAgg._sum.totalAmount || 0;

  const totalExpensesAgg = await prisma.shiftExpense.aggregate({
    _sum: { amount: true },
    where: { shiftId: shift.id }
  })
  const totalExpenses = totalExpensesAgg._sum.amount || 0;

  // expectedCash in DB acts as startingCash.
  const startingCash = shift.expectedCash;
  const currentExpectedCash = startingCash + cashSales - totalExpenses;

  return {
    ...shift,
    startingCash,
    expectedCash: currentExpectedCash, // Override DB value with dynamic calculation
    expectedCard: cardSales,
    expectedWallet: walletSales,
    totalExpenses
  }
}

export async function openShift(openedBy: string, startingCash: number) {
  await verifyPermission(PERMISSIONS.OPEN_CLOSE_SHIFT)
  const activeShift = await getCurrentShift()
  if (activeShift) {
    throw new Error("هناك وردية مفتوحة بالفعل، الرجاء إغلاقها أولاً.")
  }

  const shift = await prisma.pOSShift.create({
    data: {
      openedBy,
      expectedCash: startingCash, // starting cash in drawer
    }
  })

  await logAction("OPEN_SHIFT", { shiftId: shift.id, startingCash })

  revalidatePath('/dashboard/pos/shift')
  revalidatePath('/dashboard/pos')
  return shift
}

export async function closeShift(shiftId: string, actualCash: number, notes?: string) {
  await verifyPermission(PERMISSIONS.OPEN_CLOSE_SHIFT)
  const shift = await prisma.pOSShift.update({
    where: { id: shiftId },
    data: {
      closedAt: new Date(),
      actualCash,
      notes
    }
  })

  await logAction("CLOSE_SHIFT", { shiftId, actualCash, notes })

  revalidatePath('/dashboard/pos/shift')
  revalidatePath('/dashboard/pos')
  return shift
}
