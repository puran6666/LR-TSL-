"use client";

import { ColumnDef } from "@tanstack/react-table";
import { VehicleEntry } from "@prisma/client";
import { format, differenceInHours } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, CheckCircle2, Clock, CalendarClock } from "lucide-react";
import { ExtendValidityDialog } from "@/components/entries/extend-validity-dialog";
import { EditEntryDialog } from "@/components/entries/edit-entry-dialog";
import { ViewEntryDialog } from "@/components/entries/view-entry-dialog";
import { DeleteEntryDialog } from "@/components/entries/delete-entry-dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const columns: ColumnDef<VehicleEntry>[] = [
  {
    id: "vehicle_date",
    header: "Vehicle / Date",
    accessorFn: (row) => `${row.vehicleNumber} ${format(new Date(row.entryDate), "dd MMM yyyy")} ${row.loadingDate ? format(new Date(row.loadingDate), "dd MMM yyyy") : ""}`,
    sortingFn: (rowA, rowB) => {
      const dateA = new Date(rowA.original.loadingDate || rowA.original.entryDate).getTime();
      const dateB = new Date(rowB.original.loadingDate || rowB.original.entryDate).getTime();
      return dateA - dateB;
    },
    cell: ({ row }) => (
      <div className="flex flex-col gap-0.5 min-w-[100px]">
        <div className="flex flex-col gap-0.5">
          <span className="font-bold uppercase text-zinc-900 dark:text-zinc-50 text-xs tracking-wider leading-none">
            {row.original.vehicleNumber}
          </span>
          {(row.original as any).previousVehicleNumber && (
            <span className="text-xs bg-amber-100 dark:bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-500/30 px-2 py-1 rounded font-bold uppercase mt-1 w-fit" title="Previous Vehicle Number">
              {(row.original as any).previousVehicleNumber}
            </span>
          )}
        </div>
        <div className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 mt-0.5">
          {format(new Date(row.original.loadingDate || row.original.entryDate), "dd MMM yyyy")}
        </div>
      </div>
    ),
  },
  {
    id: "broker",
    header: "Broker",
    accessorFn: (row) => `${(row as any).broker?.brokerName || row.brokerName || ""} ${(row as any).broker?.mobile || ""}`,
    cell: ({ row }) => {
      const name = (row.original as any).broker?.brokerName || row.original.brokerName;
      const brokerMobile = (row.original as any).broker?.mobile;
      return (
        <div className="flex items-center gap-2">
          <div className="h-6 w-6 rounded-md bg-zinc-100 dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 flex items-center justify-center text-[10px] font-bold border border-zinc-200/50 dark:border-zinc-800/50 shrink-0">
            {name ? name.charAt(0).toUpperCase() : "B"}
          </div>
          <div className="flex flex-col">
            <span className="font-semibold text-zinc-800 dark:text-zinc-200 text-xs truncate max-w-[120px]" title={name}>
              {name || "N/A"}
            </span>
            {brokerMobile && (
              <span className="text-[10px] font-mono text-zinc-400 dark:text-zinc-500 mt-0.5">
                {brokerMobile}
              </span>
            )}
          </div>
        </div>
      );
    }
  },
  {
    id: "route",
    header: "Route",
    accessorFn: (row) => `${row.fromLocation} to ${row.toDestination} ${row.pickupCompany || ''} ${row.deliveryCompany || ''}`,
    cell: ({ row }) => (
      <div className="flex flex-col gap-0.5 text-xs">
        {row.original.pickupCompany && (
          <span className="font-bold text-[9px] text-purple-600 dark:text-purple-400 uppercase tracking-wider truncate max-w-[120px]" title={row.original.pickupCompany}>
            {row.original.pickupCompany}
          </span>
        )}
        <span className="font-semibold text-zinc-700 dark:text-zinc-300">{row.original.fromLocation}</span>
        <span className="text-[10px] text-zinc-400 dark:text-zinc-500">to {row.original.toDestination}</span>
        {row.original.deliveryCompany && (
          <span className="font-bold text-[9px] text-emerald-600 dark:text-emerald-400 uppercase tracking-wider truncate max-w-[120px] mt-0.5" title={row.original.deliveryCompany}>
            {row.original.deliveryCompany}
          </span>
        )}
      </div>
    ),
  },
  {
    accessorKey: "lrNumber",
    header: "LR Number",
    cell: ({ row }) => <div className="font-mono text-zinc-700 dark:text-zinc-300 font-bold text-xs">{row.getValue("lrNumber")}</div>,
  },
  {
    accessorKey: "invoiceNumber",
    header: "Invoice(s)",
    cell: ({ row }) => {
      const invoicesStr = row.getValue("invoiceNumber") as string;
      if (!invoicesStr) return <span className="text-[10px] text-zinc-400 dark:text-zinc-500 italic">None</span>;
      
      const invoices = invoicesStr.split(",").map(s => s.trim()).filter(Boolean);
      
      return (
        <div className="flex flex-wrap gap-1 max-w-[150px]">
          {invoices.map((inv, idx) => (
            <Badge 
              key={idx} 
              variant="outline" 
              className="text-[9px] py-0 px-1.5 bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400 font-mono font-medium rounded-sm shadow-none"
            >
              {inv}
            </Badge>
          ))}
        </div>
      );
    }
  },
  {
    accessorKey: "ewayBillNumber",
    header: "E-Way Bill Status",
    cell: ({ row }) => {
      const ewayBillNo = row.getValue("ewayBillNumber") as string;
      const validTill = row.original.ewayBillValidTill;
      
      if (!ewayBillNo) {
        return <span className="text-[10px] text-zinc-400 dark:text-zinc-500 italic">Not Provided</span>;
      }
      
      if (!validTill) {
        return (
          <div className="flex flex-col gap-0.5">
            <span className="font-mono text-xs font-semibold text-zinc-800 dark:text-zinc-200">{ewayBillNo}</span>
            <span className="text-[10px] text-zinc-400 dark:text-zinc-500">Validity not set</span>
          </div>
        );
      }

      const expiryDate = new Date(validTill);
      const now = new Date();
      const diffHours = differenceInHours(expiryDate, now);
      
      let status: "expired" | "expiring_soon" | "valid" = "valid";
      if (diffHours < 0) {
        status = "expired";
      } else if (diffHours <= 48) {
        status = "expiring_soon";
      }

      return (
        <div className="flex flex-col gap-0.5">
          <span className="font-mono text-xs font-semibold text-zinc-800 dark:text-zinc-200">{ewayBillNo}</span>
          <div className="flex items-center gap-1.5 mt-0.5">
            {status === "expired" && (
              <Badge variant="outline" className="text-[9px] py-0 px-1.5 h-4.5 font-bold bg-rose-500/[0.04] border-rose-500/15 text-rose-600 dark:text-rose-450 flex items-center gap-0.5 shadow-none rounded">
                <AlertCircle className="w-2.5 h-2.5" /> EXPIRED
              </Badge>
            )}
            {status === "expiring_soon" && (
              <Badge variant="outline" className="text-[9px] py-0 px-1.5 h-4.5 font-bold bg-amber-500/[0.04] border-amber-500/15 text-amber-600 dark:text-amber-450 flex items-center gap-0.5 shadow-none rounded animate-pulse">
                <Clock className="w-2.5 h-2.5" /> EXPIRING
              </Badge>
            )}
            {status === "valid" && (
              <Badge variant="outline" className="text-[9px] py-0 px-1.5 h-4.5 font-bold bg-emerald-500/[0.04] border-emerald-500/15 text-emerald-600 dark:text-emerald-450 flex items-center gap-0.5 shadow-none rounded">
                <CheckCircle2 className="w-2.5 h-2.5" /> VALID
              </Badge>
            )}
            <span className={`text-[10px] font-semibold ${
              status === "expired" ? "text-rose-600/90 dark:text-rose-400" :
              status === "expiring_soon" ? "text-amber-600/90 dark:text-amber-500" :
              "text-zinc-500 dark:text-zinc-400"
            }`}>
              {format(expiryDate, "dd MMM")}
            </span>
          </div>
        </div>
      );
    }
  },
  {
    accessorKey: "balanceAmount",
    header: "Balance",
    cell: ({ row }) => {
      const amount = parseFloat(row.getValue("balanceAmount"));
      const formatted = new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 0,
      }).format(amount);

      const isPaid = amount <= 0;

      return (
        <div className="flex flex-col gap-1 items-start">
          <span className={isPaid ? "text-emerald-650 dark:text-emerald-400 font-bold text-xs" : "text-zinc-900 dark:text-zinc-100 font-bold text-xs"}>
            {formatted}
          </span>
          <Badge 
            variant="outline"
            className={isPaid 
              ? "bg-emerald-500/[0.04] border-emerald-500/10 text-emerald-600 dark:text-emerald-450 text-[9px] py-0 px-1.5 h-4.5 font-bold rounded shadow-none" 
              : "bg-rose-500/[0.04] border-rose-500/10 text-rose-600 dark:text-rose-450 text-[9px] py-0 px-1.5 h-4.5 font-bold rounded shadow-none"}
          >
            {isPaid ? "PAID" : "PENDING"}
          </Badge>
        </div>
      );
    },
  },
  {
    accessorKey: "advancePaid",
    header: "Advance Paid",
    cell: ({ row }) => {
      const paid = parseFloat(row.getValue("advancePaid")) || 0;
      const formatted = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(paid);
      return (
        <div className="flex flex-col gap-0.5">
          <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100">{formatted}</span>
        </div>
      );
    },
  },
  {
    accessorKey: "hamaliCharges",
    header: "Hamali Charges",
    cell: ({ row }) => {
      const amount = parseFloat(row.getValue("hamaliCharges")) || 0;
      const formatted = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(amount);
      return <span className="text-xs font-medium text-zinc-800 dark:text-zinc-200">{formatted}</span>;
    },
  },
  {
    accessorKey: "deliveryStatus",
    header: "Status / Mode",
    cell: ({ row }) => {
      const status = row.getValue("deliveryStatus") as string;
      const mode = (row.original as any).mode as string;
      const isUnloaded = status === "UNLOADED";
      const isWaitingForUnloading = status === "WAITING_FOR_UNLOADING";
      const isDelayed = status === "DELAYED";
      return (
        <div className="flex flex-col gap-1 items-start">
          <Badge 
            variant="outline"
            className={cn(
              "text-[9px] py-0.5 px-2 font-semibold tracking-wide rounded-md shadow-none",
              isUnloaded 
                ? "bg-zinc-100 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-800 dark:text-zinc-200" 
                : isWaitingForUnloading
                ? "bg-amber-500/[0.04] border-amber-500/10 text-amber-600 dark:text-amber-400"
                : isDelayed
                ? "bg-rose-500/[0.04] border-rose-500/10 text-rose-600 dark:text-rose-400"
                : "bg-zinc-50 dark:bg-zinc-950 border-zinc-100 dark:border-zinc-900 text-zinc-500 dark:text-zinc-400"
            )}
          >
            {status.replace(/_/g, " ")}
          </Badge>
          {mode === "EXPRESS" && (
            <Badge variant="outline" className="text-[8px] py-0 px-1.5 bg-amber-500/10 border-amber-500/20 text-amber-600 dark:text-amber-400 uppercase shadow-none font-bold">
              Express
            </Badge>
          )}
          {mode === "NORMAL" && (
            <Badge variant="outline" className="text-[8px] py-0 px-1.5 bg-zinc-100 border-zinc-200 dark:bg-zinc-800 dark:border-zinc-700 text-zinc-500 dark:text-zinc-400 uppercase shadow-none font-bold">
              Normal
            </Badge>
          )}
        </div>
      );
    },
  },
  {
    id: "actions",
    header: "Actions",
    cell: ({ row, table }) => {
      const entry = row.original;
      const { brokers, userId } = (table.options.meta || { brokers: [], userId: "admin-bypass" }) as any;
      
      return (
        <div className="flex items-center gap-1.5">
          <ViewEntryDialog entry={entry} />
          <EditEntryDialog 
            entry={entry} 
            brokers={brokers} 
            userId={userId} 
          />
          {entry.ewayBillNumber && (
            <ExtendValidityDialog 
              id={entry.id} 
              vehicleNumber={entry.vehicleNumber} 
              lrNumber={entry.lrNumber} 
              ewayBillNumber={entry.ewayBillNumber} 
              currentExpiryDate={entry.ewayBillValidTill}
              trigger={
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 hover:bg-zinc-100 dark:hover:bg-zinc-900 text-zinc-550 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 rounded-md"
                  title="Extend E-Way Bill Validity"
                >
                  <CalendarClock className="h-4 w-4" />
                </Button>
              }
            />
          )}
          <DeleteEntryDialog 
            id={entry.id} 
            vehicleNumber={entry.vehicleNumber} 
            lrNumber={entry.lrNumber} 
          />
        </div>
      );
    }
  }
];

