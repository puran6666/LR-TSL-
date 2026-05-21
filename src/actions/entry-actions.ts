"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";
<<<<<<< HEAD
import { vehicleEntrySchema } from "@/lib/schemas";
// Utility for date handling – already installed via date-fns in the project
import { addDays } from "date-fns"; // used for clarity in calculations (optional)

=======
import { vehicleEntrySchema } from "@/schemas/vehicle-entry";
>>>>>>> 1980623d1f6b341b7ae7042e22a7fe4444005819

export async function getVehicleEntries() {
  try {
    const entries = await prisma.vehicleEntry.findMany({
      orderBy: { entryDate: "desc" },
      include: { broker: true }
    });
    return { success: true, data: entries };
  } catch (error) {
    return { success: false, error: "Failed to fetch vehicle entries" };
  }
}

export async function createVehicleEntry(formData: z.infer<typeof vehicleEntrySchema>, userId: string) {
  try {
    const validatedData = vehicleEntrySchema.parse(formData);

    // ---- Automatic E-Way Bill validity calculation ----
    // Rule: 100 km = 1 day of validity. Round up to the next full day.
    // If distance is provided, compute validity period and set ewayBillValidTill.
    if (validatedData.distance != null && validatedData.distance > 0) {
      const validityDays = Math.ceil(validatedData.distance / 100);
      const now = new Date();
      // Preserve the time of generation for the expiry date.
      const expiry = new Date(now.getTime() + validityDays * 24 * 60 * 60 * 1000);
      validatedData.ewayBillValidTill = expiry;
    }
    // ---------------------------------------------------

      // ---- Calculate balance without hamali charges ----
      const freight = validatedData.freightAmount ?? 0;
      const detention = validatedData.detentionCharges ?? 0;
      validatedData.balanceAmount = freight + detention;
      // ---------------------------------------------------
    
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

    const [totalVehiclesToday, pendingBalance, deliveredVehicles, expiredEwayBills, totalVehiclesBooked, totalOutstanding] = await Promise.all([
      prisma.vehicleEntry.count({
        where: {
          entryDate: {
            gte: today,
          },
        },
      }),
      prisma.vehicleEntry.aggregate({
        _sum: {
          balanceAmount: true,
        },
        where: {
          balanceAmount: { gt: 0 },
        },
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
      }),
      // Total vehicles booked (overall count)
      prisma.vehicleEntry.count(),
      // Total freight cost (sum of all freightAmount)
      prisma.vehicleEntry.aggregate({
        _sum: { freightAmount: true }
      })
    ]);

    return {
      success: true,
      data: {
        totalVehiclesToday,
        pendingBalance: pendingBalance._sum.balanceAmount || 0,
        deliveredVehicles,
        expiredEwayBills,
        totalVehiclesBooked,
        totalOutstanding: totalOutstanding._sum.freightAmount || 0,
      }
    };

  } catch (error) {
    return { success: false, error: "Failed to fetch dashboard stats" };
  }
}

export async function updateVehicleEntry(id: string, formData: z.infer<typeof vehicleEntrySchema>, userId: string) {
  try {
    const validatedData = vehicleEntrySchema.parse(formData);
    
    // Check if another entry has the same LR number
    const existingLr = await prisma.vehicleEntry.findFirst({
      where: { 
        lrNumber: validatedData.lrNumber,
        id: { not: id }
      }
    });
    
    if (existingLr) {
      return { success: false, error: "LR Number already exists on another entry" };
    }

    const entry = await prisma.vehicleEntry.update({
      where: { id },
      data: {
        ...validatedData,
      },
    });
    revalidatePath("/entries");
    revalidatePath("/dashboard");
    return { success: true, data: entry };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: "Validation failed" };
    }
    return { success: false, error: "Failed to update entry" };
  }
}

