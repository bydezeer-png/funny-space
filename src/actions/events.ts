"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { logAction } from "@/lib/audit"
import { verifyPermission } from "./users"
import { PERMISSIONS } from "@/lib/permissions"

// WORKSHOPS

export async function getWorkshops() {
  return await prisma.workshop.findMany({
    orderBy: { startDate: 'asc' },
    include: {
      _count: {
        select: { enrollments: true }
      }
    }
  })
}

export async function createWorkshop(data: {
  name: string
  description?: string
  instructor?: string
  price: number
  startDate: Date
  endDate: Date
  capacity: number
}) {
  await verifyPermission(PERMISSIONS.MANAGE_WORKSHOPS)
  const workshop = await prisma.workshop.create({
    data
  })
  await logAction("CREATE_WORKSHOP", { workshopId: workshop.id, name: data.name })
  revalidatePath('/dashboard/events')
  return workshop
}

export async function updateWorkshop(id: string, data: {
  name: string
  description?: string
  instructor?: string
  price: number
  startDate: Date
  endDate: Date
  capacity: number
}) {
  await verifyPermission(PERMISSIONS.MANAGE_WORKSHOPS)
  const workshop = await prisma.workshop.update({
    where: { id },
    data
  })
  await logAction("UPDATE_WORKSHOP", { workshopId: id, name: data.name })
  revalidatePath('/dashboard/events')
  return workshop
}

export async function deleteWorkshop(id: string) {
  await verifyPermission(PERMISSIONS.MANAGE_WORKSHOPS)
  const workshop = await prisma.workshop.findUnique({ where: { id } })
  await prisma.workshop.delete({ where: { id } })
  await logAction("DELETE_WORKSHOP", { workshopId: id, name: workshop?.name })
  revalidatePath('/dashboard/events')
}

// EVENTS

export async function getEvents() {
  return await prisma.event.findMany({
    orderBy: { date: 'asc' },
    include: {
      _count: {
        select: { enrollments: true }
      }
    }
  })
}

export async function createEvent(data: {
  name: string
  description?: string
  price: number
  date: Date
  capacity: number
}) {
  await verifyPermission(PERMISSIONS.MANAGE_EVENTS)
  const event = await prisma.event.create({
    data
  })
  await logAction("CREATE_EVENT", { eventId: event.id, name: data.name })
  revalidatePath('/dashboard/events')
  return event
}

export async function updateEvent(id: string, data: {
  name: string
  description?: string
  price: number
  date: Date
  capacity: number
}) {
  await verifyPermission(PERMISSIONS.MANAGE_EVENTS)
  const event = await prisma.event.update({
    where: { id },
    data
  })
  await logAction("UPDATE_EVENT", { eventId: id, name: data.name })
  revalidatePath('/dashboard/events')
  return event
}

export async function deleteEvent(id: string) {
  await verifyPermission(PERMISSIONS.MANAGE_EVENTS)
  const event = await prisma.event.findUnique({ where: { id } })
  await prisma.event.delete({ where: { id } })
  await logAction("DELETE_EVENT", { eventId: id, name: event?.name })
  revalidatePath('/dashboard/events')
}
