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
        spaceName: "Soly's Space",
        spaceDescription: "مساحتك الخاصة للبنات فقط للترفيه والتعلم والدراسة في بيئة مريحة وآمنة ✨",
        whatsappNumber: "",
        address: "",
        mapLink: "",
        paymentMethods: "",
        membershipDurationDays: 30,
        preventDoubleCheckIn: true,
        enablePublicBookings: true,
        instagramLink: "https://instagram.com",
        tiktokLink: "https://tiktok.com",
        maxFailedAttempts: 5,
        lockoutDurationMinutes: 15,
        showTestimonials: true,
        topAlertBanner: "🎉 Welcome to Soly's Space! Use code FIRST10 for 10% off your first booking!",
        showTopAlertBanner: true,
        heroTitle: "Welcome to Soly's Space ✨",
        heroSubtitle: "A safe, fun and empowering space for girls to explore their passions, build confidence and create unforgettable memories.",
        showHeroSection: true,
        showClassesSection: true,
        showPerksSection: true,
        showBookingSection: true,
        adminLoginSecret: "soly-admin"
      }
    })
  }
  return settings
}

export async function updateSystemSettings(data: {
  spaceName?: string
  spaceDescription?: string
  whatsappNumber?: string
  address?: string
  mapLink?: string
  paymentMethods?: string
  membershipDurationDays?: number
  preventDoubleCheckIn?: boolean
  enablePublicBookings?: boolean
  instagramLink?: string
  tiktokLink?: string
  maxFailedAttempts?: number
  lockoutDurationMinutes?: number
  showTestimonials?: boolean
  topAlertBanner?: string
  showTopAlertBanner?: boolean
  heroTitle?: string
  heroSubtitle?: string
  showHeroSection?: boolean
  showClassesSection?: boolean
  showPerksSection?: boolean
  showBookingSection?: boolean
  adminLoginSecret?: string
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
