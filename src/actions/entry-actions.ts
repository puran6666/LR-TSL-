"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { vehicleEntrySchema } from "@/lib/schemas";
// Utility for date handling – already installed via date-fns in the project
import { addDays } from "date-fns"; // used for clarity in calculations (optional)

export async function getVehicleEntries() {
  try {
    const entries = await prisma.vehicleEntry.findMany({
      orderBy: [
        { loadingDate: { sort: 'desc', nulls: 'last' } },
        { entryDate: 'desc' }
      ],
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

    // Ensure brokerName is populated correctly from the DB
    const broker = await prisma.broker.findUnique({
      where: { id: validatedData.brokerId }
    });
    if (broker) {
      validatedData.brokerName = broker.brokerName;
    }

    const entry = await prisma.vehicleEntry.create({
      data: {
        ...validatedData,
        createdBy: userId,
      },
    });
    try {
      revalidatePath("/entries");
      revalidatePath("/dashboard");
    } catch(e) {
      console.log("revalidate error", e);
    }
    return { success: true, data: entry };
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return { success: false, error: "Validation failed" };
    }
    console.error("Entry creation error:", error);
    return { success: false, error: error?.message || "Failed to create entry" };
  }
}

export async function getDashboardStats() {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [
      totalVehiclesToday, 
      pendingBalance, 
      deliveredVehicles, 
      expiredEwayBills, 
      totalVehiclesBooked, 
      totalOutstanding, 
      waitingForUnloading,
      expressVehicles
    ] = await Promise.all([
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
          deliveryStatus: 'UNLOADED',
          updatedAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Last 7 days
          }
        }
      }),
      prisma.vehicleEntry.count({
        where: {
          ewayBillValidTill: {
            lt: new Date()
          },
          deliveryStatus: {
            notIn: ["UNLOADED", "DELIVERED", "CANCELLED"]
          }
        }
      }),
      // Total vehicles booked (overall count)
      prisma.vehicleEntry.count(),
      // Total freight cost (sum of all freightAmount)
      prisma.vehicleEntry.aggregate({
        _sum: { freightAmount: true }
      }),
      // Waiting for unloading count
      prisma.vehicleEntry.count({
        where: {
          deliveryStatus: 'WAITING_FOR_UNLOADING'
        }
      }),
      // Express mode vehicles
      prisma.vehicleEntry.count({
        where: {
          mode: 'EXPRESS',
          deliveryStatus: {
            notIn: ['UNLOADED', 'DELIVERED', 'CANCELLED']
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
        expiredEwayBills,
        totalVehiclesBooked,
        totalOutstanding: totalOutstanding._sum.freightAmount || 0,
        waitingForUnloading,
        expressVehicles,
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

    // Ensure brokerName is populated correctly from the DB
    const broker = await prisma.broker.findUnique({
      where: { id: validatedData.brokerId }
    });
    if (broker) {
      validatedData.brokerName = broker.brokerName;
    }

    const existingEntry = await prisma.vehicleEntry.findUnique({
      where: { id }
    });

    if (existingEntry && existingEntry.vehicleNumber !== validatedData.vehicleNumber) {
      validatedData.previousVehicleNumber = existingEntry.vehicleNumber;
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
    console.error("Failed to update vehicle entry:", error);
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
        deliveryStatus: {
          notIn: ["UNLOADED", "DELIVERED", "CANCELLED"]
        }
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
        ? { deliveryStatus: { not: "UNLOADED" } }
        : undefined,
      orderBy: [
        { loadingDate: { sort: 'desc', nulls: 'last' } },
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
          not: "UNLOADED"
        }
      },
      orderBy: [
        { loadingDate: { sort: 'desc', nulls: 'last' } },
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

export async function markVehicleAsUnloaded(id: string) {
  try {
    const entry = await prisma.vehicleEntry.update({
      where: { id },
      data: {
        deliveryStatus: "UNLOADED",
      },
    });
    revalidatePath("/entries");
    revalidatePath("/dashboard");
    return { success: true, data: entry };
  } catch (error) {
    return { success: false, error: "Failed to mark vehicle as unloaded" };
  }
}



