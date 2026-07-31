"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { EnrollmentStatus } from "@prisma/client"
import { auth } from "@/auth"
import { logAction } from "@/lib/audit"
import { verifyPermission } from "./users"
import { PERMISSIONS } from "@/lib/permissions"
import bcrypt from "bcryptjs"
import { evaluateEnrollment } from "@/lib/attendance/rules"
import { cairoDayKey, cairoDayOfWeek } from "@/lib/time"

export async function getEnrollments() {
  return await prisma.enrollment.findMany({
    include: {
      client: true,
      program: true,
      option: true,
      workshop: true,
      event: true,
      attendances: true
    },
    orderBy: { createdAt: 'desc' }
  })
}

export async function createEnrollment(data: {
  clientId: string
  programId?: string
  workshopId?: string
  eventId?: string
}) {
  await verifyPermission(PERMISSIONS.BOOK_ENROLLMENT)
  const session = await auth()

  const enrollment = await prisma.enrollment.create({
    data: {
      clientId: data.clientId,
      programId: data.programId,
      workshopId: data.workshopId,
      eventId: data.eventId,
      status: "PENDING",
      createdByUserId: session?.user?.id
    }
  })
  
  revalidatePath('/dashboard/reception')
  revalidatePath('/dashboard/programs')
  revalidatePath('/dashboard/events')
  revalidatePath('/dashboard/clients')
  
  return enrollment
}

export async function confirmEnrollment(id: string, paymentMethod: string, totalAmount: number, amountPaid: number) {
  await verifyPermission(PERMISSIONS.CONFIRM_ENROLLMENT)
  // Confirm and mark payment
  const enrollment = await prisma.enrollment.update({
    where: { id },
    data: {
      status: "CONFIRMED",
      paymentMethod,
      totalAmount,
      amountPaid
    },
    include: {
      program: true,
      workshop: true,
      event: true,
      client: true
    }
  })

  // Record Revenue Transaction
  let description = `اشتراك العميل ${enrollment.client.name} في `
  if (enrollment.program) description += `برنامج ${enrollment.program.name}`
  else if (enrollment.workshop) description += `ورشة ${enrollment.workshop.name}`
  else if (enrollment.event) description += `حفلة ${enrollment.event.name}`

  await prisma.transaction.create({
    data: {
      type: "REVENUE",
      amount: amountPaid,
      description
    }
  })

  await logAction("CONFIRM_ENROLLMENT", { enrollmentId: id, amountPaid, clientName: enrollment.client.name })

  revalidatePath('/dashboard/reception')
  revalidatePath('/dashboard/accounting')
  revalidatePath('/dashboard/clients')
  revalidatePath('/dashboard/users/analytics')
}

export async function cancelEnrollment(id: string) {
  await verifyPermission(PERMISSIONS.CANCEL_ENROLLMENT)
  await prisma.enrollment.update({
    where: { id },
    data: { status: "CANCELLED" }
  })
  await logAction("DELETE_ENROLLMENT", { enrollmentId: id })
  revalidatePath('/dashboard/reception')
  revalidatePath('/dashboard/clients')
  revalidatePath('/dashboard/users/analytics')
}

// ATTENDANCE

