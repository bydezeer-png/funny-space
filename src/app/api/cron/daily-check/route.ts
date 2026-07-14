import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(request: Request) {
  // Verify Cron authorization secret
  const authHeader = request.headers.get("authorization")
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}` && process.env.NODE_ENV === "production") {
    return new Response("Unauthorized", { status: 401 })
  }

  try {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    let expiredCount = 0

    // 1. Process expirations for CONFIRMED enrollments
    const activeEnrollments = await prisma.enrollment.findMany({
      where: { status: "CONFIRMED" },
      include: {
        option: true,
        workshop: true,
        event: true,
        attendances: true
      }
    })

    for (const enrollment of activeEnrollments) {
      let isExpired = false

      if (enrollment.workshop) {
        // If workshop ended
        if (enrollment.workshop.endDate < today) {
          isExpired = true
        }
      } else if (enrollment.event) {
        // If event date passed
        if (enrollment.event.date < today) {
          isExpired = true
        }
      } else if (enrollment.option) {
        // If program membership expired (more than 30 days old)
        const daysOld = Math.floor((today.getTime() - enrollment.createdAt.getTime()) / (1000 * 60 * 60 * 24))
        if (daysOld > 30) {
          isExpired = true
        }
        // OR if all sessions are consumed
        const regularAttendances = enrollment.attendances.filter(a => !a.isMakeup).length
        if (regularAttendances >= enrollment.option.sessionsPerMonth) {
          isExpired = true
        }
      }

      if (isExpired) {
        await prisma.enrollment.update({
          where: { id: enrollment.id },
          data: { status: "CANCELLED" } // Mark as inactive/ended
        })
        expiredCount++
      }
    }

    // 2. Fetch daily financial summary
    const todayRevenueAgg = await prisma.transaction.aggregate({
      where: {
        createdAt: { gte: today },
        type: "REVENUE"
      },
      _sum: { amount: true }
    })
    const todayRevenue = todayRevenueAgg._sum.amount || 0

    const todayExpenseAgg = await prisma.transaction.aggregate({
      where: {
        createdAt: { gte: today },
        type: "EXPENSE"
      },
      _sum: { amount: true }
    })
    const todayExpenses = todayExpenseAgg._sum.amount || 0
    const netIncome = todayRevenue - todayExpenses

    // 3. Log daily summary inside audit logs under the first admin user
    const adminUser = await prisma.user.findFirst({
      where: { role: "ADMIN" }
    })

    const summaryDetails = {
      date: today.toLocaleDateString("ar-EG"),
      todayRevenue,
      todayExpenses,
      netIncome,
      expiredEnrollmentsCount: expiredCount
    }

    if (adminUser) {
      await prisma.auditLog.create({
        data: {
          userId: adminUser.id,
          action: "DAILY_CRON_SUMMARY",
          details: summaryDetails
        }
      })
    }

    return NextResponse.json({
      success: true,
      message: "Daily cron tasks executed successfully.",
      data: summaryDetails
    })

  } catch (error: any) {
    console.error("Cron Job Error: ", error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
