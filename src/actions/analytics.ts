"use server"

import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"

// Helper to check permission
async function checkReportPermission() {
  const session = await auth()
  if (!session?.user) throw new Error("غير مصرح")
  
  const user = await prisma.user.findUnique({ where: { id: session.user.id } })
  if (user?.role !== "ADMIN" && !user?.permissions.includes("CAN_VIEW_REPORTS")) {
    throw new Error("لا تملك صلاحية عرض التقارير")
  }
}

export async function getGlobalAnalytics(from?: Date, to?: Date) {
  await checkReportPermission()

  const dateFilter = from && to ? {
    createdAt: {
      gte: from,
      lte: to
    }
  } : {}

  const [totalRevenue, totalExpense] = await Promise.all([
    prisma.transaction.aggregate({
      _sum: { amount: true },
      where: { type: "REVENUE", ...dateFilter }
    }),
    prisma.transaction.aggregate({
      _sum: { amount: true },
      where: { type: "EXPENSE", ...dateFilter }
    })
  ])

  // Get daily breakdown for chart (last 30 days if no filter, or within range)
  const transactions = await prisma.transaction.findMany({
    where: dateFilter,
    orderBy: { createdAt: 'asc' },
    select: { amount: true, type: true, createdAt: true }
  })

  const revenue = totalRevenue._sum.amount || 0;
  const expense = totalExpense._sum.amount || 0;

  return {
    revenue,
    expense,
    netProfit: revenue - expense,
    transactions
  }
}

export async function getProgramsAnalytics(from?: Date, to?: Date) {
  await checkReportPermission()

  const dateFilter = from && to ? {
    createdAt: {
      gte: from,
      lte: to
    }
  } : {}

  const programs = await prisma.program.findMany({
    include: {
      enrollments: {
        where: { status: "CONFIRMED", ...dateFilter }
      }
    }
  })

  let totalRevenue = 0;
  const stats = programs.map(p => {
    const pRev = p.enrollments.reduce((sum, en) => sum + (en.amountPaid || 0), 0);
    totalRevenue += pRev;
    return {
      id: p.id,
      name: p.name,
      enrollmentsCount: p.enrollments.length,
      revenue: pRev
    }
  }).sort((a, b) => b.revenue - a.revenue)

  return {
    totalRevenue,
    programs: stats
  }
}

export async function getWorkshopsAnalytics(from?: Date, to?: Date) {
  await checkReportPermission()

  const dateFilter = from && to ? {
    createdAt: {
      gte: from,
      lte: to
    }
  } : {}

  const workshops = await prisma.workshop.findMany({
    include: {
      enrollments: {
        where: { status: "CONFIRMED", ...dateFilter }
      }
    }
  })

  let totalRevenue = 0;
  const stats = workshops.map(w => {
    const wRev = w.enrollments.reduce((sum, en) => sum + (en.amountPaid || 0), 0);
    totalRevenue += wRev;
    return {
      id: w.id,
      name: w.name,
      enrollmentsCount: w.enrollments.length,
      revenue: wRev
    }
  }).sort((a, b) => b.revenue - a.revenue)

  return {
    totalRevenue,
    workshops: stats
  }
}

export async function getEventsAnalytics(from?: Date, to?: Date) {
  await checkReportPermission()

  const dateFilter = from && to ? {
    createdAt: {
      gte: from,
      lte: to
    }
  } : {}

  const events = await prisma.event.findMany({
    include: {
      enrollments: {
        where: { status: "CONFIRMED", ...dateFilter }
      }
    }
  })

  let totalRevenue = 0;
  const stats = events.map(e => {
    const eRev = e.enrollments.reduce((sum, en) => sum + (en.amountPaid || 0), 0);
    totalRevenue += eRev;
    return {
      id: e.id,
      name: e.name,
      enrollmentsCount: e.enrollments.length,
      revenue: eRev
    }
  }).sort((a, b) => b.revenue - a.revenue)

  return {
    totalRevenue,
    events: stats
  }
}

export async function getPOSAnalytics(from?: Date, to?: Date) {
  await checkReportPermission()

  const dateFilter = from && to ? {
    createdAt: {
      gte: from,
      lte: to
    }
  } : {}

  const [salesAgg, returnsAgg, expensesAgg] = await Promise.all([
    prisma.pOSOrder.aggregate({
      _sum: { totalAmount: true, totalCost: true },
      where: { isReturned: false, ...dateFilter }
    }),
    prisma.pOSOrder.aggregate({
      _sum: { totalAmount: true },
      where: { isReturned: true, ...dateFilter }
    }),
    prisma.shiftExpense.aggregate({
      _sum: { amount: true },
      where: dateFilter
    })
  ])

  const sales = salesAgg._sum.totalAmount || 0;
  const cost = salesAgg._sum.totalCost || 0;
  const returns = returnsAgg._sum.totalAmount || 0;
  const expenses = expensesAgg._sum.amount || 0;

  // Best selling items
  const orderItems = await prisma.pOSOrderItem.findMany({
    where: {
      order: { isReturned: false, ...dateFilter }
    },
    include: { inventoryItem: true }
  })

  const itemStats: Record<string, { name: string, quantity: number, revenue: number }> = {};
  orderItems.forEach(item => {
    const id = item.inventoryItem.id;
    if (!itemStats[id]) {
      itemStats[id] = { name: item.inventoryItem.name, quantity: 0, revenue: 0 };
    }
    itemStats[id].quantity += item.quantity;
    itemStats[id].revenue += (item.quantity * item.sellPrice);
  });

  const bestSellers = Object.values(itemStats).sort((a, b) => b.quantity - a.quantity).slice(0, 5);

  return {
    totalSales: sales,
    totalCost: cost,
    netSales: sales - cost,
    totalReturns: returns,
    totalExpenses: expenses,
    bestSellers
  }
}