export async function recordAttendance(enrollmentId: string, isMakeup: boolean = false) {
  await verifyPermission(PERMISSIONS.RECORD_ATTENDANCE)
  const session = await auth()

  const enrollment = await prisma.enrollment.findUnique({
    where: { id: enrollmentId },
    include: {
      client: true,
      program: { include: { category: true } },
      option: { include: { schedules: true } },
      workshop: true,
      event: true,
      attendances: true
    }
  })

  if (!enrollment) throw new Error("الاشتراك غير موجود")
  
  const settings = await prisma.systemSettings.findUnique({
    where: { id: "default" }
  })

  const now = new Date()
  const state = evaluateEnrollment(enrollment, now, settings)
  const action = isMakeup ? "CHECK_IN_MAKEUP" : "CHECK_IN"

  if (!state.allowedActions.includes(action)) {
    const blocker = state.blockers[0]
    let errorMsg = "عملية الدخول مرفوضة بسبب القواعد المتبعة."
    if (blocker === "NOT_CONFIRMED") {
      errorMsg = "يجب تأكيد الدفع أولاً"
    } else if (blocker === "ALREADY_CHECKED_IN") {
      errorMsg = `تم تسجيل حضور ${isMakeup ? 'تعويضي' : 'أساسي'} لهذه المشتركة بالفعل اليوم`
    } else if (blocker === "SESSIONS_EXHAUSTED") {
      errorMsg = "لقد استنفذ المشترك جميع الحصص الأساسية للمستوى"
    }
    throw new Error(errorMsg)
  }

  const todayKey = cairoDayKey(now)
  const todayDayOfWeek = cairoDayOfWeek(now)

  // Link scheduleId if it exists today
  const matchedSchedule = enrollment.option?.schedules?.find(
    (s: any) => s.dayOfWeek === todayDayOfWeek
  )
  const scheduleId = matchedSchedule ? matchedSchedule.id : null
  const attendanceType = isMakeup ? "MAKEUP" : "REGULAR"

  await prisma.attendance.create({
    data: {
      enrollmentId,
      date: now,
      dayKey: todayKey,
      type: attendanceType,
      scheduleId,
      recordedByUserId: session?.user?.id,
      status: isMakeup ? "MAKEUP" : "ATTENDED",
      isMakeup: isMakeup
    }
  })

  await logAction("RECORD_ATTENDANCE", { enrollmentId, clientName: enrollment.client?.name, isMakeup })

  revalidatePath('/dashboard/reception')
  revalidatePath('/dashboard/clients')
}

// ADD PAYMENT (for remaining balance)
export async function addPayment(enrollmentId: string, amountToAdd: number) {
  await verifyPermission(PERMISSIONS.CONFIRM_ENROLLMENT)
  const enrollment = await prisma.enrollment.findUnique({
    where: { id: enrollmentId },
    include: { client: true, program: true, workshop: true, event: true }
  });
  
  if(!enrollment) throw new Error("Not found");

  const newPaid = (enrollment.amountPaid || 0) + amountToAdd;

  await prisma.enrollment.update({
    where: { id: enrollmentId },
    data: { amountPaid: newPaid }
  });

  // Record Transaction
  let description = `سداد متبقي اشتراك العميل ${enrollment.client.name} في `
  if (enrollment.program) description += `برنامج ${enrollment.program.name}`
  else if (enrollment.workshop) description += `ورشة ${enrollment.workshop.name}`
  else if (enrollment.event) description += `حفلة ${enrollment.event.name}`

  await prisma.transaction.create({
    data: {
      type: "REVENUE",
      amount: amountToAdd,
      description
    }
  });

  await logAction("ADD_PAYMENT", { enrollmentId, amountToAdd, clientName: enrollment.client.name })

  revalidatePath('/dashboard/reception')
  revalidatePath('/dashboard/accounting')
  revalidatePath('/dashboard/clients')
  revalidatePath('/dashboard/users/analytics')
}

