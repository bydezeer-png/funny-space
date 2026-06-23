"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { EnrollmentStatus } from "@prisma/client"
import { auth } from "@/auth"
import { logAction } from "@/lib/audit"
import { verifyPermission } from "./users"
import { PERMISSIONS } from "@/lib/permissions"

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
