import { z } from "zod";

export const vehicleEntrySchema = z.object({
  entryDate: z.date(),
  loadingDate: z.preprocess((val) => (val === "" || val === null || val === undefined ? null : typeof val === "string" ? new Date(val) : val), z.date().optional().nullable()),
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
  ewayBillValidTill: z.preprocess((val) => (val === "" || val === null || val === undefined ? null : typeof val === "string" ? new Date(val) : val), z.date().optional().nullable()),
  distance: z.preprocess((val) => (val === "" || val === null || val === undefined ? null : Number(val)), z.number().min(0).optional().nullable()),
  
  freightAmount: z.number().min(0),
  billingAmount: z.number().min(0).default(0).optional(),
  advancePaid: z.number().min(0),
  hamaliCharges: z.number().min(0).default(0),
  detentionCharges: z.number().min(0).default(0),
  balanceAmount: z.number(),
  balancePaid: z.number().min(0).default(0),
  balancePaidDate: z.preprocess((val) => (val === "" || val === null || val === undefined ? null : typeof val === "string" ? new Date(val) : val), z.date().optional().nullable()),
  
  deliveryStatus: z.enum(["IN_TRANSIT", "WAITING_FOR_UNLOADING", "UNLOADED", "CANCELLED"]).default("IN_TRANSIT"),
  mode: z.enum(["NORMAL", "EXPRESS"]).default("NORMAL"),
  remarks: z.string().optional(),
});

export const brokerSchema = z.object({
  brokerName: z.string().min(1, "Broker name is required"),
  mobile: z.string().min(10, "Valid mobile number is required"),
  address: z.string().optional(),
});
