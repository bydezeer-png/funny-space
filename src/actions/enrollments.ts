"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { EnrollmentStatus } from "@prisma/client"
import { auth } from "@/auth"
import { logAction } from "@/lib/audit"
import { verifyPermission } from "./users"
import { PERMISSIONS } from "@/lib/permissions"
import bcrypt from "bcryptjs"

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
  const enrollment = await prisma.enrollment.findUnique({
    where: { id: enrollmentId },
    include: { attendances: true, program: true, option: true, client: true }
  })

  if (!enrollment) throw new Error("الاشتراك غير موجود")
  if (enrollment.status !== "CONFIRMED") throw new Error("يجب تأكيد الدفع أولاً")

  // Prevent duplicate attendance on the same calendar day
  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)
  const todayEnd = new Date()
  todayEnd.setHours(23, 59, 59, 999)

  const existingAttendanceToday = enrollment.attendances.find(a => {
    const d = new Date(a.date)
    return d >= todayStart && d <= todayEnd && a.isMakeup === isMakeup
  })

  if (existingAttendanceToday) {
    throw new Error(`تم تسجيل حضور ${isMakeup ? 'تعويضي' : 'أساسي'} لهذه المشتركة بالفعل اليوم`)
  }

  // If it's a program, validate max sessions and payment-based access
  if (enrollment.program) {
    const regularAttendances = enrollment.attendances.filter(a => !a.isMakeup).length
    const makeupAttendances = enrollment.attendances.filter(a => a.isMakeup).length
    
    const price = enrollment.option ? enrollment.option.price : 0;
    const maxSessions = enrollment.option ? enrollment.option.sessionsPerMonth : 8;

    // 1. Partial Payment Logic (Access Control)
    const sessionPrice = (enrollment.totalAmount || price) / maxSessions;
    const allowedSessions = Math.floor((enrollment.amountPaid || 0) / sessionPrice);

    if (!isMakeup && regularAttendances >= allowedSessions) {
      throw new Error(`نفدت الحصص المدفوعة! العميلة دفعت ${enrollment.amountPaid} ج.م ومسموح لها بـ ${allowedSessions} حصص فقط. الرجاء سداد المبلغ المتبقي (${(enrollment.totalAmount || price) - (enrollment.amountPaid || 0)} ج.م) للسماح بالدخول.`);
    }

    // 2. Max Program Sessions Logic
    if (!isMakeup && regularAttendances >= maxSessions) {
      throw new Error(`لقد استنفذ المشترك جميع الحصص الأساسية للمستوى (${maxSessions})`)
    }

    if (isMakeup && makeupAttendances >= 1) { // 1 makeup per month
      throw new Error("لا يمكن تعويض أكثر من حصة واحدة")
    }
  }

  await prisma.attendance.create({
    data: {
      enrollmentId,
      date: new Date(),
      status: "ATTENDED",
      isMakeup
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

  // 2. Create the enrollment
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

  // 3. Create dummy attendances if remainingSessions is specified and less than option.sessionsPerMonth
  if (data.programId && data.optionId && data.remainingSessions !== undefined) {
    const option = enrollment.option
    if (option) {
      const maxSessions = option.sessionsPerMonth
      const remaining = data.remainingSessions
      if (remaining < maxSessions) {
        const dummyCount = maxSessions - remaining
        const dummyAttendances = []
        for (let i = 0; i < dummyCount; i++) {
          dummyAttendances.push({
            enrollmentId: enrollment.id,
            date: new Date(Date.now() - (i + 1) * 24 * 60 * 60 * 1000), // historical dates
            status: "IMPORTED",
            isMakeup: false
          })
        }
        if (dummyAttendances.length > 0) {
          await prisma.attendance.createMany({
            data: dummyAttendances
          })
        }
      }
    }
  }

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
      attendances: true,
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

  const regularAttendances = enrollment.attendances.filter(a => !a.isMakeup && a.status !== "IMPORTED")
  const importedAttendances = enrollment.attendances.filter(a => a.status === "IMPORTED")

  const targetUsedSessions = maxSessions - newRemainingSessions
  const requiredImportedCount = targetUsedSessions - regularAttendances.length

  if (requiredImportedCount < 0) {
    throw new Error(`لا يمكن جعل الحصص المتبقية ${newRemainingSessions} لأن العميلة قامت بحضور ${regularAttendances.length} حصص أساسية بالفعل. الحصص المتبقية الممكنة كحد أقصى هي ${maxSessions - regularAttendances.length}`)
  }

  // Adjust imported attendances
  const currentImportedCount = importedAttendances.length
  
  if (requiredImportedCount > currentImportedCount) {
    // Add more imported attendances
    const toAddCount = requiredImportedCount - currentImportedCount
    const dummyAttendances = []
    for (let i = 0; i < toAddCount; i++) {
      dummyAttendances.push({
        enrollmentId,
        date: new Date(Date.now() - (i + 1) * 24 * 60 * 60 * 1000),
        status: "IMPORTED",
        isMakeup: false
      })
    }
    await prisma.attendance.createMany({
      data: dummyAttendances
    })
  } else if (requiredImportedCount < currentImportedCount) {
    // Delete some imported attendances
    const toDeleteCount = currentImportedCount - requiredImportedCount
    const toDeleteIds = importedAttendances.slice(0, toDeleteCount).map(a => a.id)
    await prisma.attendance.deleteMany({
      where: { id: { in: toDeleteIds } }
    })
  }

  await logAction("UPDATE_REMAINING_SESSIONS", { enrollmentId, clientName: enrollment.client.name, newRemainingSessions })

  revalidatePath('/dashboard/reception')
  revalidatePath('/dashboard/clients')
  revalidatePath('/dashboard/classes')
}

