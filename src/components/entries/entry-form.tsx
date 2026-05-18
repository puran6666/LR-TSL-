"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useRouter } from "next/navigation";
import { createVehicleEntry } from "@/actions/entry-actions";
import { vehicleEntrySchema } from "@/schemas/vehicle-entry";
import { Broker } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Save } from "lucide-react";

interface EntryFormProps {
  brokers: Broker[];
  userId: string;
}

export function EntryForm({ brokers, userId }: EntryFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  
  const form = useForm<z.infer<typeof vehicleEntrySchema>>({
    resolver: zodResolver(vehicleEntrySchema) as any,
    defaultValues: {
      entryDate: new Date(),
      vehicleNumber: "",
      brokerId: "",
      brokerName: "",
      driverName: "",
      driverMobile: "",
      vehicleType: "Truck",
      weight: 0,
      fromLocation: "",
      toDestination: "",
      pickupCompany: "",
      deliveryCompany: "",
      lrNumber: "",
      invoiceNumber: "",
      packageCount: 1,
      freightAmount: 0,
      advancePaid: 0,
      hamaliCharges: 0,
      dieselCharges: 0,
      otherCharges: 0,
      balanceAmount: 0,
    },
  });

  const { watch, setValue, handleSubmit, formState: { errors } } = form;

  // Auto calculate balance
  const freight = watch("freightAmount") || 0;
  const advance = watch("advancePaid") || 0;
  const hamali = watch("hamaliCharges") || 0;
  const diesel = watch("dieselCharges") || 0;
  const other = watch("otherCharges") || 0;

  useEffect(() => {
    const balance = Number(freight) - Number(advance) - Number(hamali) - Number(diesel) - Number(other);
    setValue("balanceAmount", balance);
  }, [freight, advance, hamali, diesel, other, setValue]);

  async function onSubmit(values: z.infer<typeof vehicleEntrySchema>) {
    setIsLoading(true);
    
    // Set broker name
    const selectedBroker = brokers.find(b => b.id === values.brokerId);
    if (selectedBroker) {
      values.brokerName = selectedBroker.brokerName;
    }
    
    const result = await createVehicleEntry(values, userId);
    
    setIsLoading(false);
    
    if (result.success) {
      toast.success("Vehicle entry created successfully");
      router.push("/entries");
    } else {
      toast.error(result.error || "Failed to create entry");
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Basic Details */}
        <div className="space-y-4 md:col-span-2">
          <h3 className="text-lg font-medium border-b pb-2">Basic Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="grid gap-2">
              <Label>Vehicle Number *</Label>
              <Input {...form.register("vehicleNumber")} className="uppercase" />
              {errors.vehicleNumber && <span className="text-xs text-red-500">{errors.vehicleNumber.message}</span>}
            </div>
            <div className="grid gap-2">
              <Label>Broker *</Label>
              <Select 
                value={watch("brokerId")}
                onValueChange={(val: string | null) => setValue("brokerId", val || "")}
                items={brokers.map(b => ({ value: b.id, label: b.brokerName }))}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select broker" />
                </SelectTrigger>
                <SelectContent>
                  {brokers.map((b) => (
                    <SelectItem key={b.id} value={b.id}>{b.brokerName}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.brokerId && <span className="text-xs text-red-500">{errors.brokerId.message}</span>}
            </div>
            <div className="grid gap-2">
              <Label>Driver Name *</Label>
              <Input {...form.register("driverName")} />
              {errors.driverName && <span className="text-xs text-red-500">{errors.driverName.message}</span>}
            </div>
            <div className="grid gap-2">
              <Label>Driver Mobile *</Label>
              <Input {...form.register("driverMobile")} type="tel" />
              {errors.driverMobile && <span className="text-xs text-red-500">{errors.driverMobile.message}</span>}
            </div>
            <div className="grid gap-2">
              <Label>From Location *</Label>
              <Input {...form.register("fromLocation")} />
            </div>
            <div className="grid gap-2">
              <Label>Destination *</Label>
              <Input {...form.register("toDestination")} />
            </div>
          </div>
        </div>

        {/* Document Details */}
        <div className="space-y-4 md:col-span-2">
          <h3 className="text-lg font-medium border-b pb-2">Document Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="grid gap-2">
              <Label>LR Number *</Label>
              <Input {...form.register("lrNumber")} />
              {errors.lrNumber && <span className="text-xs text-red-500">{errors.lrNumber.message}</span>}
            </div>
            <div className="grid gap-2">
              <Label>Weight (MT) *</Label>
              <Input {...form.register("weight", { valueAsNumber: true })} type="number" step="0.01" />
            </div>
            <div className="grid gap-2">
              <Label>Package Count</Label>
              <Input {...form.register("packageCount", { valueAsNumber: true })} type="number" />
            </div>
            <div className="grid gap-2">
              <Label>E-Way Bill Number</Label>
              <Input {...form.register("ewayBillNumber")} />
            </div>
          </div>
        </div>

        {/* Payment Details */}
        <div className="space-y-4 md:col-span-2">
          <h3 className="text-lg font-medium border-b pb-2">Payment Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="grid gap-2">
              <Label>Freight Amount (₹)</Label>
              <Input {...form.register("freightAmount", { valueAsNumber: true })} type="number" />
            </div>
            <div className="grid gap-2">
              <Label>Advance Paid (₹)</Label>
              <Input {...form.register("advancePaid", { valueAsNumber: true })} type="number" />
            </div>
            <div className="grid gap-2">
              <Label>Hamali Charges (₹)</Label>
              <Input {...form.register("hamaliCharges", { valueAsNumber: true })} type="number" />
            </div>
            <div className="grid gap-2">
              <Label>Diesel Charges (₹)</Label>
              <Input {...form.register("dieselCharges", { valueAsNumber: true })} type="number" />
            </div>
            <div className="grid gap-2">
              <Label>Other Charges (₹)</Label>
              <Input {...form.register("otherCharges", { valueAsNumber: true })} type="number" />
            </div>
            <div className="grid gap-2">
              <Label className="text-orange-600 font-bold">Balance Amount (₹) [Auto]</Label>
              <Input {...form.register("balanceAmount", { valueAsNumber: true })} type="number" readOnly className="bg-orange-50 font-bold text-orange-700" />
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-end pt-4 border-t">
        <Button type="button" variant="outline" className="mr-4" onClick={() => router.back()}>Cancel</Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? "Saving..." : <><Save className="w-4 h-4 mr-2" /> Save Entry</>}
        </Button>
      </div>
    </form>
  );
}
