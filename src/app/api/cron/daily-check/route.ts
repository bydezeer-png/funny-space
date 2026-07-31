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
    let completedCount = 0

    // 1. Process program membership expirations (bulk updates by endDate)
    const expiredResult = await prisma.enrollment.updateMany({
      where: {
        status: "CONFIRMED",
        endDate: { lt: today },
        programId: { not: null }
      },
      data: {
        status: "EXPIRED"
      }
    })
    expiredCount += expiredResult.count

    // 2. Process workshop and event expirations (mark as COMPLETED bulk update)
    const completedWorkshopsEvents = await prisma.enrollment.updateMany({
      where: {
        status: "CONFIRMED",
        OR: [
          { workshop: { endDate: { lt: today } } },
          { event: { date: { lt: today } } }
        ]
      },
      data: {
        status: "COMPLETED"
      }
    })
    completedCount += completedWorkshopsEvents.count

    // 3. Process completed program sessions (clients who consumed all sessions)
    const confirmedPrograms = await prisma.enrollment.findMany({
      where: {
        status: "CONFIRMED",
        programId: { not: null }
      },
      select: {
        id: true,
        carriedSessions: true,
        option: {
          select: {
            sessionsPerMonth: true
          }
        },
        _count: {
          select: {
            attendances: {
              where: {
                type: "REGULAR"
              }
            }
          }
        }
      }
    })

    const completedProgramIds: string[] = []
    for (const p of confirmedPrograms) {
      if (p.option) {
        const totalUsed = (p.carriedSessions || 0) + p._count.attendances
        if (totalUsed >= p.option.sessionsPerMonth) {
          completedProgramIds.push(p.id)
        }
      }
    }

    if (completedProgramIds.length > 0) {
      const completedProgramsResult = await prisma.enrollment.updateMany({
        where: {
          id: { in: completedProgramIds }
        },
        data: {
          status: "COMPLETED"
        }
      })
      completedCount += completedProgramsResult.count
    }

    // 4. Fetch daily financial summary
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

    // 5. Log daily summary inside audit logs under the first admin user
    const adminUser = await prisma.user.findFirst({
      where: { role: "ADMIN" }
    })

    const summaryDetails = {
      date: today.toLocaleDateString("ar-EG"),
      todayRevenue,
      todayExpenses,
      netIncome,
      expiredEnrollmentsCount: expiredCount,
      completedEnrollmentsCount: completedCount
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
      message: "Daily cron tasks executed successfully in bulk.",
      data: summaryDetails
    })

  } catch (error: any) {
    console.error("Cron Job Error: ", error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
