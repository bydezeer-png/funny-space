import { PrismaClient } from "@prisma/client"
import { Pool } from "pg"
import { PrismaPg } from "@prisma/adapter-pg"

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    adapter: new PrismaPg(
      new Pool({ 
        connectionString: process.env.DATABASE_URL,
        max: 2, // Limit pool size for serverless environment to prevent connection exhaustion
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 2000,
      })
    ),
  })

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma

