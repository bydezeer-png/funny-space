import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import { checkUserPermission, PERMISSIONS } from "@/lib/permissions"
import { evaluateEnrollment } from "@/lib/attendance/rules"
import { cairoDayKey, cairoDayOfWeek } from "@/lib/time"
import crypto from "crypto"

const SECRET = process.env.AUTH_SECRET || "funny-space-super-secret-key-123"

function verifyNonce(nonce: string, clientId: string): boolean {
  try {
    const parts = nonce.split(":")
    if (parts.length !== 3) return false
    const [cId, expiresAtStr, signature] = parts
    if (cId !== clientId) return false
    const expiresAt = parseInt(expiresAtStr)
    if (Date.now() > expiresAt) return false
    
    const data = `${cId}:${expiresAt}`
    const expectedSignature = crypto.createHmac("sha256", SECRET).update(data).digest("hex")
    return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))
  } catch {
    return false
  }
}

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

    const { scanNonce, enrollmentId, action, note } = await req.json()

    if (!enrollmentId || !action) {
      return NextResponse.json({ error: "المدخلات غير مكتملة" }, { status: 400 })
    }

    // Retrieve enrollment
    const enrollment = await prisma.enrollment.findUnique({
      where: { id: enrollmentId },
      include: {
        client: true,
        program: {
          include: { category: true }
        },
        option: {
          include: { schedules: true }
        },
        workshop: true,
        event: true,
        attendances: true
      }
    })

    if (!enrollment) {
      return NextResponse.json({ error: "الاشتراك غير موجود" }, { status: 404 })
    }

    // Verify scanNonce
    if (!scanNonce || !verifyNonce(scanNonce, enrollment.clientId)) {
      return NextResponse.json({ error: "رمز المسح غير صالح أو منتهي الصلاحية. الرجاء إعادة مسح الكود." }, { status: 400 })
    }

    // Capture Cairo date and time context
    const now = new Date()
    const todayKey = cairoDayKey(now)
    const todayDayOfWeek = cairoDayOfWeek(now)

    // Check-in action mapping
    let attendanceType: "REGULAR" | "MAKEUP" | "OFF_SCHEDULE" = "REGULAR"
    if (action === "CHECK_IN_MAKEUP") {
      attendanceType = "MAKEUP"
    } else if (action === "CHECK_IN_OFF_SCHEDULE") {
      attendanceType = "OFF_SCHEDULE"
    }

    // Transaction execution
    const result = await prisma.$transaction(async (tx) => {
      // 1. Re-query within transaction to prevent race conditions (and lock row if necessary)
      const freshEnrollment = await tx.enrollment.findUnique({
        where: { id: enrollmentId },
        include: {
          client: true,
          program: {
            include: { category: true }
          },
          option: {
            include: { schedules: true }
          },
          workshop: true,
          event: true,
          attendances: true
        }
      })

      if (!freshEnrollment) throw new Error("ENROLLMENT_NOT_FOUND")

      const settings = await tx.systemSettings.findUnique({
        where: { id: "default" }
      })

      // 2. Re-evaluate rules
      const state = evaluateEnrollment(freshEnrollment, now, settings)

      // 3. Verify action is allowed
      if (!state.allowedActions.includes(action)) {
        throw new Error(`ACTION_NOT_ALLOWED:${state.blockers.join(",")}`)
      }

      // 4. Double check unique constraint manually to return a clean error if database throws
      const alreadyExists = freshEnrollment.attendances.some(
        (a: any) => a.dayKey === todayKey && a.type === attendanceType
      )
      if (alreadyExists) {
        throw new Error("ALREADY_CHECKED_IN")
      }

      // 5. Link scheduleId if it exists today
      const matchedSchedule = freshEnrollment.option?.schedules.find(
        (s: any) => s.dayOfWeek === todayDayOfWeek
      )
      const scheduleId = matchedSchedule ? matchedSchedule.id : null

      // 6. Record attendance
      const attendance = await tx.attendance.create({
        data: {
          enrollmentId: freshEnrollment.id,
          date: now,
          dayKey: todayKey,
          type: attendanceType,
          scheduleId,
          recordedByUserId: currentUser.id,
          note: note || null,
          status: attendanceType === "MAKEUP" ? "MAKEUP" : "ATTENDED",
          isMakeup: attendanceType === "MAKEUP"
        }
      })

      // 7. Audit log creation
      await tx.auditLog.create({
        data: {
          userId: currentUser.id,
          action: "RECORD_ATTENDANCE",
          details: {
            attendanceId: attendance.id,
            enrollmentId: freshEnrollment.id,
            clientName: freshEnrollment.client.name,
            type: attendanceType,
            actionSource: "QR_SCANNER"
          }
        }
      })

      // 8. Re-query after inserting attendance to return updated state
      const updatedEnrollment = await tx.enrollment.findUnique({
        where: { id: enrollmentId },
        include: {
          client: true,
          program: {
            include: { category: true }
          },
          option: {
            include: { schedules: true }
          },
          workshop: true,
          event: true,
          attendances: true
        }
      })

      const updatedState = evaluateEnrollment(updatedEnrollment, now, settings)

      return {
        attendanceId: attendance.id,
        state: updatedState,
        clientName: freshEnrollment.client.name
      }
    })

    return NextResponse.json({
      success: true,
      attendanceId: result.attendanceId,
      state: result.state,
      clientName: result.clientName
    })

  } catch (error: any) {
    console.error("Confirm Scan Error: ", error)
    if (error.message && error.message.startsWith("ACTION_NOT_ALLOWED")) {
      const blockers = error.message.split(":")[1] || ""
      return NextResponse.json({ error: `عملية الدخول مرفوضة بسبب موانع: ${blockers}` }, { status: 422 })
    }
    if (error.message === "ALREADY_CHECKED_IN") {
      return NextResponse.json({ error: "تم تسجيل الدخول بالفعل اليوم لهذا الاشتراك" }, { status: 409 })
    }
    if (error.code === "P2002") {
      return NextResponse.json({ error: "تم تسجيل الدخول بالفعل اليوم لهذا الاشتراك" }, { status: 409 })
    }
    return NextResponse.json({ error: error.message || "حدث خطأ داخلي في الخادم" }, { status: 500 })
  }
}
