import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function POST(req: Request) {
  try {
    const { clientId } = await req.json()

    if (!clientId) {
      return NextResponse.json({ error: "لم يتم التعرف على المدخلات" }, { status: 400 })
    }

    // Find client by ID (QR Code) OR Phone Number (Manual Entry)
    const client = await prisma.client.findFirst({
      where: {
        OR: [
          { id: clientId },
          { phone: clientId }
        ]
      },
      include: {
        enrollments: {
          where: { status: "CONFIRMED" },
          include: { 
            program: true,
            option: true,
            workshop: true,
            event: true,
            attendances: true 
          },
          orderBy: { createdAt: 'desc' }
        }
      }
    })

    if (!client) {
      return NextResponse.json({ error: "العميلة غير موجودة في النظام" }, { status: 404 })
    }

    if (client.enrollments.length === 0) {
      return NextResponse.json({ error: "العميلة لا تمتلك أي اشتراكات مؤكدة" }, { status: 400 })
    }

    // Try to find an enrollment that allows attendance
    let activeEnrollment = null;
    let errorMessage = "استنفدت جميع الحصص المتاحة";
    let isMakeup = false;

    for (const enrollment of client.enrollments) {
      if (enrollment.program) {
        const regularAttendances = enrollment.attendances.filter(a => !a.isMakeup).length;
        const sessionsPerMonth = enrollment.option?.sessionsPerMonth || 8;
        const optionPrice = enrollment.option?.price || 0;
        const sessionPrice = (enrollment.totalAmount || optionPrice) / sessionsPerMonth;
        const allowedSessions = Math.floor((enrollment.amountPaid || 0) / sessionPrice);

        if (regularAttendances < allowedSessions && regularAttendances < sessionsPerMonth) {
          activeEnrollment = enrollment;
          break;
        } else if (regularAttendances >= allowedSessions && regularAttendances < sessionsPerMonth) {
          errorMessage = `نفدت الحصص المدفوعة! العميلة دفعت ${enrollment.amountPaid} ومسموح بـ ${allowedSessions} حصص. متبقي ${(enrollment.totalAmount || optionPrice) - (enrollment.amountPaid || 0)} ج.م`;
        }
      } else {
        // For workshops or events, if attended already, skip, else use it
        if (enrollment.attendances.length === 0) {
          activeEnrollment = enrollment;
          break;
        }
      }
    }

    if (!activeEnrollment) {
      return NextResponse.json({ error: errorMessage }, { status: 400 })
    }

    // Record Attendance
    await prisma.attendance.create({
      data: {
        enrollmentId: activeEnrollment.id,
        date: new Date(),
        status: "ATTENDED",
        isMakeup
      }
    })

    // Calculate remaining for response
    let remaining = 0;
    let itemName = activeEnrollment.program?.name || activeEnrollment.workshop?.name || activeEnrollment.event?.name;
    
    if (activeEnrollment.program) {
      const regularAttendances = activeEnrollment.attendances.filter(a => !a.isMakeup).length + 1; // +1 for current
      const sessionsPerMonth = activeEnrollment.option?.sessionsPerMonth || 8;
      const optionPrice = activeEnrollment.option?.price || 0;
      const sessionPrice = (activeEnrollment.totalAmount || optionPrice) / sessionsPerMonth;
      const allowedSessions = Math.floor((activeEnrollment.amountPaid || 0) / sessionPrice);
      remaining = Math.max(0, Math.min(sessionsPerMonth, allowedSessions) - regularAttendances);
    }

    return NextResponse.json({
      success: true,
      name: client.name,
      remaining,
      itemName
    })

  } catch (error: any) {
    console.error(error)
    return NextResponse.json({ error: "حدث خطأ داخلي في الخادم" }, { status: 500 })
  }
}
