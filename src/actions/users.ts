"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { Role } from "@prisma/client"
import bcrypt from "bcryptjs"
import { auth } from "@/auth"
import { logAction } from "@/lib/audit"
import { PERMISSIONS, PermissionValue } from "@/lib/permissions"

// Helper to verify permission on server actions
export async function verifyPermission(requiredPermission?: PermissionValue) {
  const session = await auth()
  if (!session?.user) throw new Error("غير مصرح")
  
  const currentUser = await prisma.user.findUnique({
    where: { id: session.user.id }
  })
  
  if ((currentUser?.role as string) === "ADMIN") return currentUser; // Admins can do anything
  
  if (requiredPermission && !currentUser?.permissions.includes(requiredPermission)) {
    throw new Error(`عفواً، لا تملك الصلاحية المطلوبة (${requiredPermission}) لإجراء هذه العملية`)
  }
  
  if (!requiredPermission && (currentUser?.role as string) !== "ADMIN") {
     throw new Error("عفواً، لا تملك صلاحية مدير النظام لإجراء هذا التعديل")
  }
  
  return currentUser;
}

export async function getUsers() {
  await verifyPermission(PERMISSIONS.MANAGE_USERS)
  return await prisma.user.findMany({
    orderBy: { createdAt: 'desc' }
  })
}

export async function createUser(data: {
  name: string
  email: string
  password?: string
  role: Role
  permissions: string[]
}) {
  await verifyPermission(PERMISSIONS.MANAGE_USERS)
  
  // Ensure email is unique
  const existing = await prisma.user.findUnique({ where: { email: data.email } })
  if (existing) throw new Error("هذا البريد الإلكتروني مستخدم بالفعل")

  let hashedPassword = ""
  if (data.password) {
    hashedPassword = await bcrypt.hash(data.password, 10)
  } else {
    // Default password if none provided
    hashedPassword = await bcrypt.hash("123456", 10)
  }

  const user = await prisma.user.create({
    data: {
      name: data.name,
      email: data.email,
      password: hashedPassword,
      role: data.role,
      permissions: data.permissions,
      isActive: true
    }
  })

  await logAction("CREATE_USER", { targetUserId: user.id, name: user.name, role: user.role })
  revalidatePath('/dashboard/users')
  return user
}

export async function updateUser(id: string, data: {
  name?: string
  email?: string
  password?: string
  role?: Role
  permissions?: string[]
}) {
  await verifyPermission(PERMISSIONS.MANAGE_USERS)
  
  const updateData: any = {}
  if (data.name) updateData.name = data.name
  if (data.email) updateData.email = data.email
  if (data.role) updateData.role = data.role
  if (data.permissions) updateData.permissions = data.permissions
  
  if (data.password) {
    updateData.password = await bcrypt.hash(data.password, 10)
  }

  const user = await prisma.user.update({
    where: { id },
    data: updateData
  })

  await logAction("UPDATE_USER", { targetUserId: user.id, name: user.name, changes: Object.keys(updateData) })
  revalidatePath('/dashboard/users')
  return user
}

export async function toggleUserStatus(id: string) {
  await verifyPermission(PERMISSIONS.MANAGE_USERS)
  
  const user = await prisma.user.findUnique({ where: { id } })
  if (!user) throw new Error("المستخدم غير موجود")
  
  // Prevent admin from deactivating themselves
  const session = await auth()
  if (session?.user?.id === id) {
    throw new Error("لا يمكنك حظر حسابك الشخصي")
  }

  const newStatus = !user.isActive
  await prisma.user.update({
    where: { id },
    data: { isActive: newStatus }
  })

  await logAction("TOGGLE_USER_STATUS", { targetUserId: user.id, newStatus })
  revalidatePath('/dashboard/users')
}

export async function deleteUser(id: string) {
  await verifyPermission("CAN_MANAGE_USERS")
  
  const session = await auth()
  if (session?.user?.id === id) {
    throw new Error("لا يمكنك حذف حسابك الشخصي")
  }
  
  const user = await prisma.user.findUnique({ where: { id } })

  await prisma.user.delete({
    where: { id }
  })

  await logAction("DELETE_USER", { targetUserId: id, name: user?.name })
  revalidatePath('/dashboard/users')
}
