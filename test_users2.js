const { prisma } = require('./src/lib/prisma.ts'); // Need to run with ts-node or Next.js, wait, I can just use a node script with the DB URL.

const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');
const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const p = new PrismaClient({ adapter });

async function main() {
  const users = await p.user.findMany();
  console.log('Users:', users);
}

main().catch(console.error).finally(() => p.$disconnect());
