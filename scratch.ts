import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
async function test() {
  const brokers = await prisma.broker.findMany();
  console.log(brokers);
}
test();
