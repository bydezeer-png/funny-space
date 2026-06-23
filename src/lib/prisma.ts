import { PrismaClient } from "@prisma/client"
import { Pool } from "pg"
import { PrismaPg } from "@prisma/adapter-pg"

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }

// Self-healing: if global client is stale and doesn't know about 'testimonial', delete it to force recreation
if (globalForPrisma.prisma && !('testimonial' in globalForPrisma.prisma)) {
  delete (globalForPrisma as any).prisma
}

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    adapter: new PrismaPg(new Pool({ connectionString: process.env.DATABASE_URL })),
  })

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma

