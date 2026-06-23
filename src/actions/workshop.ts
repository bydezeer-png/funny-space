"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

export async function createWorkshop(formData: FormData) {
  const name = formData.get("name") as string
  const instructor = formData.get("instructor") as string
  const price = parseFloat(formData.get("price") as string)
  const capacity = parseInt(formData.get("capacity") as string, 10)
  const dateStr = formData.get("date") as string

  if (!name || isNaN(price) || isNaN(capacity) || !dateStr) {
    throw new Error("جميع الحقول مطلوبة")
  }

  const date = new Date(dateStr)

  await prisma.workshop.create({
    data: {
      name,
      instructor: instructor || null,
      price,
      capacity,
      startDate: date,
      endDate: date
    },
  })

  revalidatePath("/dashboard/workshops")
  redirect("/dashboard/workshops")
}

export async function getWorkshops() {
  return await prisma.workshop.findMany({
    orderBy: { startDate: "asc" },
    include: {
      _count: {
        select: { enrollments: true }
      }
    }
  })
}

// Note: bookWorkshop should be handled by createEnrollment and confirmEnrollment from enrollments.ts.
export async function deleteWorkshop(id: string) {
  await prisma.workshop.delete({ where: { id } })
  revalidatePath("/dashboard/workshops")
}