export async function enrollClient(data: {
  clientId?: string
  newClient?: {
    name: string
    phone: string
    email?: string
    notes?: string
  }
  programId?: string
  optionId?: string
  workshopId?: string
  eventId?: string
  status: EnrollmentStatus
  paymentMethod?: string
  totalAmount: number
  amountPaid: number
  remainingSessions?: number
  startDate?: Date
  durationDays?: number
}) {
  await verifyPermission(PERMISSIONS.BOOK_ENROLLMENT)
  const session = await auth()
  
  let targetClientId = data.clientId

  // 1. Create client if new
  if (data.newClient) {
    const existing = await prisma.client.findFirst({
      where: { phone: data.newClient.phone }
    })
    if (existing) {
      throw new Error("رقم الهاتف مستخدم بالفعل مع عميلة أخرى")
    }
    
    const hashedPassword = await bcrypt.hash(data.newClient.phone, 10)
    const client = await prisma.client.create({
      data: {
        name: data.newClient.name,
        phone: data.newClient.phone,
        password: hashedPassword,
        email: data.newClient.email || null,
        notes: data.newClient.notes || null,
      }
    })
    targetClientId = client.id
    await logAction("CREATE_CLIENT", { clientId: client.id, name: client.name })
  }

  if (!targetClientId) {
    throw new Error("يجب تحديد عميلة")
  }

  // 2. Calculate Start & End Dates
  const start = data.startDate ? new Date(data.startDate) : new Date()
  let endDate = null
  let carriedSessions = 0

  if (data.programId && data.optionId) {
    const option = await prisma.programOption.findUnique({ where: { id: data.optionId } })
    const settings = await prisma.systemSettings.findUnique({ where: { id: "default" } })
    const duration = data.durationDays || option?.durationDays || settings?.membershipDurationDays || 30
    
    endDate = new Date(start)
    endDate.setDate(endDate.getDate() + duration)

    if (option && data.remainingSessions !== undefined) {
      const maxSessions = option.sessionsPerMonth
      carriedSessions = Math.max(0, maxSessions - data.remainingSessions)
    }
  } else if (data.workshopId) {
    const workshop = await prisma.workshop.findUnique({ where: { id: data.workshopId } })
    if (workshop) {
      endDate = new Date(workshop.endDate)
    }
  } else if (data.eventId) {
    const event = await prisma.event.findUnique({ where: { id: data.eventId } })
    if (event) {
      endDate = new Date(event.date)
    }
  }

  // 3. Create the enrollment
  const enrollment = await prisma.enrollment.create({
    data: {
      clientId: targetClientId,
      programId: data.programId || null,
      optionId: data.optionId || null,
      workshopId: data.workshopId || null,
      eventId: data.eventId || null,
      status: data.status,
      paymentMethod: data.paymentMethod || null,
      totalAmount: data.totalAmount,
      amountPaid: data.amountPaid || 0,
      startDate: start,
      endDate: endDate,
      carriedSessions: carriedSessions,
      createdByUserId: session?.user?.id
    },
    include: {
      client: true,
      program: true,
      workshop: true,
      event: true,
      option: true
    }
  })

  // 4. Create Transaction if CONFIRMED and paid amount > 0
  if (data.status === "CONFIRMED" && data.amountPaid > 0) {
    let description = `اشتراك العميل ${enrollment.client.name} في `
    if (enrollment.program) description += `برنامج ${enrollment.program.name}`
    else if (enrollment.workshop) description += `ورشة ${enrollment.workshop.name}`
    else if (enrollment.event) description += `حفلة ${enrollment.event.name}`

    await prisma.transaction.create({
      data: {
        type: "REVENUE",
        amount: data.amountPaid,
        description
      }
    })
  }

  await logAction("CONFIRM_ENROLLMENT", { enrollmentId: enrollment.id, amountPaid: data.amountPaid, clientName: enrollment.client.name })

  revalidatePath('/dashboard/reception')
  revalidatePath('/dashboard/accounting')
  revalidatePath('/dashboard/clients')
  revalidatePath('/dashboard/classes')
  revalidatePath('/dashboard/users/analytics')

  return enrollment
}

export async function updateRemainingSessions(enrollmentId: string, newRemainingSessions: number) {
  await verifyPermission(PERMISSIONS.RECORD_ATTENDANCE)
  
  const enrollment = await prisma.enrollment.findUnique({
    where: { id: enrollmentId },
    include: {
      option: true,
      client: true
    }
  })

  if (!enrollment || !enrollment.option) {
    throw new Error("الاشتراك غير موجود أو ليس برنامجاً تدريبياً")
  }

  const maxSessions = enrollment.option.sessionsPerMonth
  if (newRemainingSessions < 0 || newRemainingSessions > maxSessions) {
    throw new Error(`عدد الحصص المتبقية يجب أن يكون بين 0 و ${maxSessions}`)
  }

  // Count active regular check-ins
  const regularCount = await prisma.attendance.count({
    where: {
      enrollmentId,
      type: "REGULAR"
    }
  })

  const targetCarried = maxSessions - newRemainingSessions - regularCount
  if (targetCarried < 0) {
    throw new Error(`لا يمكن جعل الحصص المتبقية ${newRemainingSessions} لأن العميلة قامت بحضور ${regularCount} حصص أساسية بالفعل. الحصص المتبقية الممكنة كحد أقصى هي ${maxSessions - regularCount}`)
  }

  await prisma.enrollment.update({
    where: { id: enrollmentId },
    data: {
      carriedSessions: targetCarried
    }
  })

  await logAction("UPDATE_REMAINING_SESSIONS", { enrollmentId, clientName: enrollment.client.name, newRemainingSessions })

  revalidatePath('/dashboard/reception')
  revalidatePath('/dashboard/clients')
  revalidatePath('/dashboard/classes')
}

