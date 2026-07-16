import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function POST(request: Request) {
  try {
    const { name, phone, type, itemId, optionId, birthDate, paymentMethod, totalAmount } = await request.json()

    if (!name || !phone || !type || !itemId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // 1. Find or create Client
    let client = await prisma.client.findUnique({
      where: { phone }
    })

    if (!client) {
      const bcrypt = require("bcryptjs")
      const hashedPassword = await bcrypt.hash(phone, 10)
      client = await prisma.client.create({
        data: { name, phone, password: hashedPassword, birthDate }
      })
    } else if (birthDate && !client.birthDate) {
      // Update existing client with birthDate if they don't have it
      client = await prisma.client.update({
        where: { id: client.id },
        data: { birthDate }
      })
    }

    // 2. Create Enrollment
    const enrollmentData: any = {
      clientId: client.id,
      status: "PENDING",
      paymentMethod: paymentMethod || null,
    }

    let calculatedAmount = 0
    if (type === "PROGRAM") {
      if (!optionId) {
        return NextResponse.json({ error: "Option ID is required for program booking" }, { status: 400 })
      }
      const option = await prisma.programOption.findUnique({
        where: { id: optionId }
      })
      if (!option || option.programId !== itemId) {
        return NextResponse.json({ error: "Invalid program option selected" }, { status: 400 })
      }
      calculatedAmount = option.price
      enrollmentData.programId = itemId
      enrollmentData.optionId = optionId
    }
    else if (type === "WORKSHOP") {
      const workshop = await prisma.workshop.findUnique({
        where: { id: itemId }
      })
      if (!workshop) {
        return NextResponse.json({ error: "Invalid workshop selected" }, { status: 400 })
      }
      calculatedAmount = workshop.price
      enrollmentData.workshopId = itemId
    }
    else if (type === "EVENT") {
      const event = await prisma.event.findUnique({
        where: { id: itemId }
      })
      if (!event) {
        return NextResponse.json({ error: "Invalid event selected" }, { status: 400 })
      }
      calculatedAmount = event.price
      enrollmentData.eventId = itemId
    }
    else {
      return NextResponse.json({ error: "Invalid type" }, { status: 400 })
    }

    enrollmentData.totalAmount = calculatedAmount

    const enrollment = await prisma.enrollment.create({
      data: enrollmentData
    })

    return NextResponse.json({ success: true, enrollment })
  } catch (error: any) {
    console.error("Booking Error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
