"use client";

import { ColumnDef } from "@tanstack/react-table";
import { VehicleEntry } from "@prisma/client";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";

export const columns: ColumnDef<VehicleEntry>[] = [
  {
    accessorKey: "entryDate",
    header: "Date",
    cell: ({ row }) => {
      const date = row.getValue("entryDate") as Date;
      return <div className="min-w-[90px]">{format(new Date(date), "dd MMM yyyy")}</div>;
    },
  },
  {
    accessorKey: "vehicleNumber",
    header: "Vehicle No.",
    cell: ({ row }) => <div className="font-semibold uppercase">{row.getValue("vehicleNumber")}</div>,
  },
  {
    accessorKey: "brokerName",
    header: "Broker",
  },
  {
    accessorKey: "fromLocation",
    header: "From",
  },
  {
    accessorKey: "toDestination",
    header: "To",
  },
  {
    accessorKey: "lrNumber",
    header: "LR Number",
    cell: ({ row }) => <div className="font-mono">{row.getValue("lrNumber")}</div>,
  },
  {
    accessorKey: "balanceAmount",
    header: "Balance",
    cell: ({ row }) => {
      const amount = parseFloat(row.getValue("balanceAmount"));
      const formatted = new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
      }).format(amount);
      
      return (
        <div className={amount > 0 ? "text-orange-600 font-medium" : "text-emerald-600 font-medium"}>
          {formatted}
        </div>
      );
    },
  },
  {
    accessorKey: "deliveryStatus",
    header: "Status",
    cell: ({ row }) => {
      const status = row.getValue("deliveryStatus") as string;
      return (
        <Badge 
          variant={
            status === "DELIVERED" ? "default" : 
            status === "IN_TRANSIT" ? "secondary" : 
            status === "DELAYED" ? "destructive" : "outline"
          }
          className={status === "DELIVERED" ? "bg-emerald-500 hover:bg-emerald-600" : ""}
        >
          {status.replace("_", " ")}
        </Badge>
      );
    },
  },
];
