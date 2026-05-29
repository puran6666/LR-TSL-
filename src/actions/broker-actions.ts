"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { brokerSchema } from "@/lib/schemas";

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
    try {
      revalidatePath("/brokers");
    } catch (e) {
      console.log("Revalidate path failed, but broker was created:", e);
    }
    return { success: true, data: broker };
  } catch (error: any) {
    console.error("Broker creation error:", error);
    return { success: false, error: error?.message || "Failed to create broker" };
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
