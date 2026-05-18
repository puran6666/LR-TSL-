"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { vehicleEntrySchema } from "@/schemas/vehicle-entry";

export async function getVehicleEntries() {
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
