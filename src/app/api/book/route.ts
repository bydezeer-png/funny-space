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
      totalAmount: totalAmount || 0,
    }

    if (type === "PROGRAM") {
      enrollmentData.programId = itemId
      if (optionId) enrollmentData.optionId = optionId
    }
    else if (type === "WORKSHOP") enrollmentData.workshopId = itemId
    else if (type === "EVENT") enrollmentData.eventId = itemId
    else return NextResponse.json({ error: "Invalid type" }, { status: 400 })

    const enrollment = await prisma.enrollment.create({
      data: enrollmentData
    })

    return NextResponse.json({ success: true, enrollment })
  } catch (error: any) {
    console.error("Booking Error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
