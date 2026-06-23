import { prisma } from "./prisma"
import { auth } from "@/auth"

export async function logAction(action: string, details?: any) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      console.warn("Audit Log: No user session found. Cannot log action:", action)
      return
    }

    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action,
        details: details ? details : null
      }
    })
  } catch (error) {
    console.error("Failed to create audit log:", error)
  }
}
