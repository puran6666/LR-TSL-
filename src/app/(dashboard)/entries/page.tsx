import { getVehicleEntries } from "@/actions/entry-actions";
import { getBrokers } from "@/actions/broker-actions";
import { auth } from "@/auth";
import { columns } from "./columns";
import { DataTable } from "./data-table";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Plus, AlertTriangle } from "lucide-react";
import { differenceInHours, format } from "date-fns";

export default async function EntriesPage() {
  const session = await auth();
  const entriesResult = await getVehicleEntries();
  const brokersResult = await getBrokers();
  
  const data = entriesResult.success ? entriesResult.data! : [];
  const brokers = brokersResult.success ? brokersResult.data || [] : [];
  const userId = session?.user?.id || "admin-bypass";

  const now = new Date();
  
  // Expiry alerts for E-Way Bills (expired or expiring within 48 hours)
  const expiringEntries = data.filter(entry => {
    if (!entry.ewayBillNumber || !entry.ewayBillValidTill) return false;
    if (["UNLOADED", "DELIVERED", "CANCELLED"].includes(entry.deliveryStatus)) return false;
    const expiry = new Date(entry.ewayBillValidTill);
    const diffHours = differenceInHours(expiry, now);
    return diffHours <= 48;
  });

  return (
    <div className="flex-1 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            Daily Transport Entries
          </h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
            Track and manage your daily vehicle dispatches, invoices, and balances.
          </p>
        </div>
        <Link href="/entries/add">
          <Button className="shadow-none bg-zinc-900 hover:bg-zinc-850 dark:bg-zinc-50 dark:hover:bg-zinc-200 text-white dark:text-zinc-900 border-none font-semibold text-xs px-4 h-9 rounded-xl transition-all">
            <Plus className="mr-1.5 h-3.5 w-3.5" /> Add Entry
          </Button>
        </Link>
      </div>

      {/* E-Way Bill Expiry Alerts Reminders */}
      {expiringEntries.length > 0 && (
        <div className="bg-zinc-50/50 dark:bg-zinc-950/20 border border-rose-500/10 dark:border-rose-500/5 rounded-xl p-4 space-y-3">
          <div className="flex items-center gap-2 text-zinc-900 dark:text-zinc-100 font-semibold text-xs uppercase tracking-wider">
            <div className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
            <AlertTriangle className="w-3.5 h-3.5 text-rose-500 shrink-0" />
            E-Way Bill Expiry Alerts ({expiringEntries.length})
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {expiringEntries.map(entry => {
              const expiry = new Date(entry.ewayBillValidTill!);
              const diffHours = differenceInHours(expiry, now);
              const isExpired = diffHours < 0;
              return (
                <div 
                  key={entry.id} 
                  className="flex items-center justify-between p-3.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-zinc-800 dark:text-zinc-200"
                >
                  <div className="flex flex-col gap-0.5 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-xs uppercase tracking-wider text-zinc-900 dark:text-zinc-100">
                        {entry.vehicleNumber}
                      </span>
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-sm uppercase ${
                        isExpired 
                          ? "bg-rose-500/5 text-rose-600 border border-rose-500/10" 
                          : "bg-amber-500/5 text-amber-600 border border-amber-500/10"
                      }`}>
                        {isExpired ? "EXPIRED" : "EXPIRING"}
                      </span>
                    </div>
                    <span className="font-mono text-xs font-semibold text-zinc-500 dark:text-zinc-450 mt-0.5">
                      E-way: {entry.ewayBillNumber}
                    </span>
                    <span className="text-[10px] font-medium text-zinc-450 mt-0.5">
                      {isExpired 
                        ? `Expired on ${format(expiry, "dd MMM yyyy")}` 
                        : `Expires on ${format(expiry, "dd MMM yyyy")} (${Math.max(0, Math.floor(diffHours))}h left)`}
                    </span>
                  </div>
                  <div className="shrink-0 pl-2">
                    <span className="text-[9px] font-bold text-center px-2.5 py-1 rounded border border-zinc-200 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400 bg-zinc-50 dark:bg-zinc-900 hover:bg-zinc-100 cursor-pointer">
                      EXTEND
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
      
      <div className="bg-white dark:bg-zinc-950 p-6 rounded-xl border border-zinc-200 dark:border-zinc-800/80 shadow-none">
        <DataTable 
          columns={columns} 
          data={data} 
          meta={{ brokers, userId }} 
        />
      </div>
    </div>
  );
}