export async function extendEwayBillValidity(id: string, newDateStr: string) {
  try {
    const newDate = new Date(newDateStr);
    if (isNaN(newDate.getTime())) {
      return { success: false, error: "Invalid date" };
    }

    // ---- Extension window rule ----
    // Allowed from 4:00 PM on the expiry date until 8:00 AM on the following day.
    const entry = await prisma.vehicleEntry.findUnique({
      where: { id },
      select: { ewayBillValidTill: true }
    });
    if (!entry?.ewayBillValidTill) {
      return { success: false, error: "Original expiry not set" };
    }
    const expiry = new Date(entry.ewayBillValidTill);
    const windowStart = new Date(expiry);
    windowStart.setHours(16, 0, 0, 0); // 4:00 PM on expiry date
    const windowEnd = new Date(expiry);
    windowEnd.setDate(windowEnd.getDate() + 1);
    windowEnd.setHours(8, 0, 0, 0); // 8:00 AM next day
    const now = new Date();
    if (now < windowStart || now > windowEnd) {
      return { success: false, error: "Extension not allowed outside the extension window (4 PM – 8 AM)" };
    }
    // --------------------------------

    const updated = await prisma.vehicleEntry.update({
      where: { id },
      data: { ewayBillValidTill: newDate },
    });
    revalidatePath("/entries");
    revalidatePath("/dashboard");
    return { success: true, data: updated };
  } catch (error) {
    return { success: false, error: "Failed to extend E-Way Bill validity" };
  }
}

export async function getExpiringEwayBills() {
  try {
    const now = new Date();
    const threshold = new Date(now.getTime() + 48 * 60 * 60 * 1000); // 48 hours from now
    
    const entries = await prisma.vehicleEntry.findMany({
      where: {
        ewayBillValidTill: {
          not: null,
          lte: threshold
        },
        deliveryStatus: "IN_TRANSIT"
      },
      orderBy: {
        ewayBillValidTill: "asc"
      },
      include: {
        broker: true
      }
    });
    return { success: true, data: entries };
  } catch (error) {
    return { success: false, error: "Failed to fetch expiring E-Way Bills" };
  }
}

export async function getRecentVehicleEntries(limit: number = 10, excludeDelivered: boolean = false) {
  try {
    const entries = await prisma.vehicleEntry.findMany({
      where: excludeDelivered
        ? { deliveryStatus: { not: "DELIVERED" } }
        : undefined,
      orderBy: [
        { entryDate: "desc" },
        { createdAt: "desc" }
      ],
      take: limit,
      include: {
        broker: true
      }
    });
    return { success: true, data: entries };
  } catch (error) {
    return { success: false, error: "Failed to fetch recent vehicle entries" };
  }
}

export async function deleteVehicleEntry(id: string) {
  try {
    await prisma.$transaction([
      prisma.paymentHistory.deleteMany({
        where: { vehicleEntryId: id }
      }),
      prisma.vehicleEntry.delete({
        where: { id }
      })
    ]);
    revalidatePath("/entries");
    revalidatePath("/dashboard");
    return { success: true };
  } catch (error) {
    return { success: false, error: "Failed to delete vehicle entry" };
  }
}

export async function getInTransitVehicles() {
  try {
    const entries = await prisma.vehicleEntry.findMany({
      where: {
        deliveryStatus: {
          not: "DELIVERED"
        }
      },
      orderBy: [
        { entryDate: "desc" },
        { createdAt: "desc" }
      ],
      include: {
        broker: true
      }
    });
    return { success: true, data: entries };
  } catch (error) {
    return { success: false, error: "Failed to fetch in-transit vehicles" };
  }
}

export async function markVehicleAsDelivered(id: string) {
  try {
    const entry = await prisma.vehicleEntry.update({
      where: { id },
      data: {
        deliveryStatus: "DELIVERED",
      },
    });
    revalidatePath("/entries");
    revalidatePath("/dashboard");
    return { success: true, data: entry };
  } catch (error) {
    return { success: false, error: "Failed to mark vehicle as delivered" };
  }
}



