"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import bcrypt from "bcryptjs"
import { logAction } from "@/lib/audit"
import { verifyPermission } from "./users"
import { PERMISSIONS } from "@/lib/permissions"

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
  return await prisma.client.findUnique({
    where: { id },
    include: {
      enrollments: {
        include: { program: true, workshop: true, event: true, attendances: true },
        orderBy: { createdAt: 'desc' }
      }
    }
  })
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


