import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export async function GET() {
  try {
    const hash = await bcrypt.hash('123456', 10)
    await prisma.user.upsert({
      where: { email: 'admin@funnyspace.com' },
      update: { password: hash },
      create: {
        name: 'Admin',
        email: 'admin@funnyspace.com',
        password: hash,
        role: 'ADMIN'
      }
    })
    return NextResponse.json({ success: true, message: 'Admin user created/updated: admin@funnyspace.com | pass: 123456' })
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
