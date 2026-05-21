import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // Create admin user
  const adminPassword = await bcrypt.hash("admin123", 10);
  const admin = await prisma.user.upsert({
    where: { email: "admin@example.com" },
    update: {},
    create: {
      email: "admin@example.com",
      name: "Admin User",
      password: adminPassword,
      role: "ADMIN",
    },
  });
  console.log("Created admin user: admin@example.com / admin123");

  // Create dummy brokers
  const broker1 = await prisma.broker.create({
    data: {
      brokerName: "Sharma Logistics",
      mobile: "9876543210",
      address: "Delhi",
    },
  });

  const broker2 = await prisma.broker.create({
    data: {
      brokerName: "Rao Transports",
      mobile: "9123456780",
      address: "Mumbai",
    },
  });

  console.log("Created dummy brokers");

  // Create some vehicle entries
  await prisma.vehicleEntry.create({
    data: {
      entryDate: new Date(),
      vehicleNumber: "MH04AB1234",
      brokerId: broker1.id,
      brokerName: broker1.brokerName,
      driverName: "Raju",
      driverMobile: "9988776655",
      vehicleType: "10 Tyre",
      weight: 15.5,
      fromLocation: "Delhi",
      toDestination: "Mumbai",
      pickupCompany: "ABC Corp",
      deliveryCompany: "XYZ Ltd",
      lrNumber: "LR1001",
      invoiceNumber: "INV-2023-01",
      packageCount: 150,
      freightAmount: 45000,
      advancePaid: 10000,
      hamaliCharges: 500,
      balanceAmount: 34500,
      deliveryStatus: "IN_TRANSIT",
      createdBy: admin.id,
    }
  });

  await prisma.vehicleEntry.create({
    data: {
      entryDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
      vehicleNumber: "DL01XY9876",
      brokerId: broker2.id,
      brokerName: broker2.brokerName,
      driverName: "Suresh",
      driverMobile: "9876543123",
      vehicleType: "Container",
      weight: 20,
      fromLocation: "Mumbai",
      toDestination: "Bangalore",
      pickupCompany: "Global Traders",
      deliveryCompany: "Tech Hub",
      lrNumber: "LR1002",
      invoiceNumber: "INV-2023-02",
      packageCount: 300,
      freightAmount: 65000,
      advancePaid: 20000,
      hamaliCharges: 1000,
      balanceAmount: 44000,
      deliveryStatus: "DELIVERED",
      createdBy: admin.id,
    }
  });

  console.log("Seeding complete!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
