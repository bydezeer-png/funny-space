"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"

export async function getTestimonials(onlyActive: boolean = false) {
  try {
    return await prisma.testimonial.findMany({
      where: onlyActive ? { isActive: true } : {},
      orderBy: { createdAt: "desc" },
    })
  } catch (error) {
    console.error("Failed to fetch testimonials:", error)
    return []
  }
}

export async function createTestimonial(data: {
  name: string
  role: string
  content: string
  rating: number
  isActive?: boolean
}) {
  try {
    const testimonial = await prisma.testimonial.create({
      data: {
        name: data.name,
        role: data.role,
        content: data.content,
        rating: data.rating,
        isActive: data.isActive ?? true,
      },
    })
    revalidatePath("/")
    revalidatePath("/dashboard/testimonials")
    return { success: true, testimonial }
  } catch (error: any) {
    console.error("Failed to create testimonial:", error)
    return { success: false, error: error.message || "Failed to create testimonial" }
  }
}

export async function updateTestimonial(
  id: string,
  data: {
    name?: string
    role?: string
    content?: string
    rating?: number
    isActive?: boolean
  }
) {
  try {
    const testimonial = await prisma.testimonial.update({
      where: { id },
      data,
    })
    revalidatePath("/")
    revalidatePath("/dashboard/testimonials")
    return { success: true, testimonial }
  } catch (error: any) {
    console.error("Failed to update testimonial:", error)
    return { success: false, error: error.message || "Failed to update testimonial" }
  }
}

export async function toggleTestimonialActive(id: string, isActive: boolean) {
  try {
    const testimonial = await prisma.testimonial.update({
      where: { id },
      data: { isActive },
    })
    revalidatePath("/")
    revalidatePath("/dashboard/testimonials")
    return { success: true, testimonial }
  } catch (error: any) {
    console.error("Failed to toggle testimonial activity:", error)
    return { success: false, error: error.message || "Failed to toggle status" }
  }
}

export async function deleteTestimonial(id: string) {
  try {
    await prisma.testimonial.delete({
      where: { id },
    })
    revalidatePath("/")
    revalidatePath("/dashboard/testimonials")
    return { success: true }
  } catch (error: any) {
    console.error("Failed to delete testimonial:", error)
    return { success: false, error: error.message || "Failed to delete testimonial" }
  }
}
