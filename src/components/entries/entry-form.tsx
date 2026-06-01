"use client";

import { useState, useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useRouter } from "next/navigation";
import { createVehicleEntry, updateVehicleEntry } from "@/actions/entry-actions";
import { vehicleEntrySchema } from "@/lib/schemas";
import { Broker, VehicleEntry } from "@prisma/client";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { toast } from "sonner";
import { Save, Plus, X, Check, ChevronsUpDown, Truck, FileText, IndianRupee } from "lucide-react";
import { AddBrokerDialog } from "@/components/brokers/add-broker-dialog";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

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
  const [ewayBills, setEwayBills] = useState<string[]>(() => {
    const val = initialData?.ewayBillNumber || "";
    return val ? val.split(",").map(s => s.trim()).filter(Boolean) : [];
  });
  const [ewayBillInput, setEwayBillInput] = useState("");
  
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
      packages: ((initialData as any)?.packages as any[]) || [],
      weightUnit: ((initialData as any)?.weightUnit) || "MT",
      grossWeight: ((initialData as any)?.grossWeight) || undefined,
      actualWeight: ((initialData as any)?.actualWeight) || undefined,
      freightAmount: initialData?.freightAmount || 0,
      billingAmount: (initialData as any)?.billingAmount || 0,
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

  const { watch, setValue, handleSubmit, control, formState: { errors } } = form;

  const { fields: packageFields, append: appendPackage, remove: removePackage } = useFieldArray({
    control,
    name: "packages",
  });

  // Auto calculate packageCount
  const watchedPackages = watch("packages");
  useEffect(() => {
    if (watchedPackages && watchedPackages.length > 0) {
      const total = watchedPackages.reduce((sum, pkg) => sum + (Number(pkg.quantity) || 0), 0);
      setValue("packageCount", total);
    }
  }, [watchedPackages, setValue]);

  // Sync actualWeight to legacy weight
  const watchedActualWeight = watch("actualWeight");
  useEffect(() => {
    if (watchedActualWeight !== undefined && !isNaN(watchedActualWeight)) {
      setValue("weight", watchedActualWeight);
    }
  }, [watchedActualWeight, setValue]);

  // Auto calculate E-Way Bill validity date
  const watchedDistance = watch("distance");
  const watchedLoadingDate = watch("loadingDate");
  useEffect(() => {
    if (watchedDistance && watchedLoadingDate) {
      const distance = Number(watchedDistance);
      if (!isNaN(distance) && distance > 0) {
        const validityDays = Math.ceil(distance / 200);
        const loadingDateObj = new Date(watchedLoadingDate);
        
        if (!isNaN(loadingDateObj.getTime())) {
          loadingDateObj.setDate(loadingDateObj.getDate() + validityDays);
          const newValidTill = loadingDateObj.toISOString().split("T")[0];
          
          const currentValidTill = form.getValues("ewayBillValidTill");
          if (currentValidTill !== newValidTill) {
            setValue("ewayBillValidTill", newValidTill as any, { shouldValidate: true, shouldDirty: true });
          }
        }
      }
    }
  }, [watchedDistance, watchedLoadingDate, form, setValue]);

  // Sync invoices array to invoiceNumber input form field
  useEffect(() => {
    setValue("invoiceNumber", invoices.join(", "));
  }, [invoices, setValue]);

  // Sync ewayBills array to form field
  useEffect(() => {
    setValue("ewayBillNumber", ewayBills.join(", "));
  }, [ewayBills, setValue]);

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
        billingAmount: (initialData as any).billingAmount || 0,
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
      const ewayVal = initialData.ewayBillNumber || "";
      setEwayBills(ewayVal ? ewayVal.split(",").map(s => s.trim()).filter(Boolean) : []);
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

  const addEwayBill = () => {
    const cleaned = ewayBillInput.trim();
    if (cleaned && !ewayBills.includes(cleaned)) {
      setEwayBills([...ewayBills, cleaned]);
      setEwayBillInput("");
    }
  };

  const removeEwayBill = (billToRemove: string) => {
    setEwayBills(ewayBills.filter(bill => bill !== billToRemove));
  };

  const handleEwayBillKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addEwayBill();
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
          <Card className="shadow-sm border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden">
            <CardHeader className="bg-zinc-50/50 dark:bg-zinc-900/30 border-b border-zinc-100 dark:border-zinc-800 pb-4">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-md bg-blue-500/10 text-blue-600 dark:text-blue-400">
                  <Truck className="h-4 w-4" />
                </div>
                <div>
                  <CardTitle className="text-sm uppercase font-extrabold tracking-wider text-zinc-800 dark:text-zinc-200">Dispatch & Vehicle Details</CardTitle>
                  <CardDescription className="text-xs mt-0.5">Primary information for the vehicle dispatch</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="grid gap-1.5">
                <Label className="text-zinc-700 dark:text-zinc-300 font-medium">Vehicle Number *</Label>
                <Input {...form.register("vehicleNumber")} className="uppercase font-semibold tracking-wider text-zinc-950 dark:text-zinc-50" />
                {errors.vehicleNumber && <span className="text-[10px] text-red-500 mt-0.5">{errors.vehicleNumber.message}</span>}
                {(initialData as any)?.previousVehicleNumber && (
                  <span className="text-[10px] text-amber-600 dark:text-amber-500 font-medium">
                    (Previous: {(initialData as any).previousVehicleNumber})
                  </span>
                )}
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
                    <Popover>
                    <PopoverTrigger
                      role="combobox"
                      className={cn(
                        buttonVariants({ variant: "outline" }),
                        "w-full justify-between font-normal bg-white dark:bg-zinc-950",
                        !watch("brokerId") && "text-muted-foreground"
                      )}
                    >
                      {watch("brokerId")
                        ? `${brokers.find((b) => b.id === watch("brokerId"))?.brokerName} (${brokers.find((b) => b.id === watch("brokerId"))?.mobile})`
                        : "Select broker..."}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </PopoverTrigger>
                    <PopoverContent className="w-[300px] p-0" align="start">
                      <Command>
                        <CommandInput placeholder="Search broker name or mobile..." />
                        <CommandList>
                          <CommandEmpty>No broker found.</CommandEmpty>
                          <CommandGroup>
                            {brokers.map((b) => (
                              <CommandItem
                                key={b.id}
                                value={`${b.brokerName} ${b.mobile} ${b.id}`}
                                onSelect={() => {
                                  setValue("brokerId", b.id);
                                }}
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    b.id === watch("brokerId") ? "opacity-100" : "opacity-0"
                                  )}
                                />
                                {b.brokerName} ({b.mobile})
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
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
                    <SelectItem value="WAITING_FOR_UNLOADING">Waiting for Unloading</SelectItem>
                    <SelectItem value="UNLOADED">Unloaded</SelectItem>
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
            </CardContent>
          </Card>

          {/* Document Details */}
          <Card className="shadow-sm border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden">
            <CardHeader className="bg-zinc-50/50 dark:bg-zinc-900/30 border-b border-zinc-100 dark:border-zinc-800 pb-4">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                  <FileText className="h-4 w-4" />
                </div>
                <div>
                  <CardTitle className="text-sm uppercase font-extrabold tracking-wider text-zinc-800 dark:text-zinc-200">Cargo & Documents</CardTitle>
                  <CardDescription className="text-xs mt-0.5">E-way bills, invoice numbers, and cargo details</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="grid gap-1.5">
                <Label className="text-zinc-700 dark:text-zinc-300 font-medium">LR Number *</Label>
                <Input {...form.register("lrNumber")} className="font-mono font-semibold text-zinc-950 dark:text-zinc-50" />
                {errors.lrNumber && <span className="text-[10px] text-red-500 mt-0.5">{errors.lrNumber.message}</span>}
              </div>

              {/* Weight Details */}
              <div className="grid gap-1.5 sm:col-span-2 border border-zinc-100 dark:border-zinc-800/60 p-3 rounded-lg bg-zinc-50/50 dark:bg-zinc-900/20">
                <div className="flex justify-between items-center mb-1">
                  <Label className="text-zinc-700 dark:text-zinc-300 font-bold uppercase text-[10px] tracking-wider">Weight Details</Label>
                  <div className="flex items-center bg-zinc-200/50 dark:bg-zinc-800 p-0.5 rounded-md">
                    <Button 
                      type="button" 
                      variant="ghost" 
                      onClick={() => setValue("weightUnit", "MT")}
                      className={cn("h-6 px-3 text-[10px] font-bold rounded-sm transition-all", watch("weightUnit") === "MT" ? "bg-white dark:bg-zinc-700 shadow-sm text-zinc-900 dark:text-white" : "text-zinc-500")}
                    >MT</Button>
                    <Button 
                      type="button" 
                      variant="ghost" 
                      onClick={() => setValue("weightUnit", "KG")}
                      className={cn("h-6 px-3 text-[10px] font-bold rounded-sm transition-all", watch("weightUnit") === "KG" ? "bg-white dark:bg-zinc-700 shadow-sm text-zinc-900 dark:text-white" : "text-zinc-500")}
                    >KG</Button>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="grid gap-1.5">
                    <Label className="text-zinc-600 dark:text-zinc-400 font-medium text-xs">Gross Weight</Label>
                    <Input {...form.register("grossWeight", { valueAsNumber: true })} type="number" step="0.01" className="text-zinc-900 dark:text-zinc-100" />
                  </div>
                  <div className="grid gap-1.5">
                    <Label className="text-zinc-600 dark:text-zinc-400 font-medium text-xs">Actual Weight *</Label>
                    <Input {...form.register("actualWeight", { valueAsNumber: true })} type="number" step="0.01" className="text-zinc-900 dark:text-zinc-100" />
                    {errors.actualWeight && <span className="text-[10px] text-red-500 mt-0.5">{errors.actualWeight.message}</span>}
                    {/* Hidden legacy weight input to keep validation passing if they rely on it */}
                    <input type="hidden" {...form.register("weight", { valueAsNumber: true })} />
                  </div>
                </div>
              </div>

              {/* Dynamic Packages */}
              <div className="grid gap-2 sm:col-span-2 mt-2">
                <div className="flex justify-between items-center pb-2 border-b border-zinc-100 dark:border-zinc-800">
                  <Label className="text-zinc-700 dark:text-zinc-300 font-bold uppercase text-[10px] tracking-wider">Packages (Total: {watch("packageCount") || 0})</Label>
                  <Button type="button" variant="outline" size="sm" onClick={() => appendPackage({ dieName: "", quantity: 1, description: "" })} className="h-7 text-xs bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800">
                    <Plus className="h-3 w-3 mr-1" /> Add Package
                  </Button>
                </div>
                
                {/* Hidden legacy input */}
                <input type="hidden" {...form.register("packageCount", { valueAsNumber: true })} />

                <div className="space-y-2">
                  {packageFields.map((field, index) => (
                    <div key={field.id} className="grid grid-cols-[1.5fr_80px_1fr_auto] gap-2 items-start bg-zinc-50 dark:bg-zinc-900/30 p-2 rounded-lg border border-zinc-200 dark:border-zinc-800/80">
                      <div className="space-y-1">
                        {index === 0 && <Label className="text-[10px] text-zinc-500 uppercase">Die Name</Label>}
                        <Input {...form.register(`packages.${index}.dieName`)} placeholder="e.g. Mold A" className="h-8 text-xs bg-white dark:bg-zinc-950" />
                      </div>
                      <div className="space-y-1">
                        {index === 0 && <Label className="text-[10px] text-zinc-500 uppercase">Qty *</Label>}
                        <Input {...form.register(`packages.${index}.quantity`, { valueAsNumber: true })} type="number" min="1" placeholder="Qty" className="h-8 text-xs bg-white dark:bg-zinc-950" />
                      </div>
                      <div className="space-y-1">
                        {index === 0 && <Label className="text-[10px] text-zinc-500 uppercase">Description</Label>}
                        <Input {...form.register(`packages.${index}.description`)} placeholder="Notes..." className="h-8 text-xs bg-white dark:bg-zinc-950" />
                      </div>
                      <div className={cn("flex items-center", index === 0 ? "mt-5" : "mt-0")}>
                        <Button type="button" variant="ghost" size="icon" onClick={() => removePackage(index)} className="h-8 w-8 text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10">
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                  {packageFields.length === 0 && (
                    <div className="text-center py-6 px-4 rounded-lg border border-dashed border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/20">
                      <p className="text-xs text-zinc-500">No packages added yet. Click &quot;Add Package&quot; to specify die names and quantities.</p>
                    </div>
                  )}
                </div>
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

              {/* Multiple E-Way Bill Input */}
              <div className="grid gap-1.5 sm:col-span-2">
                <Label className="text-zinc-700 dark:text-zinc-300 font-medium">E-Way Bill Number(s)</Label>
                <div className="flex gap-2">
                  <Input
                    value={ewayBillInput}
                    onChange={(e) => setEwayBillInput(e.target.value)}
                    onKeyDown={handleEwayBillKeyDown}
                    placeholder="Type e-way bill no. & press Add"
                    className="flex-1 font-mono text-zinc-900 dark:text-zinc-100"
                  />
                  <Button 
                    type="button" 
                    variant="secondary" 
                    onClick={addEwayBill} 
                    className="h-8 shrink-0 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-750 text-zinc-850 dark:text-zinc-200"
                  >
                    Add
                  </Button>
                </div>
                <div className="flex flex-wrap gap-1.5 mt-1.5 max-h-[85px] overflow-y-auto p-2 border border-zinc-200 dark:border-zinc-800 rounded-lg min-h-[38px] bg-zinc-50/50 dark:bg-zinc-900/50">
                  {ewayBills.length > 0 ? (
                    ewayBills.map((bill, idx) => (
                      <Badge 
                        key={idx} 
                        variant="secondary" 
                        className="bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-355 border border-zinc-200/50 dark:border-zinc-750 flex items-center gap-1.5 py-0.5 px-2 rounded-md text-[11px] font-mono font-medium"
                      >
                        {bill}
                        <button
                          type="button"
                          onClick={() => removeEwayBill(bill)}
                          className="text-zinc-400 hover:text-zinc-650 dark:text-zinc-500 dark:hover:text-zinc-300 transition-colors focus:outline-none"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))
                  ) : (
                    <span className="text-[11px] text-zinc-400 dark:text-zinc-500 italic px-1 self-center">No E-Way Bills added yet</span>
                  )}
                </div>
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
            </CardContent>
          </Card>
        </div>

        {/* Right Side: Financial Ledger & Notes (Takes 5/12 cols) */}
        <div className="lg:col-span-5 space-y-6">
          <Card className="shadow-sm border-zinc-200/80 dark:border-zinc-800 rounded-xl overflow-hidden bg-gradient-to-br from-white to-zinc-50/50 dark:from-zinc-950 dark:to-zinc-900/20">
            <CardHeader className="bg-zinc-50/80 dark:bg-zinc-900/50 border-b border-zinc-100 dark:border-zinc-800 pb-4">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400">
                  <IndianRupee className="h-4 w-4" />
                </div>
                <div>
                  <CardTitle className="text-sm uppercase font-extrabold tracking-wider text-zinc-800 dark:text-zinc-200">Payment Ledger</CardTitle>
                  <CardDescription className="text-xs mt-0.5">Billing, Broker, and advance amounts</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="grid gap-1.5 sm:col-span-2 border-b border-dashed border-zinc-200 dark:border-zinc-800 pb-4 mb-2">
              <Label className="text-zinc-700 dark:text-zinc-300 font-bold">Total Freight Charge (Billing Amount) ₹</Label>
              <Input {...form.register("billingAmount", { valueAsNumber: true })} type="number" className="font-bold text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-900 bg-blue-50/50 dark:bg-blue-900/10" placeholder="Amount to bill the company" />
            </div>

            <div className="grid gap-1.5">
              <Label className="text-zinc-700 dark:text-zinc-300 font-medium">Broker Amount (₹)</Label>
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
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="flex justify-end pt-5 border-t border-zinc-150 dark:border-zinc-800">
        <Button type="button" variant="ghost" className="mr-3 hover:bg-zinc-100 dark:hover:bg-zinc-900" onClick={() => router.back()}>Cancel</Button>
        <Button type="submit" disabled={isLoading} className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-500/20 px-8 rounded-lg font-bold">
          {isLoading ? "Saving..." : <><Save className="w-4 h-4 mr-2" /> {initialData ? "Update Entry" : "Save Entry"}</>}
        </Button>
      </div>
    </form>
  );
}
