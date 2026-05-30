const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    const entries = await prisma.vehicleEntry.findMany({
      include: { broker: true }
    });
    console.log(JSON.stringify(entries, null, 2));
  } catch (error) {
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
