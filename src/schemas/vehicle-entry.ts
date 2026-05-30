import { z } from "zod";

export const vehicleEntrySchema = z.object({
  entryDate: z.date(),
  vehicleNumber: z.string().min(1, "Vehicle number is required"),
  previousVehicleNumber: z.string().optional().nullable(),
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
  
  deliveryStatus: z.enum(["IN_TRANSIT", "WAITING_FOR_UNLOADING", "UNLOADED", "CANCELLED"]).default("IN_TRANSIT"),
  remarks: z.string().optional(),
});
