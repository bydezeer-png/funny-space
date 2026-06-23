"use server"

import { prisma } from "@/lib/prisma"
import { verifyPermission } from "./users"
import { PERMISSIONS } from "@/lib/permissions"
import { revalidatePath } from "next/cache"
import { logAction } from "@/lib/audit"

export async function getSystemSettings() {
  const settings = await prisma.systemSettings.findUnique({
    where: { id: "default" }
  })
  if (!settings) {
    return await prisma.systemSettings.create({
      data: {
        id: "default",
        whatsappNumber: "",
        address: "",
        mapLink: "",
        paymentMethods: ""
      }
    })
  }
  return settings
}

export async function updateSystemSettings(data: {
  whatsappNumber?: string
  address?: string
  mapLink?: string
  paymentMethods?: string
}) {
  // Using MANAGE_USERS as the de-facto admin permission for now
  await verifyPermission(PERMISSIONS.MANAGE_USERS)
  
  const settings = await prisma.systemSettings.upsert({
    where: { id: "default" },
    update: data,
    create: { id: "default", ...data }
  })
  
  await logAction("UPDATE_SETTINGS", { data })
  revalidatePath("/dashboard/settings")
  revalidatePath("/")
  
  return settings
}
