"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import bcrypt from "bcryptjs"
import { logAction } from "@/lib/audit"
import { verifyPermission } from "./users"
import { PERMISSIONS } from "@/lib/permissions"
import { evaluateEnrollment } from "@/lib/attendance/rules"
import { renderQrDataUrl } from "@/lib/qr"
import { cairoDayKey } from "@/lib/time"

export async function createClient(formData: FormData) {
  await verifyPermission(PERMISSIONS.ADD_CLIENT)
  const name = formData.get("name") as string
  const phone = formData.get("phone") as string
  const email = formData.get("email") as string
  const notes = formData.get("notes") as string

  if (!name || !phone) {
    throw new Error("الاسم ورقم الهاتف مطلوبان")
  }

  // Set default password to phone number
  const hashedPassword = await bcrypt.hash(phone, 10)

  const client = await prisma.client.create({
    data: {
      name,
      phone,
      password: hashedPassword,
      email: email || null,
      notes: notes || null,
    },
  })

  await logAction("CREATE_CLIENT", { clientId: client.id, name })

  revalidatePath("/dashboard/clients")
  redirect("/dashboard/clients")
}

export async function getClients(limit = 100) {
  return await prisma.client.findMany({
    take: limit,
    orderBy: { createdAt: "desc" },
    include: {
      enrollments: {
        include: { program: true, workshop: true, event: true },
        where: { status: "CONFIRMED" }
      }
    }
  })
}

export async function getClientById(id: string) {
  const client = await prisma.client.findUnique({
    where: { id },
    include: {
      enrollments: {
        include: {
          program: { include: { category: true } },
          option: { include: { schedules: true } },
          workshop: true,
          event: true,
          attendances: { orderBy: { date: 'desc' } }
        },
        orderBy: { createdAt: 'desc' }
      },
      posOrders: {
        orderBy: { createdAt: 'desc' }
      }
    }
  })

  if (!client) return null

  const settings = await prisma.systemSettings.findUnique({
    where: { id: "default" }
  })

  // Evaluate scanState for each enrollment
  const now = new Date()
  const scanStates = client.enrollments.map(e => evaluateEnrollment(e, now, settings))

  // Compute LTV
  const enrollmentPaidSum = client.enrollments.reduce((sum, e) => sum + (e.amountPaid || 0), 0)
  const posPaidSum = client.posOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0)
  const lifetimeValue = enrollmentPaidSum + posPaidSum

  // Compute Outstanding Balance
  const outstandingBalance = client.enrollments.reduce((sum, e) => {
    if (e.status === "CANCELLED") return sum
    const due = (e.totalAmount || 0) - (e.amountPaid || 0)
    return sum + Math.max(0, due)
  }, 0)

  // Compute active subscriptions count
  const activeSubscriptions = client.enrollments.filter(e => e.status === "CONFIRMED" && !scanStates.find(s => s.enrollmentId === e.id)?.blockers.includes("EXPIRED")).length

  // Compute total sessions attended
  const totalSessionsAttended = client.enrollments.reduce((sum, e) => {
    return sum + e.attendances.filter((a: any) => a.type !== "IMPORTED").length
  }, 0)

  // Find last visit
  let lastVisitDate: Date | null = null
  client.enrollments.forEach(e => {
    e.attendances.forEach((a: any) => {
      if (a.type !== "IMPORTED" && (!lastVisitDate || a.date > lastVisitDate)) {
        lastVisitDate = a.date
      }
    })
  })
  const lastVisit = lastVisitDate ? cairoDayKey(lastVisitDate) : null

  // Risk Flag
  let riskFlag: "OK" | "AT_RISK" | "CHURNED" = "OK"
  if (lastVisitDate) {
    const diffDays = Math.ceil((now.getTime() - lastVisitDate.getTime()) / (1000 * 60 * 60 * 24))
    if (diffDays > 30) {
      riskFlag = "CHURNED"
    } else if (diffDays > 14) {
      riskFlag = "AT_RISK"
    }
  }

  // Generate QR code Data URL
  let qrSvgDataUrl = ""
  try {
    qrSvgDataUrl = await renderQrDataUrl(client.qrToken)
  } catch (err) {
    console.error(err)
  }

  // Formulate attendance timeline
  const timeline: any[] = []
  client.enrollments.forEach(e => {
    const itemName = e.program?.name || e.workshop?.name || e.event?.name || "اشتراك"
    e.attendances.forEach((a: any) => {
      if (a.type !== "IMPORTED") {
        let typeText = "حضور أساسي"
        if (a.type === "MAKEUP") typeText = "حضور تعويضي"
        if (a.type === "OFF_SCHEDULE") typeText = "حضور استثنائي"

        timeline.push({
          id: a.id,
          date: a.date,
          dayKey: a.dayKey,
          type: a.type,
          typeText,
          itemName,
          note: a.note
        })
      }
    })
  })
  timeline.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  return {
    ...client,
    kpis: {
      activeSubscriptions,
      totalSessionsAttended,
      lifetimeValue,
      outstandingBalance,
      lastVisit,
      riskFlag
    },
    scanStates,
    timeline,
    qrSvgDataUrl
  }
}

export async function updateClient(
  id: string,
  data: {
    name: string
    phone: string
    email?: string | null
    notes?: string | null
  }
) {
  await verifyPermission(PERMISSIONS.EDIT_CLIENT)
  if (!data.name || !data.phone) {
    throw new Error("الاسم ورقم الهاتف مطلوبان")
  }

  // Check if phone already exists for another client
  const existing = await prisma.client.findFirst({
    where: {
      phone: data.phone,
      id: { not: id }
    }
  })
  if (existing) {
    throw new Error("رقم الهاتف مستخدم بالفعل مع عميلة أخرى")
  }

  const client = await prisma.client.update({
    where: { id },
    data: {
      name: data.name,
      phone: data.phone,
      email: data.email || null,
      notes: data.notes || null,
    },
  })

  await logAction("UPDATE_CLIENT", { clientId: id, name: data.name })

  revalidatePath("/dashboard/clients")
  revalidatePath(`/dashboard/clients/${id}`)
  return { success: true, client }
}

export async function deleteClient(id: string) {
  await verifyPermission(PERMISSIONS.DELETE_CLIENT)
  try {
    const enrollments = await prisma.enrollment.findMany({
      where: { clientId: id },
      select: { id: true }
    })
    const enrollmentIds = enrollments.map(e => e.id)

    await prisma.attendance.deleteMany({
      where: { enrollmentId: { in: enrollmentIds } }
    })

    await prisma.enrollment.deleteMany({
      where: { clientId: id }
    })

    await prisma.pOSOrder.deleteMany({
      where: { clientId: id }
    })

    const client = await prisma.client.delete({
      where: { id }
    })

    await logAction("DELETE_CLIENT", { clientId: id, name: client.name })

    revalidatePath("/dashboard/clients")
    return { success: true }
  } catch (error: any) {
    console.error("Failed to delete client:", error)
    throw new Error(error.message || "فشل حذف العميلة")
  }
}

export async function searchClientsAction(query: string) {
  if (!query || query.trim().length < 2) {
    return []
  }
  return await prisma.client.findMany({
    where: {
      OR: [
        { name: { contains: query, mode: 'insensitive' } },
        { phone: { contains: query } }
      ]
    },
    take: 20,
    orderBy: { name: 'asc' }
  })
}


