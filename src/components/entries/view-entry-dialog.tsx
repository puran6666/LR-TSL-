"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Eye, Truck, Calendar, MapPin, User, Phone, FileText, Layers, IndianRupee, Clock, ArrowRight } from "lucide-react";
import { VehicleEntry } from "@prisma/client";
import { format } from "date-fns";

interface ViewEntryDialogProps {
  entry: VehicleEntry;
  trigger?: React.ReactElement;
}

export function ViewEntryDialog({ entry, trigger }: ViewEntryDialogProps) {
  const [open, setOpen] = useState(false);

  const formattedBal = new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(entry.balanceAmount);

  const formattedFreight = new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(entry.freightAmount);

  const formattedBilling = new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format((entry as any).billingAmount || 0);

  const formattedDetention = new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(entry.detentionCharges || 0);

  const formattedAdvance = new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(entry.advancePaid);

  const formattedHamali = new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(entry.hamaliCharges || 0);

  const isPaid = entry.balanceAmount <= 0;
  const invoices = entry.invoiceNumber
    ? entry.invoiceNumber.split(",").map((s) => s.trim()).filter(Boolean)
    : [];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          trigger || (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 hover:bg-zinc-100 dark:hover:bg-zinc-900 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
              title="View Entry Details"
            >
              <Eye className="h-4 w-4" />
            </Button>
          )
        }
      />
      <DialogContent className="sm:max-w-3xl lg:max-w-4xl xl:max-w-5xl w-[calc(100%-2rem)] max-h-[90vh] overflow-y-auto border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 shadow-xl">
        <DialogHeader className="border-b pb-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-zinc-100 dark:bg-zinc-900 text-zinc-700 dark:text-zinc-350 border border-zinc-200 dark:border-zinc-800">
                <Truck className="h-6 w-6 animate-pulse" />
              </div>
              <div>
                <DialogTitle className="text-xl font-bold uppercase tracking-wide text-zinc-900 dark:text-zinc-50">
                  {entry.vehicleNumber}
                </DialogTitle>
                <DialogDescription className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                  LR Number: <span className="font-mono font-semibold text-zinc-700 dark:text-zinc-300">{entry.lrNumber}</span> | Reported on {format(new Date(entry.entryDate), "dd MMM yyyy")}{entry.loadingDate ? ` | Loaded on ${format(new Date(entry.loadingDate), "dd MMM yyyy")}` : ""}
                </DialogDescription>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={isPaid ? "default" : "destructive"} className={`text-xs py-0.5 px-2.5 font-bold border-none text-white ${
                isPaid ? "bg-emerald-500" : "bg-rose-500 animate-pulse"
              }`}>
                {isPaid ? "PAID" : "PENDING"}
              </Badge>
              <Badge variant="outline" className="text-xs uppercase bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 py-0.5 px-2.5">
                {entry.deliveryStatus}
              </Badge>
              {((entry as any).mode === "EXPRESS") ? (
                <Badge variant="outline" className="text-xs py-0.5 px-2.5 bg-amber-500/10 border-amber-500/20 text-amber-600 dark:text-amber-400 uppercase font-bold">
                  Express
                </Badge>
              ) : (
                <Badge variant="outline" className="text-xs py-0.5 px-2.5 bg-zinc-100 border-zinc-200 dark:bg-zinc-800 dark:border-zinc-700 text-zinc-500 dark:text-zinc-400 uppercase font-bold">
                  Normal
                </Badge>
              )}
            </div>
          </div>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
          {/* Left Column: Basic Details */}
          <div className="space-y-4">
            <div className="bg-zinc-50/50 dark:bg-zinc-900/30 border border-zinc-100 dark:border-zinc-900 rounded-xl p-4">
              <h4 className="text-xs uppercase font-extrabold text-zinc-400 dark:text-zinc-500 mb-3 flex items-center gap-1.5">
                <User className="h-3.5 w-3.5" /> Dispatch & Route
              </h4>
              <div className="space-y-2.5 text-sm">
                <div className="flex justify-between">
                  <span className="text-zinc-400">Broker:</span>
                  <span className="font-semibold text-zinc-800 dark:text-zinc-200">{entry.brokerName}</span>
                </div>
                {(entry as any).broker?.mobile && (
                  <div className="flex justify-between">
                    <span className="text-zinc-400">Broker Contact:</span>
                    <span className="font-mono font-semibold text-zinc-800 dark:text-zinc-200">{(entry as any).broker.mobile}</span>
                  </div>
                )}
                <div className="flex justify-between items-center">
                  <span className="text-zinc-400">Route:</span>
                  <span className="font-semibold text-zinc-800 dark:text-zinc-200 flex items-center gap-1">
                    {entry.fromLocation} <ArrowRight className="h-3 w-3 text-zinc-400 mx-0.5" /> {entry.toDestination}
                  </span>
                </div>
                {entry.loadingDate && (
                  <div className="flex justify-between">
                    <span className="text-zinc-400">Loading Date:</span>
                    <span className="font-semibold text-zinc-850 dark:text-zinc-200">{format(new Date(entry.loadingDate), "dd MMM yyyy")}</span>
                  </div>
                )}
                {entry.distance && (
                  <div className="flex justify-between">
                    <span className="text-zinc-400">Distance:</span>
                    <span className="font-semibold text-zinc-800 dark:text-zinc-200">{entry.distance} km</span>
                  </div>
                )}
                {entry.pickupCompany && (
                  <div className="flex justify-between">
                    <span className="text-zinc-400">Pickup Company:</span>
                    <span className="font-semibold text-zinc-850 dark:text-zinc-200">{entry.pickupCompany}</span>
                  </div>
                )}
                {entry.deliveryCompany && (
                  <div className="flex justify-between">
                    <span className="text-zinc-400">Delivery Company:</span>
                    <span className="font-semibold text-zinc-850 dark:text-zinc-200">{entry.deliveryCompany}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-zinc-400">Driver:</span>
                  <span className="font-semibold text-zinc-800 dark:text-zinc-200">{entry.driverName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-400">Driver Mobile:</span>
                  <span className="font-mono text-zinc-800 dark:text-zinc-200">{entry.driverMobile}</span>
                </div>
              </div>
            </div>

            <div className="bg-zinc-50/50 dark:bg-zinc-900/30 border border-zinc-100 dark:border-zinc-900 rounded-xl p-4">
              <h4 className="text-xs uppercase font-extrabold text-zinc-400 dark:text-zinc-500 mb-3 flex items-center gap-1.5">
                <FileText className="h-3.5 w-3.5" /> Document & Cargo Details
              </h4>
              <div className="space-y-2.5 text-sm">
                <div>
                  <span className="text-zinc-400 block mb-1.5">Invoice Number(s):</span>
                  {invoices.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {invoices.map((inv, idx) => (
                        <Badge 
                          key={idx} 
                          variant="secondary" 
                          className="bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 border border-zinc-200/55 dark:border-zinc-750 font-mono text-[11px] py-0.5 px-2 rounded-md"
                        >
                          {inv}
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    <span className="text-zinc-400 dark:text-zinc-500 italic text-xs">No invoices listed</span>
                  )}
                </div>
                <div className="flex justify-between pt-1">
                  <span className="text-zinc-400">Cargo Weight:</span>
                  <span className="font-semibold text-zinc-800 dark:text-zinc-200">{entry.weight} MT</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-400">Package Count:</span>
                  <span className="font-semibold text-zinc-800 dark:text-zinc-200">{entry.packageCount} PKGS</span>
                </div>
                {entry.ewayBillNumber && (
                  <>
                    <div className="flex justify-between border-t border-zinc-100 dark:border-zinc-900 pt-2">
                      <span className="text-zinc-400">E-Way Bill:</span>
                      <span className="font-mono font-semibold text-zinc-800 dark:text-zinc-200">{entry.ewayBillNumber}</span>
                    </div>
                    {entry.ewayBillValidTill && (
                      <div className="flex justify-between">
                        <span className="text-zinc-400">Valid Expiry Till:</span>
                        <span className="font-semibold text-zinc-800 dark:text-zinc-200 text-amber-600 dark:text-amber-400">
                          {format(new Date(entry.ewayBillValidTill), "dd MMM yyyy, hh:mm a")}
                        </span>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Right Column: Financial Ledger */}
          <div className="space-y-4">
            <div className="bg-gradient-to-br from-zinc-50/70 to-zinc-100/50 dark:from-zinc-900/40 dark:to-zinc-900/10 border border-zinc-200/60 dark:border-zinc-800 rounded-xl p-5 shadow-sm">
              <h4 className="text-xs uppercase font-extrabold text-zinc-400 dark:text-zinc-500 mb-4 flex items-center gap-1.5">
                <IndianRupee className="h-3.5 w-3.5" /> Financial Ledger
              </h4>
              <div className="space-y-3 text-sm">
                {(entry as any).billingAmount > 0 && (
                  <div className="flex justify-between items-center text-blue-600 dark:text-blue-400 font-bold bg-blue-50 dark:bg-blue-900/20 p-2 rounded-lg mb-2">
                    <span>Total Billing Amount:</span>
                    <span>{formattedBilling}</span>
                  </div>
                )}
                <div className="flex justify-between items-center text-zinc-600 dark:text-zinc-400">
                  <span>Broker Amount:</span>
                  <span className="font-semibold text-zinc-800 dark:text-zinc-100">{formattedFreight}</span>
                </div>
                <div className="flex justify-between items-center text-zinc-600 dark:text-zinc-400">
                  <span>Detention Charges:</span>
                  <span className="font-semibold text-emerald-600 dark:text-emerald-500">+ {formattedDetention}</span>
                </div>
                <div className="flex justify-between items-center text-zinc-600 dark:text-zinc-400">
                  <span>Advance Paid:</span>
                  <span className="font-semibold text-rose-600 dark:text-rose-500">- {formattedAdvance}</span>
                </div>
                <div className="flex justify-between items-center text-zinc-600 dark:text-zinc-400 pb-3 border-b border-zinc-200/60 dark:border-zinc-800">
                  <span>Hamali Charges Paid:</span>
                  <span className="font-semibold text-rose-600 dark:text-rose-500">- {formattedHamali}</span>
                </div>
                <div className="flex justify-between items-center pt-2">
                  <span className="font-bold text-zinc-800 dark:text-zinc-200">Net Outstanding Balance:</span>
                  <span className={`text-base font-extrabold ${isPaid ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-500"}`}>
                    {formattedBal}
                  </span>
                </div>
                {isPaid && entry.balancePaidDate && (
                  <div className="flex justify-between items-center text-xs text-emerald-600 dark:text-emerald-400 font-semibold bg-emerald-500/5 border border-emerald-500/10 rounded-lg p-2 mt-2">
                    <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> Full Payment Settled On:</span>
                    <span>{format(new Date(entry.balancePaidDate), "dd MMM yyyy")}</span>
                  </div>
                )}
              </div>
            </div>

            {entry.remarks && (
              <div className="bg-zinc-50/50 dark:bg-zinc-900/30 border border-zinc-100 dark:border-zinc-900 rounded-xl p-4">
                <h4 className="text-xs uppercase font-extrabold text-zinc-400 dark:text-zinc-500 mb-2">
                  Remarks / Notes
                </h4>
                <p className="text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed italic whitespace-pre-wrap bg-white dark:bg-zinc-950 p-2.5 border border-zinc-100 dark:border-zinc-900 rounded-lg">
                  "{entry.remarks}"
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end border-t pt-4">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Close Details
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
