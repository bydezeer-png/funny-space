const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: '.env' });

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const clients = await prisma.client.findMany({
    where: { password: null }
  });
  
  console.log(`Found ${clients.length} clients without password.`);
  
  for (const c of clients) {
    const hash = await bcrypt.hash(c.phone, 10);
    await prisma.client.update({
      where: { id: c.id },
      data: { password: hash }
    });
    console.log(`Updated client: ${c.phone}`);
  }
  console.log('Finished updating passwords.');
}

main().catch(console.error).finally(() => prisma.$disconnect());
