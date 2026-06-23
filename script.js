import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function run() {
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
    console.log('Admin user created successfully.')
  } catch (error) {
    console.error('Error creating admin:', error)
  } finally {
    await prisma.$disconnect()
  }
}

run()
