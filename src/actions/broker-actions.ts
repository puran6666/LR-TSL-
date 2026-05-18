"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const brokerSchema = z.object({
  brokerName: z.string().min(1, "Broker name is required"),
  mobile: z.string().min(10, "Valid mobile number is required"),
  address: z.string().optional(),
});

export async function getBrokers() {
  try {
    const brokers = await prisma.broker.findMany({
      orderBy: { createdAt: "desc" },
    });
    return { success: true, data: brokers };
  } catch (error) {
    return { success: false, error: "Failed to fetch brokers" };
  }
}

export async function createBroker(formData: z.infer<typeof brokerSchema>) {
  try {
    const validatedData = brokerSchema.parse(formData);
    const broker = await prisma.broker.create({
      data: validatedData,
    });
    revalidatePath("/brokers");
    return { success: true, data: broker };
  } catch (error) {
    return { success: false, error: "Failed to create broker" };
  }
}

export async function updateBroker(id: string, formData: z.infer<typeof brokerSchema>) {
  try {
    const validatedData = brokerSchema.parse(formData);
    const broker = await prisma.broker.update({
      where: { id },
      data: validatedData,
    });
    revalidatePath("/brokers");
    return { success: true, data: broker };
  } catch (error) {
    return { success: false, error: "Failed to update broker" };
  }
}

export async function deleteBroker(id: string) {
  try {
    // Check if broker has vehicle entries
    const entries = await prisma.vehicleEntry.count({
      where: { brokerId: id }
    });
    
    if (entries > 0) {
      return { success: false, error: "Cannot delete broker with active vehicle entries" };
    }
    
    await prisma.broker.delete({
      where: { id },
    });
    revalidatePath("/brokers");
    return { success: true };
  } catch (error) {
    return { success: false, error: "Failed to delete broker" };
  }
}
