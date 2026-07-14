"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { logAction } from "@/lib/audit"
import { verifyPermission } from "./users"
import { PERMISSIONS } from "@/lib/permissions"

// CATEGORIES

export async function getProgramCategories() {
  return await prisma.programCategory.findMany({
    orderBy: { name: 'asc' }
  })
}

export async function createProgramCategory(name: string, image?: string) {
  await verifyPermission(PERMISSIONS.MANAGE_PROGRAMS)
  const category = await prisma.programCategory.create({
    data: { name, image }
  })
  await logAction("CREATE_PROGRAM_CATEGORY", { categoryId: category.id, name, image })
  revalidatePath('/dashboard/programs')
  return category
}

export async function updateProgramCategory(id: string, name: string, image?: string) {
  await verifyPermission(PERMISSIONS.MANAGE_PROGRAMS)
  const category = await prisma.programCategory.update({
    where: { id },
    data: { name, image }
  })
  await logAction("UPDATE_PROGRAM_CATEGORY", { categoryId: id, name, image })
  revalidatePath('/dashboard/programs')
  return category
}

export async function deleteProgramCategory(id: string) {
  await verifyPermission(PERMISSIONS.MANAGE_PROGRAMS)
  const cat = await prisma.programCategory.findUnique({ where: { id } })
  await prisma.programCategory.delete({
    where: { id }
  })
  await logAction("DELETE_PROGRAM_CATEGORY", { categoryId: id, name: cat?.name })
  revalidatePath('/dashboard/programs')
}

// PROGRAMS

export async function getPrograms() {
  return await prisma.program.findMany({
    include: {
      category: true,
      options: {
        include: {
          schedules: true,
          _count: { select: { enrollments: true } }
        }
      },
      _count: {
        select: { enrollments: true }
      }
    },
    orderBy: { name: 'asc' }
  })
}

export type ProgramOptionData = {
  id?: string
  name: string
  price: number
  sessionsPerMonth: number
  capacity: number
  schedules: { dayOfWeek: number, startTime: string, endTime: string }[]
}

export async function createProgram(data: {
  categoryId: string
  name: string
  description?: string
  options: ProgramOptionData[]
}) {
  await verifyPermission(PERMISSIONS.MANAGE_PROGRAMS)
  const program = await prisma.program.create({
    data: {
      categoryId: data.categoryId,
      name: data.name,
      description: data.description,
      options: {
        create: data.options.map(opt => ({
          name: opt.name,
          price: opt.price,
          sessionsPerMonth: opt.sessionsPerMonth,
          capacity: opt.capacity,
          schedules: {
            create: opt.schedules
          }
        }))
      }
    }
  })
  await logAction("CREATE_PROGRAM", { programId: program.id, name: data.name })
  revalidatePath('/dashboard/programs')
  return program
}

export async function updateProgram(id: string, data: {
  categoryId: string
  name: string
  description?: string
  options: ProgramOptionData[]
}) {
  await verifyPermission(PERMISSIONS.MANAGE_PROGRAMS)
  
  // Update program fields
  await prisma.program.update({
    where: { id },
    data: {
      categoryId: data.categoryId,
      name: data.name,
      description: data.description,
    }
  })

  // Get existing options in database
  const existingOptions = await prisma.programOption.findMany({
    where: { programId: id }
  })

  // Options we want to keep
  const incomingOptionIds = data.options.map(opt => opt.id).filter(Boolean) as string[]

  // Options to delete
  const optionsToDelete = existingOptions.filter(opt => !incomingOptionIds.includes(opt.id))

  // Check if any option to delete has enrollments
  for (const optToDelete of optionsToDelete) {
    const enrollmentsCount = await prisma.enrollment.count({
      where: { optionId: optToDelete.id }
    })
    if (enrollmentsCount > 0) {
      throw new Error(`لا يمكن حذف خيار الاشتراك "${optToDelete.name}" لوجود اشتراكات مسجلة به. يمكنك تعديل خيار الاشتراك أو تركه دون حذفه.`)
    }
    // Delete the option and its schedules
    await prisma.programOption.delete({
      where: { id: optToDelete.id }
    })
  }

  // Update or Create incoming options
  for (const opt of data.options) {
    if (opt.id) {
      // Update existing option
      await prisma.programOption.update({
        where: { id: opt.id },
        data: {
          name: opt.name,
          price: opt.price,
          sessionsPerMonth: opt.sessionsPerMonth,
          capacity: opt.capacity,
          schedules: {
            deleteMany: {}, // Delete old schedules
            create: opt.schedules // Create new schedules
          }
        }
      })
    } else {
      // Create new option
      await prisma.programOption.create({
        data: {
          programId: id,
          name: opt.name,
          price: opt.price,
          sessionsPerMonth: opt.sessionsPerMonth,
          capacity: opt.capacity,
          schedules: {
            create: opt.schedules
          }
        }
      })
    }
  }

  await logAction("UPDATE_PROGRAM", { programId: id, name: data.name })
  revalidatePath('/dashboard/programs')
}

export async function deleteProgram(id: string) {
  await verifyPermission(PERMISSIONS.MANAGE_PROGRAMS)
  const program = await prisma.program.findUnique({ where: { id } })
  await prisma.program.delete({
    where: { id }
  })
  await logAction("DELETE_PROGRAM", { programId: id, name: program?.name })
  revalidatePath('/dashboard/programs')
}
