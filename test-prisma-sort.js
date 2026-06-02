import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  try {
    const entries = await prisma.vehicleEntry.findMany({
      orderBy: [
        { loadingDate: { sort: "desc", nulls: "last" } },
        { entryDate: "desc" }
      ],
      take: 1
    });
    console.log("Success", entries.length);
  } catch (e) {
    console.error("Error", e);
  } finally {
    await prisma.$disconnect();
  }
}
main();
