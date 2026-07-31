import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import { checkUserPermission, PERMISSIONS } from "@/lib/permissions"
import { evaluateEnrollment, pickRecommended } from "@/lib/attendance/rules"
import { cairoDayKey, cairoDayOfWeek } from "@/lib/time"

/**
 * Legacy API Shim for compatibility.
 * Resolves the client and confirms check-in for the recommended active subscription.
 */
export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "غير مصرح - الرجاء تسجيل الدخول" }, { status: 401 })
    }

    const currentUser = await prisma.user.findUnique({
      where: { id: session.user.id }
    })

    if (!currentUser || !currentUser.isActive) {
      return NextResponse.json({ error: "الحساب معطل أو غير موجود" }, { status: 403 })
    }

    const hasPermission = checkUserPermission(currentUser, PERMISSIONS.RECORD_ATTENDANCE)
    if (!hasPermission) {
      return NextResponse.json({ error: "عفواً، لا تملك صلاحية تسجيل حضور المشتركات" }, { status: 403 })
    }

    const { clientId } = await req.json()

    if (!clientId) {
      return NextResponse.json({ error: "لم يتم التعرف على المدخلات" }, { status: 400 })
    }

    // Find client
    const client = await prisma.client.findFirst({
      where: {
        OR: [
          { qrToken: clientId },
          { phone: clientId },
          { id: clientId }
        ]
      },
      include: {
        enrollments: {
          where: { status: "CONFIRMED" },
          include: {
            program: { include: { category: true } },
            option: { include: { schedules: true } },
            workshop: true,
            event: true,
            attendances: { orderBy: { date: 'desc' } }
          },
          orderBy: { createdAt: 'desc' }
        }
      }
    })

    if (!client) {
      return NextResponse.json({ error: "العميلة غير موجودة في النظام" }, { status: 404 })
    }

    if (client.enrollments.length === 0) {
      return NextResponse.json({ error: "العميلة لا تمتلك أي اشتراكات مؤكدة" }, { status: 400 })
    }

    const settings = await prisma.systemSettings.findUnique({
      where: { id: "default" }
    })

    // Evaluate states
    const now = new Date()
    const todayKey = cairoDayKey(now)
    const todayDayOfWeek = cairoDayOfWeek(now)

    const states = client.enrollments.map((e) => evaluateEnrollment(e, now, settings))
    const recommendedState = pickRecommended(states)

    if (!recommendedState) {
      return NextResponse.json({ error: "لا يوجد اشتراك متاح لتسجيل الحضور" }, { status: 400 })
    }

    // Pick action based on allowed actions
    let action: "CHECK_IN" | "CHECK_IN_MAKEUP" | "CHECK_IN_OFF_SCHEDULE" | null = null
    if (recommendedState.allowedActions.includes("CHECK_IN")) {
      action = "CHECK_IN"
    } else if (recommendedState.allowedActions.includes("CHECK_IN_MAKEUP")) {
      action = "CHECK_IN_MAKEUP"
    } else if (recommendedState.allowedActions.includes("CHECK_IN_OFF_SCHEDULE")) {
      action = "CHECK_IN_OFF_SCHEDULE"
    }

    if (!action) {
      // Return the first blocker error message
      const blocker = recommendedState.blockers[0]
      let errorMsg = "اشتراك العضوة غير فعال حالياً"
      if (blocker === "EXPIRED") errorMsg = "انتهت صلاحية الاشتراك"
      if (blocker === "SESSIONS_EXHAUSTED") errorMsg = "استنفدت جميع الحصص المتاحة"
      if (blocker === "PAYMENT_LIMIT") errorMsg = "نفدت الحصص المدفوعة! يرجى سداد المبلغ المتبقي."
      if (blocker === "ALREADY_CHECKED_IN") errorMsg = "تم تسجيل حضور المشتركة لهذا الاشتراك بالفعل اليوم"
      return NextResponse.json({ error: errorMsg }, { status: 400 })
    }

    // Process check-in
    const enrollmentId = recommendedState.enrollmentId
    const attendanceType = action === "CHECK_IN_MAKEUP" ? "MAKEUP" : action === "CHECK_IN_OFF_SCHEDULE" ? "OFF_SCHEDULE" : "REGULAR"

    const enrollment = client.enrollments.find(e => e.id === enrollmentId)
    const matchedSchedule = enrollment?.option?.schedules.find(
      (s: any) => s.dayOfWeek === todayDayOfWeek
    )
    const scheduleId = matchedSchedule ? matchedSchedule.id : null

    // Record attendance
    await prisma.attendance.create({
      data: {
        enrollmentId,
        date: now,
        dayKey: todayKey,
        type: attendanceType,
        scheduleId,
        recordedByUserId: currentUser.id,
        status: attendanceType === "MAKEUP" ? "MAKEUP" : "ATTENDED",
        isMakeup: attendanceType === "MAKEUP"
      }
    })

    // Calculate remaining sessions for legacy response
    const freshState = evaluateEnrollment(
      await prisma.enrollment.findUnique({
        where: { id: enrollmentId },
        include: {
          client: true,
          program: { include: { category: true } },
          option: { include: { schedules: true } },
          workshop: true,
          event: true,
          attendances: { orderBy: { date: 'desc' } }
        }
      }),
      now,
      settings
    )

    const itemName = enrollment?.program?.name || enrollment?.workshop?.name || enrollment?.event?.name || "اشتراك"

    return NextResponse.json({
      success: true,
      name: client.name,
      remaining: freshState.sessions.remaining,
      itemName
    })

  } catch (error: any) {
    console.error("Legacy Scan Shim Error: ", error)
    return NextResponse.json({ error: "حدث خطأ داخلي في الخادم" }, { status: 500 })
  }
}
