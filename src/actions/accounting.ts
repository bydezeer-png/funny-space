"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { logAction } from "@/lib/audit"
import { verifyPermission } from "./users"
import { PERMISSIONS } from "@/lib/permissions"

export async function createExpense(formData: FormData) {
  await verifyPermission(PERMISSIONS.ADD_EXPENSE)
  const amount = parseFloat(formData.get("amount") as string)
  const category = formData.get("category") as string
  const description = formData.get("description") as string
  const dateStr = formData.get("date") as string

  if (isNaN(amount) || amount <= 0 || !category || !dateStr) {
    throw new Error("جميع الحقول المطلوبة يجب تعبئتها بشكل صحيح")
  }

  await prisma.$transaction([
    prisma.expense.create({
      data: {
        amount,
        category,
        description: description || null,
        date: new Date(dateStr),
      }
    }),
    prisma.transaction.create({
      data: {
        amount,
        type: "EXPENSE",
        description: `مصروفات [${category}]: ${description || ''}`,
      }
    })
  ])

  await logAction("CREATE_EXPENSE", { amount, category, description })

  revalidatePath("/dashboard/accounting")
  revalidatePath("/dashboard/users/analytics")
  redirect("/dashboard/accounting")
}

export async function getAccountingSummary() {
  await verifyPermission(PERMISSIONS.VIEW_REPORTS)
  const transactions = await prisma.transaction.findMany({
    orderBy: { createdAt: "desc" },
    take: 50
  })

  const expenses = await prisma.expense.findMany({
    orderBy: { date: "desc" },
    take: 50
  })

  let totalRevenue = 0
  let totalExpenses = 0

  const allTx = await prisma.transaction.findMany()
  allTx.forEach(tx => {
    if (tx.type === "REVENUE") totalRevenue += tx.amount
    else totalExpenses += tx.amount
  })

  return { transactions, expenses, totalRevenue, totalExpenses, netIncome: totalRevenue - totalExpenses }
}
