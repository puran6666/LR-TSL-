"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useRouter } from "next/navigation";
import { createVehicleEntry, updateVehicleEntry } from "@/actions/entry-actions";
import { vehicleEntrySchema } from "@/lib/schemas";
import { Broker, VehicleEntry } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Save, Plus, X } from "lucide-react";
import { AddBrokerDialog } from "@/components/brokers/add-broker-dialog";
import { Badge } from "@/components/ui/badge";

interface EntryFormProps {
  brokers: Broker[];
  userId: string;
  initialData?: (VehicleEntry & { mode?: string }) | null;
  onSuccess?: () => void;
}

const formatDateForInput = (date: Date | string | null | undefined) => {
  if (!date) return "";
  const d = new Date(date);
  if (isNaN(d.getTime())) return "";
  return d.toISOString().split("T")[0];
};

export function EntryForm({ brokers, userId, initialData, onSuccess }: EntryFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [invoices, setInvoices] = useState<string[]>(() => {
    const val = initialData?.invoiceNumber || "";
    return val ? val.split(",").map(s => s.trim()).filter(Boolean) : [];
  });
  const [invoiceInput, setInvoiceInput] = useState("");
  
  const form = useForm<z.infer<typeof vehicleEntrySchema>>({
    resolver: zodResolver(vehicleEntrySchema) as any,
    defaultValues: {
      entryDate: initialData?.entryDate ? new Date(initialData.entryDate) : new Date(),
      loadingDate: initialData?.loadingDate ? formatDateForInput(initialData.loadingDate) as any : null,
      vehicleNumber: initialData?.vehicleNumber || "",
      brokerId: initialData?.brokerId || "",
      brokerName: initialData?.brokerName || "",
      driverName: initialData?.driverName || "",
      driverMobile: initialData?.driverMobile || "",
      vehicleType: initialData?.vehicleType || "Truck",
      weight: initialData?.weight || 0,
      fromLocation: initialData?.fromLocation || "",
      toDestination: initialData?.toDestination || "",
      pickupCompany: initialData?.pickupCompany || "",
      deliveryCompany: initialData?.deliveryCompany || "",
      lrNumber: initialData?.lrNumber || "",
      invoiceNumber: initialData?.invoiceNumber || "",
      packageCount: initialData?.packageCount || 1,
      freightAmount: initialData?.freightAmount || 0,
      advancePaid: initialData?.advancePaid || 0,
      hamaliCharges: initialData?.hamaliCharges || 0,
      detentionCharges: initialData?.detentionCharges || 0,
      balanceAmount: initialData?.balanceAmount || 0,
      balancePaid: initialData?.balancePaid || 0,
      balancePaidDate: initialData?.balancePaidDate ? formatDateForInput(initialData.balancePaidDate) as any : null,
      deliveryStatus: (initialData?.deliveryStatus as any) || "IN_TRANSIT",
      remarks: initialData?.remarks || "",
      mode: ((initialData as any)?.mode) || "NORMAL",
      ewayBillNumber: initialData?.ewayBillNumber || "",
      ewayBillValidTill: initialData?.ewayBillValidTill ? formatDateForInput(initialData.ewayBillValidTill) as any : null,
      distance: (initialData?.distance ?? "") as any,
      billNumber: initialData?.billNumber || "",
    },
  });

  const { watch, setValue, handleSubmit, formState: { errors } } = form;

  // Sync invoices array to invoiceNumber input form field
  useEffect(() => {
    setValue("invoiceNumber", invoices.join(", "));
  }, [invoices, setValue]);

  // Sync with initialData changes (for when the form is loaded in an edit modal)
  useEffect(() => {
    if (initialData) {
      form.reset({
        entryDate: new Date(initialData.entryDate),
        loadingDate: initialData.loadingDate ? formatDateForInput(initialData.loadingDate) as any : null,
        vehicleNumber: initialData.vehicleNumber,
        brokerId: initialData.brokerId,
        brokerName: initialData.brokerName,
        driverName: initialData.driverName,
        driverMobile: initialData.driverMobile,
        vehicleType: initialData.vehicleType,
        weight: initialData.weight,
        fromLocation: initialData.fromLocation,
        toDestination: initialData.toDestination,
        pickupCompany: initialData.pickupCompany,
        deliveryCompany: initialData.deliveryCompany,
        lrNumber: initialData.lrNumber,
        invoiceNumber: initialData.invoiceNumber,
        packageCount: initialData.packageCount,
        freightAmount: initialData.freightAmount,
        advancePaid: initialData.advancePaid,
        hamaliCharges: initialData.hamaliCharges,
        detentionCharges: initialData.detentionCharges,
        balanceAmount: initialData.balanceAmount,
        balancePaid: initialData.balancePaid,
        balancePaidDate: initialData.balancePaidDate ? formatDateForInput(initialData.balancePaidDate) as any : null,
        deliveryStatus: initialData.deliveryStatus as any,
        mode: (initialData as any).mode || "NORMAL",
        remarks: initialData.remarks || "",
        ewayBillNumber: initialData.ewayBillNumber || "",
        ewayBillValidTill: initialData.ewayBillValidTill ? formatDateForInput(initialData.ewayBillValidTill) as any : null,
        distance: (initialData.distance ?? "") as any,
        billNumber: initialData.billNumber || "",
      });
      const val = initialData.invoiceNumber || "";
      setInvoices(val ? val.split(",").map(s => s.trim()).filter(Boolean) : []);
    }
  }, [initialData, form]);

  const addInvoice = () => {
    const cleaned = invoiceInput.trim();
    if (cleaned && !invoices.includes(cleaned)) {
      setInvoices([...invoices, cleaned]);
      setInvoiceInput("");
    }
  };

  const removeInvoice = (invToRemove: string) => {
    setInvoices(invoices.filter(inv => inv !== invToRemove));
  };

  const handleInvoiceKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addInvoice();
    }
  };

  // Auto calculate balance
  const freight = watch("freightAmount") || 0;
  const advance = watch("advancePaid") || 0;
  const hamali = watch("hamaliCharges") || 0;
  const detention = watch("detentionCharges") || 0;

  useEffect(() => {
    const balance = Number(freight) + Number(detention) - Number(advance) - Number(hamali);
    setValue("balanceAmount", balance);
  }, [freight, advance, hamali, detention, setValue]);

  // Auto calculate E-Way Bill validity (100 km per day)
  const entryDate = watch("entryDate");
  const distance = watch("distance");

  useEffect(() => {
    if (entryDate && distance && Number(distance) > 0) {
      const daysOfValidity = Math.ceil(Number(distance) / 100);
      const expiryDate = new Date(entryDate);
      expiryDate.setDate(expiryDate.getDate() + (daysOfValidity - 1));
      setValue("ewayBillValidTill", formatDateForInput(expiryDate) as any);
    }
  }, [entryDate, distance, setValue]);

  async function onSubmit(values: z.infer<typeof vehicleEntrySchema>) {
    setIsLoading(true);
    
    // Set broker name
    const selectedBroker = brokers.find(b => b.id === values.brokerId);
    if (selectedBroker) {
      values.brokerName = selectedBroker.brokerName;
    }
    
    const result = initialData 
      ? await updateVehicleEntry(initialData.id, values, userId)
      : await createVehicleEntry(values, userId);
    
    setIsLoading(false);
    
    if (result.success) {
      toast.success(initialData ? "Vehicle entry updated successfully" : "Vehicle entry created successfully");
      if (onSuccess) {
        onSuccess();
      } else {
        router.push("/entries");
      }
    } else {
      toast.error(result.error || (initialData ? "Failed to update entry" : "Failed to create entry"));
    }
  }


  const selectItems = brokers.map((b) => ({ value: b.id, label: `${b.brokerName} (${b.mobile})` }));

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Side: Operations & Documents (Takes 7/12 cols) */}
        <div className="lg:col-span-7 space-y-8">
          
          {/* Basic Details */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-zinc-150 dark:border-zinc-800">
              <div className="h-1.5 w-3 rounded-full bg-zinc-400 dark:bg-zinc-650" />
              <h3 className="text-xs uppercase font-extrabold tracking-wider text-zinc-550 dark:text-zinc-405">Basic Details</h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="grid gap-1.5">
                <Label className="text-zinc-700 dark:text-zinc-300 font-medium">Vehicle Number *</Label>
                <Input {...form.register("vehicleNumber")} className="uppercase font-semibold tracking-wider text-zinc-950 dark:text-zinc-50" />
                {errors.vehicleNumber && <span className="text-[10px] text-red-500 mt-0.5">{errors.vehicleNumber.message}</span>}
              </div>
              <div className="grid gap-1.5">
                <Label className="text-zinc-700 dark:text-zinc-300 font-medium">Loading Date</Label>
                <Input {...form.register("loadingDate")} type="date" className="w-full text-zinc-900 dark:text-zinc-100 font-medium" />
                {errors.loadingDate && <span className="text-[10px] text-red-500 mt-0.5">{errors.loadingDate.message}</span>}
              </div>
              <div className="grid gap-1.5">
                <Label className="text-zinc-700 dark:text-zinc-300 font-medium">Broker *</Label>
                <div className="flex gap-2 items-center">
                  <div className="flex-1 min-w-0">
                    <Select 
                      value={watch("brokerId")} 
                      onValueChange={(val) => setValue("brokerId", val as string)}
                      items={selectItems}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select broker" />
                      </SelectTrigger>
                      <SelectContent>
                        {brokers.map((b) => (
                          <SelectItem key={b.id} value={b.id}>{b.brokerName} ({b.mobile})</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <AddBrokerDialog 
                    onSuccess={(id) => {
                      setValue("brokerId", id);
                    }}
                    trigger={
                      <Button 
                        type="button" 
                        variant="outline" 
                        size="icon" 
                        className="h-8 w-8 shrink-0 bg-white/80 dark:bg-zinc-950/80 hover:bg-zinc-100 dark:hover:bg-zinc-900 hover:text-zinc-900 dark:hover:text-zinc-100 border-zinc-200 dark:border-zinc-800" 
                        title="Quick Add Broker"
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </Button>
                    }
                  />
                </div>
                {errors.brokerId && <span className="text-[10px] text-red-500 mt-0.5">{errors.brokerId.message}</span>}
              </div>
              <div className="grid gap-1.5">
                <Label className="text-zinc-700 dark:text-zinc-300 font-medium">Driver Name *</Label>
                <Input {...form.register("driverName")} className="text-zinc-900 dark:text-zinc-100" />
                {errors.driverName && <span className="text-[10px] text-red-500 mt-0.5">{errors.driverName.message}</span>}
              </div>
              <div className="grid gap-1.5">
                <Label className="text-zinc-700 dark:text-zinc-300 font-medium">Driver Mobile *</Label>
                <Input {...form.register("driverMobile")} type="tel" className="font-mono text-zinc-900 dark:text-zinc-100" />
                {errors.driverMobile && <span className="text-[10px] text-red-500 mt-0.5">{errors.driverMobile.message}</span>}
              </div>
              <div className="grid gap-1.5">
                <Label className="text-zinc-700 dark:text-zinc-300 font-medium">From Location *</Label>
                <Input {...form.register("fromLocation")} className="text-zinc-900 dark:text-zinc-100" />
              </div>
              <div className="grid gap-1.5">
                <Label className="text-zinc-700 dark:text-zinc-300 font-medium">Destination *</Label>
                <Input {...form.register("toDestination")} className="text-zinc-900 dark:text-zinc-100" />
              </div>
              <div className="grid gap-1.5">
                <Label className="text-zinc-700 dark:text-zinc-300 font-medium">Pickup Company</Label>
                <Input {...form.register("pickupCompany")} placeholder="Pickup company name" className="text-zinc-900 dark:text-zinc-100" />
              </div>
              <div className="grid gap-1.5">
                <Label className="text-zinc-700 dark:text-zinc-300 font-medium">Delivery Company</Label>
                <Input {...form.register("deliveryCompany")} placeholder="Delivery company name" className="text-zinc-900 dark:text-zinc-100" />
              </div>
              <div className="grid gap-1.5">
                <Label className="text-zinc-700 dark:text-zinc-300 font-medium">Delivery Status</Label>
                <Select 
                  value={watch("deliveryStatus")} 
                  onValueChange={(val) => setValue("deliveryStatus", val as any)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select delivery status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="IN_TRANSIT">In Transit</SelectItem>
                    <SelectItem value="DELIVERED">Delivered</SelectItem>
                    <SelectItem value="CANCELLED">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-1.5">
                <Label className="text-zinc-700 dark:text-zinc-300 font-medium">Mode</Label>
                <Select 
                  value={watch("mode")} 
                  onValueChange={(val) => setValue("mode", val as any)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select mode" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="NORMAL">Normal</SelectItem>
                    <SelectItem value="EXPRESS">Express</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              </div>
            </div>

          {/* Document Details */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-zinc-150 dark:border-zinc-800">
              <div className="h-1.5 w-3 rounded-full bg-zinc-400 dark:bg-zinc-650" />
              <h3 className="text-xs uppercase font-extrabold tracking-wider text-zinc-550 dark:text-zinc-405">Document Details</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="grid gap-1.5">
                <Label className="text-zinc-700 dark:text-zinc-300 font-medium">LR Number *</Label>
                <Input {...form.register("lrNumber")} className="font-mono font-semibold text-zinc-950 dark:text-zinc-50" />
                {errors.lrNumber && <span className="text-[10px] text-red-500 mt-0.5">{errors.lrNumber.message}</span>}
              </div>

              <div className="grid gap-1.5">
                <Label className="text-zinc-700 dark:text-zinc-300 font-medium">Weight (MT) *</Label>
                <Input {...form.register("weight", { valueAsNumber: true })} type="number" step="0.01" className="text-zinc-900 dark:text-zinc-100" />
                {errors.weight && <span className="text-[10px] text-red-500 mt-0.5">{errors.weight.message}</span>}
              </div>

              <div className="grid gap-1.5">
                <Label className="text-zinc-700 dark:text-zinc-300 font-medium">Package Count</Label>
                <Input {...form.register("packageCount", { valueAsNumber: true })} type="number" className="text-zinc-900 dark:text-zinc-100" />
              </div>

              <div className="grid gap-1.5">
                <Label className="text-zinc-700 dark:text-zinc-300 font-medium">Distance (km)</Label>
                <Input {...form.register("distance", { valueAsNumber: true })} type="number" placeholder="e.g. 700" className="text-zinc-900 dark:text-zinc-100" />
              </div>
              
              {/* Multiple Invoice Input */}
              <div className="grid gap-1.5 sm:col-span-2">
                <Label className="text-zinc-700 dark:text-zinc-300 font-medium">Invoice Number(s)</Label>
                <div className="flex gap-2">
                  <Input
                    value={invoiceInput}
                    onChange={(e) => setInvoiceInput(e.target.value)}
                    onKeyDown={handleInvoiceKeyDown}
                    placeholder="Type invoice no. & press Add"
                    className="flex-1 text-zinc-900 dark:text-zinc-100"
                  />
                  <Button 
                    type="button" 
                    variant="secondary" 
                    onClick={addInvoice} 
                    className="h-8 shrink-0 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-750 text-zinc-850 dark:text-zinc-200"
                  >
                    Add
                  </Button>
                </div>
                <div className="flex flex-wrap gap-1.5 mt-1.5 max-h-[85px] overflow-y-auto p-2 border border-zinc-200 dark:border-zinc-800 rounded-lg min-h-[38px] bg-zinc-50/50 dark:bg-zinc-900/50">
                  {invoices.length > 0 ? (
                    invoices.map((inv, idx) => (
                      <Badge 
                        key={idx} 
                        variant="secondary" 
                        className="bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-355 border border-zinc-200/50 dark:border-zinc-750 flex items-center gap-1.5 py-0.5 px-2 rounded-md text-[11px] font-mono font-medium"
                      >
                        {inv}
                        <button
                          type="button"
                          onClick={() => removeInvoice(inv)}
                          className="text-zinc-400 hover:text-zinc-650 dark:text-zinc-500 dark:hover:text-zinc-300 transition-colors focus:outline-none"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))
                  ) : (
                    <span className="text-[11px] text-zinc-400 dark:text-zinc-500 italic px-1 self-center">No invoices added yet</span>
                  )}
                </div>
              </div>

              <div className="grid gap-1.5">
                <Label className="text-zinc-700 dark:text-zinc-300 font-medium">E-Way Bill Number</Label>
                <Input {...form.register("ewayBillNumber")} className="font-mono text-zinc-900 dark:text-zinc-100" />
              </div>

              <div className="grid gap-1.5">
                <Label className="text-zinc-700 dark:text-zinc-300 font-medium">E-Way Bill Valid Till</Label>
                <Input {...form.register("ewayBillValidTill")} type="date" className="w-full text-zinc-900 dark:text-zinc-100 font-medium" />
                {watch("ewayBillValidTill") && (
                  <p className="text-[10px] text-amber-600 dark:text-amber-400 font-medium flex items-center gap-1 mt-0.5">
                    <span className="inline-block w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                    Expiry Reminders Enabled
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Financial Ledger & Notes (Takes 5/12 cols) */}
        <div className="lg:col-span-5 space-y-6 bg-zinc-50/50 dark:bg-zinc-900/10 border border-zinc-200/70 dark:border-zinc-800/80 rounded-xl p-5 shadow-sm">
          <div className="flex items-center gap-2 pb-2 border-b border-zinc-150 dark:border-zinc-800">
            <div className="h-1.5 w-3 rounded-full bg-zinc-450 dark:bg-zinc-600" />
            <h3 className="text-xs uppercase font-extrabold tracking-wider text-zinc-550 dark:text-zinc-405">Payment Ledger</h3>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="grid gap-1.5">
              <Label className="text-zinc-700 dark:text-zinc-300 font-medium">Freight Amount (₹)</Label>
              <Input {...form.register("freightAmount", { valueAsNumber: true })} type="number" className="font-semibold text-zinc-900 dark:text-zinc-100" />
            </div>
            <div className="grid gap-1.5">
              <Label className="text-zinc-700 dark:text-zinc-300 font-medium">Detention Charges (₹)</Label>
              <Input {...form.register("detentionCharges", { valueAsNumber: true })} type="number" className="font-semibold text-zinc-900 dark:text-zinc-100" />
            </div>
            <div className="grid gap-1.5">
              <Label className="text-zinc-700 dark:text-zinc-300 font-medium">Advance Paid (₹)</Label>
              <Input {...form.register("advancePaid", { valueAsNumber: true })} type="number" className="font-semibold text-zinc-900 dark:text-zinc-100" />
            </div>
            <div className="grid gap-1.5">
              <Label className="text-zinc-700 dark:text-zinc-300 font-medium">Hamali Charges (₹)</Label>
              <Input {...form.register("hamaliCharges", { valueAsNumber: true })} type="number" className="font-semibold text-zinc-900 dark:text-zinc-100" />
            </div>
            
            <div className="grid gap-1.5">
              <Label className="text-zinc-800 dark:text-zinc-200 font-bold">Balance Outstanding (₹)</Label>
              <Input 
                {...form.register("balanceAmount", { valueAsNumber: true })} 
                type="number" 
                readOnly 
                className="bg-zinc-100/60 dark:bg-zinc-900/60 font-extrabold text-zinc-950 dark:text-zinc-50 border-dashed border-zinc-300 dark:border-zinc-700" 
              />
            </div>
            <div className="grid gap-1.5">
              <Label className="text-zinc-700 dark:text-zinc-300 font-medium">Balance Paid Date</Label>
              <Input {...form.register("balancePaidDate")} type="date" className="w-full text-zinc-900 dark:text-zinc-100" />
            </div>
            <div className="grid gap-1.5 sm:col-span-2">
              <Label className="text-zinc-700 dark:text-zinc-300 font-medium">Remarks / Notes</Label>
              <Input {...form.register("remarks")} placeholder="Enter any extra details, remarks..." className="w-full text-zinc-900 dark:text-zinc-100" />
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-end pt-4 border-t border-zinc-150 dark:border-zinc-800">
        <Button type="button" variant="outline" className="mr-3" onClick={() => router.back()}>Cancel</Button>
        <Button type="submit" disabled={isLoading} className="bg-zinc-900 hover:bg-zinc-850 text-white dark:bg-zinc-100 dark:hover:bg-zinc-200 dark:text-zinc-900">
          {isLoading ? "Saving..." : <><Save className="w-4 h-4 mr-2" /> Save Entry</>}
        </Button>
      </div>
    </form>
  );
}
