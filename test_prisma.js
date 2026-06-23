const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const keys = Object.keys(prisma);
  console.log("PRISMA KEYS:", keys.filter(k => k.toLowerCase().includes('pos')));
}

main().catch(console.error);
