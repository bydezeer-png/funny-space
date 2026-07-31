import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/auth"
import { checkUserPermission, PERMISSIONS } from "@/lib/permissions"
import { evaluateEnrollment, pickRecommended } from "@/lib/attendance/rules"
import crypto from "crypto"

const SECRET = process.env.AUTH_SECRET || "funny-space-super-secret-key-123"

export function generateNonce(clientId: string): string {
  const expiresAt = Date.now() + 90000 // 90 seconds validity
  const data = `${clientId}:${expiresAt}`
  const signature = crypto.createHmac("sha256", SECRET).update(data).digest("hex")
  return `${data}:${signature}`
}

export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "غير مصرح - الرجاء تسجيل الدخول" }, { status: 401 })
    }

    const currentUser = await prisma.user.findUnique({
      where: { id: session.user.id }
    })

    if (!currentUser || !currentUser.isActive) {
      return NextResponse.json({ error: "الحساب معطل أو غير موجود" }, { status: 403 })
    }

    const hasPermission = checkUserPermission(currentUser, PERMISSIONS.RECORD_ATTENDANCE)
    if (!hasPermission) {
      return NextResponse.json({ error: "عفواً، لا تملك صلاحية تسجيل حضور المشتركات" }, { status: 403 })
    }

    const { code } = await req.json()

    if (!code) {
      return NextResponse.json({ error: "لم يتم التعرف على المدخلات" }, { status: 400 })
    }

    // Find client by QR Token (primary), Phone, or legacy client ID
    const client = await prisma.client.findFirst({
      where: {
        OR: [
          { qrToken: code },
          { phone: code },
          { id: code }
        ]
      },
      include: {
        enrollments: {
          where: { status: "CONFIRMED" },
          include: {
            program: {
              include: {
                category: true
              }
            },
            option: {
              include: {
                schedules: true
              }
            },
            workshop: true,
            event: true,
            attendances: {
              orderBy: { date: 'desc' }
            }
          },
          orderBy: { createdAt: 'desc' }
        }
      }
    })

    if (!client) {
      return NextResponse.json({ error: "العميلة غير موجودة في النظام" }, { status: 404 })
    }

    const settings = await prisma.systemSettings.findUnique({
      where: { id: "default" }
    })

    // Evaluate rules for each confirmed enrollment
    const now = new Date()
    const states = client.enrollments.map((e) => evaluateEnrollment(e, now, settings))

    // Recommended enrollment
    const recommendedState = pickRecommended(states)
    const recommendedId = recommendedState ? recommendedState.enrollmentId : null

    // Determine if user choice is required
    const activeStatesCount = states.filter((s) => s.blockers.length === 0).length
    const scanAlwaysAsk = settings?.scanAlwaysAskProgram ?? false
    const requiresChoice = activeStatesCount > 1 || scanAlwaysAsk

    // Generate scanNonce
    const scanNonce = generateNonce(client.id)

    // Name initials for avatar
    const nameParts = client.name.split(" ")
    const photoInitial = nameParts[0] ? nameParts[0].charAt(0) : "C"

    return NextResponse.json({
      client: {
        id: client.id,
        name: client.name,
        phone: client.phone,
        photoInitial
      },
      states,
      recommendedId,
      requiresChoice,
      scanNonce
    })

  } catch (error: any) {
    console.error("Resolve Scan Error: ", error)
    return NextResponse.json({ error: "حدث خطأ داخلي في الخادم" }, { status: 500 })
  }
}
