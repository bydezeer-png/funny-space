const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

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
  }
  console.log('Finished updating passwords.');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
