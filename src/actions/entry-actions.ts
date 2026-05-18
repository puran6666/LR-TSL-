

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";


export const vehicleEntrySchema = z.object({
  entryDate: z.date(),
  vehicleNumber: z.string().min(1, "Vehicle number is required"),
  brokerId: z.string().min(1, "Broker is required"),
  brokerName: z.string(),
  driverName: z.string().min(1, "Driver name is required"),
  driverMobile: z.string().min(10, "Valid mobile is required"),
  vehicleType: z.string(),
  weight: z.number().min(0),
  fromLocation: z.string().min(1, "From location is required"),
  toDestination: z.string().min(1, "Destination is required"),
  pickupCompany: z.string(),
  deliveryCompany: z.string(),
  
  lrNumber: z.string().min(1, "LR Number is required"),
  invoiceNumber: z.string(),
  packageCount: z.number().min(1),
  billNumber: z.string().optional(),
  ewayBillNumber: z.string().optional(),
  ewayBillValidTill: z.date().optional().nullable(),
  
  freightAmount: z.number().min(0),
  advancePaid: z.number().min(0),
  hamaliCharges: z.number().min(0).default(0),
  dieselCharges: z.number().min(0).default(0),
  otherCharges: z.number().min(0).default(0),
  balanceAmount: z.number(),
  balancePaid: z.number().min(0).default(0),
  balancePaidDate: z.date().optional().nullable(),
  
  deliveryStatus: z.enum(["IN_TRANSIT", "DELIVERED", "CANCELLED"]).default("IN_TRANSIT"),
  remarks: z.string().optional(),
});

export async function getVehicleEntries() {
  "use server";
  try {
    const entries = await prisma.vehicleEntry.findMany({
      orderBy: { entryDate: "desc" },
    });
    return { success: true, data: entries };
  } catch (error) {
    return { success: false, error: "Failed to fetch vehicle entries" };
  }
}

export async function createVehicleEntry(formData: z.infer<typeof vehicleEntrySchema>, userId: string) {
  "use server";
  try {
    const validatedData = vehicleEntrySchema.parse(formData);
    
    // Check if LR number exists
    const existingLr = await prisma.vehicleEntry.findUnique({
      where: { lrNumber: validatedData.lrNumber }
    });
    
    if (existingLr) {
      return { success: false, error: "LR Number already exists" };
    }

    const entry = await prisma.vehicleEntry.create({
      data: {
        ...validatedData,
        createdBy: userId,
      },
    });
    revalidatePath("/entries");
    return { success: true, data: entry };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: "Validation failed" };
    }
    return { success: false, error: "Failed to create entry" };
  }
}

export async function getDashboardStats() {
  "use server";
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [totalVehiclesToday, pendingBalance, deliveredVehicles, expiredEwayBills] = await Promise.all([
      prisma.vehicleEntry.count({
        where: {
          entryDate: {
            gte: today,
          }
        }
      }),
      prisma.vehicleEntry.aggregate({
        _sum: {
          balanceAmount: true
        },
        where: {
          balanceAmount: { gt: 0 }
        }
      }),
      prisma.vehicleEntry.count({
        where: {
          deliveryStatus: 'DELIVERED',
          updatedAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Last 7 days
          }
        }
      }),
      prisma.vehicleEntry.count({
        where: {
          ewayBillValidTill: {
            lt: new Date()
          }
        }
      })
    ]);

    return {
      success: true,
      data: {
        totalVehiclesToday,
        pendingBalance: pendingBalance._sum.balanceAmount || 0,
        deliveredVehicles,
        expiredEwayBills
      }
    };
  } catch (error) {
    return { success: false, error: "Failed to fetch dashboard stats" };
  }
}
