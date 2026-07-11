import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Truck, AlertTriangle, CheckCircle, IndianRupee, TrendingUp, Clock, CalendarClock, Eye, Trash2, MapPin, FileWarning, FileText } from "lucide-react";
import { getDashboardStats, getExpiringEwayBills, getRecentVehicleEntries, getInTransitVehicles } from "@/actions/entry-actions";
import { getBrokers } from "@/actions/broker-actions";
import { auth } from "@/auth";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ExtendValidityDialog } from "@/components/entries/extend-validity-dialog";
import { EditEntryDialog } from "@/components/entries/edit-entry-dialog";
import { ViewEntryDialog } from "@/components/entries/view-entry-dialog";
import { DeleteEntryDialog } from "@/components/entries/delete-entry-dialog";
import { format, differenceInHours, differenceInDays } from "date-fns";
import { ThemeToggle } from "@/components/theme-toggle";

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const session = await auth();
  const statsResult = await getDashboardStats();
  const expiringResult = await getExpiringEwayBills();
  const brokersResult = await getBrokers();
  const recentResult = await getRecentVehicleEntries(15, true);
  const inTransitResult = await getInTransitVehicles();

  const stats = statsResult.success && statsResult.data ? statsResult.data : {
    totalVehiclesToday: 0,
    pendingBalance: 0,
    deliveredVehicles: 0,
    expiredEwayBills: 0,
    totalVehiclesBooked: 0,
    totalOutstanding: 0,
    waitingForUnloading: 0,
    expressVehicles: 0,
    totalEwayBillsGenerated: 0
  };

  const expiringBills = expiringResult.success ? expiringResult.data || [] : [];
  const brokers = brokersResult.success ? brokersResult.data || [] : [];
  const rawRecentEntries = recentResult.success ? recentResult.data || [] : [];
  const waitingEntries = rawRecentEntries.filter(e => e.deliveryStatus === "WAITING_FOR_UNLOADING");
  const otherEntries = rawRecentEntries.filter(e => e.deliveryStatus !== "WAITING_FOR_UNLOADING");
  const recentEntries = [...waitingEntries, ...otherEntries];
  const inTransitEntries = inTransitResult.success ? inTransitResult.data || [] : [];
  
  const actualInTransit = inTransitEntries.filter(e => e.deliveryStatus === "IN_TRANSIT");
  const actualWaiting = inTransitEntries.filter(e => e.deliveryStatus === "WAITING_FOR_UNLOADING");
  const actualExpress = inTransitEntries.filter(e => (e as any).mode === "EXPRESS" && !["DELIVERED", "CANCELLED"].includes(e.deliveryStatus));

  const userId = session?.user?.id || "admin-bypass";

  return (
    <div className="flex-1 space-y-6">
      <div className="text-center text-sm font-bold text-black dark:text-zinc-200 tracking-wider select-none">
        || ॐ नमः शिवाय ||
      </div>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-550">
            Logistics Overview
          </h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
            Real-time analytics, dispatch operations, and financial outstanding.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
        </div>
      </div>
      
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-4">
        {/* Card 1: Total Vehicles Today */}
        <Card className="group border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 shadow-none rounded-xl">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 p-4 pb-2">
            <CardTitle className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
              Total Vehicles Today
            </CardTitle>
            <div className="p-1 rounded-md bg-zinc-50 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 border border-zinc-200/50 dark:border-zinc-800/50">
              <Truck className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-2xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-100">{stats.totalVehiclesToday}</div>
            <div className="flex items-center gap-1 mt-1 text-[10px] text-zinc-450 dark:text-zinc-500 font-medium">
              <TrendingUp className="h-3 w-3 text-zinc-400" />
              <span>Active dispatches today</span>
            </div>
          </CardContent>
        </Card>

        {/* Card 2: Vehicles In Transit */}
        <Card className="group border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 shadow-none rounded-xl">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 p-4 pb-2">
            <CardTitle className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
              Vehicles In Transit
            </CardTitle>
            <div className="p-1 rounded-md bg-blue-500/[0.04] text-blue-600 dark:text-blue-450 border border-blue-500/10">
              <Truck className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-2xl font-extrabold tracking-tight text-blue-600 dark:text-blue-400">{actualInTransit.length}</div>
            <div className="flex flex-col mt-1 text-[10px] text-zinc-450 dark:text-zinc-500 font-medium relative z-10">
              <span className="mb-1">Active shipments on road</span>
              <details className="group mt-0.5">
                <summary className="cursor-pointer text-blue-500 hover:text-blue-600 dark:text-blue-450 dark:hover:text-blue-400 font-semibold list-none select-none inline-flex items-center gap-1">
                  View Recent 10 <span className="text-[8px] opacity-70 group-open:rotate-180 transition-transform">▼</span>
                </summary>
                <div className="mt-2 bg-zinc-50/50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-lg max-h-[160px] overflow-y-auto p-1.5 space-y-1">
                  {actualInTransit.slice(0, 10).map(v => (
                    <div key={v.id} className="flex justify-between items-center bg-zinc-50/50 dark:bg-zinc-900/30 p-1.5 rounded-md border border-zinc-100 dark:border-zinc-800/80">
                      <span className="font-bold text-zinc-800 dark:text-zinc-200 uppercase">{v.vehicleNumber}</span>
                      <span className="text-[8px] truncate max-w-[70px] bg-zinc-200/50 dark:bg-zinc-800 px-1 py-0.5 rounded text-zinc-600 dark:text-zinc-400">{v.toDestination || "-"}</span>
                    </div>
                  ))}
                  {actualInTransit.length === 0 && <span className="italic text-[9px] px-1 text-zinc-400">No vehicles in transit</span>}
                </div>
              </details>
            </div>
          </CardContent>
        </Card>

        {/* Card 3: Waiting For Unloading */}
        <Card className="group border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 shadow-none rounded-xl">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 p-4 pb-2">
            <CardTitle className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
              Waiting For Unloading
            </CardTitle>
            <div className="p-1 rounded-md bg-amber-500/[0.04] text-amber-600 dark:text-amber-450 border border-amber-500/10">
              <CheckCircle className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-2xl font-extrabold tracking-tight text-amber-600 dark:text-amber-400">{actualWaiting.length}</div>
            <div className="flex flex-col mt-1 text-[10px] text-zinc-450 dark:text-zinc-500 font-medium relative z-10">
              <span className="mb-1">Vehicles at destination</span>
              <details className="group mt-0.5">
                <summary className="cursor-pointer text-amber-500 hover:text-amber-600 dark:text-amber-450 dark:hover:text-amber-400 font-semibold list-none select-none inline-flex items-center gap-1">
                  View Recent 10 <span className="text-[8px] opacity-70 group-open:rotate-180 transition-transform">▼</span>
                </summary>
                <div className="mt-2 bg-zinc-50/50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-lg max-h-[160px] overflow-y-auto p-1.5 space-y-1">
                  {actualWaiting.slice(0, 10).map(v => (
                    <div key={v.id} className="flex justify-between items-center bg-zinc-50/50 dark:bg-zinc-900/30 p-1.5 rounded-md border border-zinc-100 dark:border-zinc-800/80">
                      <span className="font-bold text-zinc-800 dark:text-zinc-200 uppercase">{v.vehicleNumber}</span>
                      <span className="text-[8px] truncate max-w-[70px] bg-zinc-200/50 dark:bg-zinc-800 px-1 py-0.5 rounded text-zinc-600 dark:text-zinc-400">{v.toDestination || "-"}</span>
                    </div>
                  ))}
                  {actualWaiting.length === 0 && <span className="italic text-[9px] px-1 text-zinc-400">No vehicles waiting</span>}
                </div>
              </details>
            </div>
          </CardContent>
        </Card>



        {/* Card 6: Express Mode Vehicles */}
        <Card className="group border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 shadow-none rounded-xl">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 p-4 pb-2">
            <CardTitle className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
              Express Mode Vehicles
            </CardTitle>
            <div className="p-1 rounded-md bg-purple-500/[0.04] text-purple-600 dark:text-purple-450 border border-purple-500/10">
              <TrendingUp className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-2xl font-extrabold tracking-tight text-purple-600 dark:text-purple-400">{actualExpress.length}</div>
            <div className="flex flex-col mt-1 text-[10px] text-zinc-450 dark:text-zinc-500 font-medium relative z-10">
              <span className="mb-1">Active urgent shipments</span>
              <details className="group mt-0.5">
                <summary className="cursor-pointer text-purple-500 hover:text-purple-600 dark:text-purple-450 dark:hover:text-purple-400 font-semibold list-none select-none inline-flex items-center gap-1">
                  View Recent 10 <span className="text-[8px] opacity-70 group-open:rotate-180 transition-transform">▼</span>
                </summary>
                <div className="mt-2 bg-zinc-50/50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-lg max-h-[160px] overflow-y-auto p-1.5 space-y-1">
                  {actualExpress.slice(0, 10).map(v => (
                    <div key={v.id} className="flex justify-between items-center bg-zinc-50/50 dark:bg-zinc-900/30 p-1.5 rounded-md border border-zinc-100 dark:border-zinc-800/80">
                      <span className="font-bold text-zinc-800 dark:text-zinc-200 uppercase">{v.vehicleNumber}</span>
                      <span className="text-[8px] truncate max-w-[70px] bg-zinc-200/50 dark:bg-zinc-800 px-1 py-0.5 rounded text-zinc-600 dark:text-zinc-400">{v.toDestination || "-"}</span>
                    </div>
                  ))}
                  {actualExpress.length === 0 && <span className="italic text-[9px] px-1 text-zinc-400">No express vehicles</span>}
                </div>
              </details>
            </div>
          </CardContent>
        </Card>


      </div>

      {/* E-Way Bill Expiry Alerts — IN_TRANSIT only, auto-hidden once extended or unloaded */}
      {expiringBills.length > 0 && (
        <div className="border border-rose-500/15 dark:border-rose-500/10 rounded-xl overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-2.5 bg-rose-50/60 dark:bg-rose-950/10 border-b border-rose-500/10">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
              <FileWarning className="w-3.5 h-3.5 text-rose-500" />
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-rose-700 dark:text-rose-400">
                E-Way Bill Alerts — Active Vehicles ({expiringBills.length})
              </span>
            </div>
            <span className="text-[9px] font-semibold text-rose-500/70 dark:text-rose-400/60 italic">
              Auto-clears once extended or unloaded
            </span>
          </div>

          {/* Cards grid */}
          <div className="p-3 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {expiringBills.map((bill) => {
                const expiryDate = new Date(bill.ewayBillValidTill!);
                const now = new Date();
                const diffHours = differenceInHours(expiryDate, now);
                const diffDays = differenceInDays(expiryDate, now);
                // Extension window: from 4:00 PM on expiry date to 8:00 AM next day
                const extensionStart = new Date(expiryDate);
                extensionStart.setHours(16, 0, 0, 0);
                const extensionEnd = new Date(expiryDate);
                extensionEnd.setDate(extensionEnd.getDate() + 1);
                extensionEnd.setHours(8, 0, 0, 0);
                const isExpired = now > extensionEnd; // fully expired after window
                const isInExtensionWindow = now >= extensionStart && now <= extensionEnd;
                const isUrgent = !isExpired && diffHours <= 12; // keep urgent indicator for near expiry
                // Countdown display
                let countdownLabel;
                if (isExpired) {
                  const daysAgo = Math.abs(diffDays);
                  const hoursAgo = Math.abs(Math.floor(diffHours));
                  countdownLabel = `Expired ${daysAgo > 0 ? `${daysAgo}d` : `${hoursAgo}h`} ago`;
                } else if (isInExtensionWindow) {
                  const remainingHours = Math.max(0, Math.round((extensionEnd.getTime() - now.getTime()) / (1000 * 60 * 60)));
                  countdownLabel = `Extension window: ${remainingHours}h left`;
                } else {
                  countdownLabel = diffDays >= 1 ? `${diffDays}d ${Math.floor(diffHours % 24)}h left` : `${Math.floor(diffHours)}h left`;
                }

              return (
                <div
                  key={bill.id}
                  className={`rounded-lg border bg-white dark:bg-zinc-950 overflow-hidden ${
                    isExpired
                      ? "border-rose-500/20"
                      : isUrgent
                      ? "border-amber-500/25"
                      : "border-zinc-200 dark:border-zinc-800"
                  }`}
                >
                  {/* Top stripe */}
                  <div className={`h-0.5 w-full ${
                    isExpired ? "bg-rose-500" : isUrgent ? "bg-amber-400" : "bg-amber-300"
                  }`} />

                  <div className="p-3 space-y-2.5">
                    {/* Vehicle + status badge */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex flex-col gap-0.5 min-w-0">
                        <div className="flex flex-col gap-0.5">
                          <span className="font-bold text-xs uppercase tracking-wider text-zinc-900 dark:text-zinc-100 leading-none">
                            {bill.vehicleNumber}
                          </span>
                          {bill.previousVehicleNumber && (
                            <span className="text-xs bg-amber-100 dark:bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-500/30 px-2 py-1 rounded font-bold uppercase mt-1 w-fit" title="Previous Vehicle Number">
                              {bill.previousVehicleNumber}
                            </span>
                          )}
                        </div>
                        <div className="flex flex-col gap-0.5">
                          <div className="flex items-center gap-1 text-[10px] text-zinc-400 dark:text-zinc-500">
                            <MapPin className="w-2.5 h-2.5 shrink-0" />
                            <span className="truncate max-w-[160px]">{bill.fromLocation} → {bill.toDestination}</span>
                          </div>
                          {(bill.pickupCompany || bill.deliveryCompany) && (
                            <div className="flex items-center gap-1 text-[9px] ml-3.5">
                              {bill.pickupCompany && (
                                <span className="font-bold text-purple-600 dark:text-purple-400 uppercase tracking-wider truncate max-w-[80px]" title={bill.pickupCompany}>
                                  {bill.pickupCompany}
                                </span>
                              )}
                              {bill.pickupCompany && bill.deliveryCompany && <span className="text-zinc-300 dark:text-zinc-700">/</span>}
                              {bill.deliveryCompany && (
                                <span className="font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider truncate max-w-[80px]" title={bill.deliveryCompany}>
                                  {bill.deliveryCompany}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                      <span className={`shrink-0 text-[8px] font-extrabold px-1.5 py-0.5 rounded uppercase tracking-wider ${
                        isExpired
                          ? "bg-rose-500/8 text-rose-600 border border-rose-500/15"
                          : isUrgent
                          ? "bg-amber-500/8 text-amber-600 border border-amber-500/15 animate-pulse"
                          : "bg-amber-500/8 text-amber-600 border border-amber-500/15"
                      }`}>
                        {isExpired ? "EXPIRED" : "EXPIRING"}
                      </span>
                    </div>

                    {/* E-way number + countdown */}
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono text-[10px] font-semibold text-zinc-500 dark:text-zinc-400">
                        {bill.ewayBillNumber}
                      </span>
                      <div className={`flex items-center gap-1 text-[10px] font-extrabold rounded px-1.5 py-0.5 ${
                        isExpired
                          ? "text-rose-600 dark:text-rose-400 bg-rose-500/5"
                          : isUrgent
                          ? "text-amber-600 dark:text-amber-400 bg-amber-500/5 animate-pulse"
                          : "text-amber-600 dark:text-amber-400 bg-amber-500/5"
                      }`}>
                        <Clock className="w-2.5 h-2.5" />
                        {countdownLabel}
                      </div>
                    </div>

                    {/* Expiry date line */}
                    <div className="flex flex-col gap-0.5 text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                      <span>Loading Date: <strong className="text-zinc-800 dark:text-zinc-200">{format(new Date(bill.loadingDate || bill.entryDate), "dd MMM yyyy")}</strong></span>
                      {isExpired
                        ? <span className="text-rose-500 font-medium">Expired on {format(expiryDate, "dd MMM yyyy, hh:mm a")}</span>
                        : <span>Valid till <strong className="text-zinc-800 dark:text-zinc-200">{format(expiryDate, "dd MMM yyyy")}</strong></span>
                      }
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-1.5 pt-0.5 border-t border-zinc-100 dark:border-zinc-900">
                      <ExtendValidityDialog
                        id={bill.id}
                        vehicleNumber={bill.vehicleNumber}
                        lrNumber={bill.lrNumber}
                        ewayBillNumber={bill.ewayBillNumber}
                        currentExpiryDate={bill.ewayBillValidTill}
                        trigger={
                          <button
                            type="button"
                            className="flex-1 flex items-center justify-center gap-1 text-[9px] font-bold py-1 rounded border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-300 bg-zinc-50 dark:bg-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer transition-all"
                          >
                            <CalendarClock className="w-2.5 h-2.5" /> EXTEND NOW
                          </button>
                        }
                      />
                      <EditEntryDialog
                        entry={bill as any}
                        brokers={brokers}
                        userId={userId}
                        trigger={
                          <button
                            type="button"
                            className="px-2 text-[9px] font-bold py-1 rounded border border-zinc-200 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400 bg-zinc-50 dark:bg-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer transition-all"
                          >
                            EDIT
                          </button>
                        }
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="mt-4 space-y-6">
        {/* Recent 15 Vehicles Table Card */}
        <Card className="w-full border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 shadow-none rounded-xl overflow-hidden">
          <CardHeader className="pb-3.5 border-b border-zinc-100 dark:border-zinc-800">
            <CardTitle className="text-sm font-semibold text-zinc-800 dark:text-zinc-200 flex items-center justify-between">
              <span className="flex items-center gap-2 text-zinc-900 dark:text-zinc-100 uppercase tracking-wider text-xs">
                <Truck className="h-4 w-4 text-zinc-650 dark:text-zinc-450" />
                Recent 15 Vehicles
              </span>
              <span className="text-[9px] uppercase bg-zinc-50 dark:bg-zinc-900 text-zinc-650 dark:text-zinc-400 font-bold px-2.5 py-0.5 rounded-md border border-zinc-250/20 dark:border-zinc-800">
                Ledger
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto w-full">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-zinc-50/50 dark:bg-zinc-900/30 border-b border-zinc-250/30 dark:border-zinc-800/40 text-zinc-450 font-bold uppercase text-[9px] tracking-wider h-11">
                    <th className="px-4 font-semibold">Vehicle / Date</th>
                    <th className="px-4 font-semibold">Route & Company</th>
                    <th className="px-4 font-semibold">Delivery Status</th>
                    <th className="px-4 font-semibold">E-Way Bill Status</th>
                    <th className="px-4 font-semibold">Broker</th>
                    <th className="px-4 font-semibold text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200/60 dark:divide-zinc-800/60">
                  {recentEntries.length > 0 ? (
                    recentEntries.map((entry) => {
                      // E-way status calculations
                      let ewayStatus: "none" | "expired" | "expiring" | "valid" = "none";
                      let diffHours = 0;
                      if (entry.ewayBillNumber) {
                        if (entry.ewayBillValidTill) {
                          diffHours = differenceInHours(new Date(entry.ewayBillValidTill), new Date());
                          if (diffHours < 0) ewayStatus = "expired";
                          else if (diffHours <= 48) ewayStatus = "expiring";
                          else ewayStatus = "valid";
                        } else {
                          ewayStatus = "none";
                        }
                      }

                      return (
                        <tr key={entry.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-900/30 transition-colors">
                          <td className="py-3.5 px-4">
                            <div className="flex flex-col gap-0.5">
                              <div className="flex flex-col gap-0.5">
                                <span className="font-bold text-zinc-900 dark:text-zinc-100 uppercase text-xs tracking-wider leading-none">{entry.vehicleNumber}</span>
                                {entry.previousVehicleNumber && (
                                  <span className="text-xs bg-amber-100 dark:bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-500/30 px-2 py-1 rounded font-bold uppercase mt-1 w-fit" title="Previous Vehicle Number">
                                    {entry.previousVehicleNumber}
                                  </span>
                                )}
                              </div>
                              <div className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 mt-0.5">
                                {format(new Date(entry.loadingDate || entry.entryDate), "dd MMM yyyy")}
                              </div>
                              {(entry as any).unloadingDate && (
                                <div className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 mt-0.5">
                                  UL: {format(new Date((entry as any).unloadingDate), "dd MMM yyyy")}
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="flex flex-col gap-0.5 text-xs">
                              <span className="font-semibold text-zinc-700 dark:text-zinc-300">{entry.fromLocation}</span>
                              <span className="text-[10px] text-zinc-450 dark:text-zinc-500">to {entry.toDestination}</span>
                              {(entry.pickupCompany || entry.deliveryCompany) && (
                                <div className="flex items-center gap-1 mt-0.5 text-[9px]">
                                  {entry.pickupCompany && (
                                    <span className="font-bold text-purple-600 dark:text-purple-400 uppercase tracking-wider truncate max-w-[80px]" title={entry.pickupCompany}>
                                      {entry.pickupCompany}
                                    </span>
                                  )}
                                  {entry.pickupCompany && entry.deliveryCompany && <span className="text-zinc-300 dark:text-zinc-700">/</span>}
                                  {entry.deliveryCompany && (
                                    <span className="font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider truncate max-w-[80px]" title={entry.deliveryCompany}>
                                      {entry.deliveryCompany}
                                    </span>
                                  )}
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="py-3.5 px-4">
                            <Badge variant="outline" className={`text-[9px] py-0 px-2 font-bold shadow-none rounded-md uppercase tracking-wider ${
                              entry.deliveryStatus === 'UNLOADED' 
                                ? 'bg-emerald-500/[0.04] border-emerald-500/15 text-emerald-600 dark:text-emerald-450' 
                                : entry.deliveryStatus === 'WAITING_FOR_UNLOADING'
                                ? 'bg-amber-500/[0.04] border-amber-500/15 text-amber-600 dark:text-amber-450'
                                : 'bg-blue-500/[0.04] border-blue-500/15 text-blue-600 dark:text-blue-450'
                            }`}>
                              {entry.deliveryStatus.replace(/_/g, ' ')}
                            </Badge>
                          </td>
                          <td className="py-3.5 px-4">
                            {entry.ewayBillNumber ? (
                              <div className="flex flex-col gap-0.5">
                                <span className="font-mono text-xs font-semibold text-zinc-800 dark:text-zinc-200">{entry.ewayBillNumber}</span>
                                {entry.ewayBillValidTill ? (
                                  <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                                    <Badge variant="secondary" className="text-[8px] py-0 px-1 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 font-bold shadow-none shrink-0">
                                      {entry.ewayBillNumber.split(",").filter(Boolean).length} {entry.ewayBillNumber.split(",").filter(Boolean).length === 1 ? 'Bill' : 'Bills'}
                                    </Badge>
                                    {ewayStatus === "expired" && (
                                      <Badge variant="outline" className="text-[8px] py-0 px-1 font-bold bg-rose-500/[0.04] border-rose-500/15 text-rose-600 dark:text-rose-450 shadow-none rounded-sm">EXP</Badge>
                                    )}
                                    {ewayStatus === "expiring" && (
                                      <Badge variant="outline" className="text-[8px] py-0 px-1 font-bold bg-amber-500/[0.04] border-amber-500/15 text-amber-600 dark:text-amber-450 shadow-none rounded-sm animate-pulse">EXPING</Badge>
                                    )}
                                    {ewayStatus === "valid" && (
                                      <Badge variant="outline" className="text-[8px] py-0 px-1 font-bold bg-emerald-500/[0.04] border-emerald-500/15 text-emerald-600 dark:text-emerald-450 shadow-none rounded-sm">VAL</Badge>
                                    )}
                                    <span className={`text-[10px] font-semibold ${
                                      ewayStatus === "expired" ? "text-rose-600 dark:text-rose-400" :
                                      ewayStatus === "expiring" ? "text-amber-600 dark:text-amber-500" :
                                      "text-zinc-500 dark:text-zinc-400"
                                    }`}>
                                      {format(new Date(entry.ewayBillValidTill), "dd MMM")}
                                    </span>
                                  </div>
                                ) : (
                                  <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                                    <Badge variant="secondary" className="text-[8px] py-0 px-1 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 font-bold shadow-none shrink-0">
                                      {entry.ewayBillNumber.split(",").filter(Boolean).length} {entry.ewayBillNumber.split(",").filter(Boolean).length === 1 ? 'Bill' : 'Bills'}
                                    </Badge>
                                    <span className="text-[10px] text-zinc-400 dark:text-zinc-500">No validity</span>
                                  </div>
                                )}
                              </div>
                            ) : (
                              <span className="text-zinc-400 dark:text-zinc-500 italic text-[10px]">Not Provided</span>
                            )}
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-2">
                              <div className="h-6 w-6 rounded-md bg-zinc-100 dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 flex items-center justify-center text-[10px] font-bold border border-zinc-200/50 dark:border-zinc-800/50 shrink-0">
                                {((entry as any).broker?.brokerName || entry.brokerName) ? ((entry as any).broker?.brokerName || entry.brokerName).charAt(0).toUpperCase() : "B"}
                              </div>
                              <div className="flex flex-col">
                                <span className="font-semibold text-zinc-800 dark:text-zinc-200 text-xs truncate max-w-[120px]" title={(entry as any).broker?.brokerName || entry.brokerName || ""}>
                                  {(entry as any).broker?.brokerName || entry.brokerName || "N/A"}
                                </span>
                                {(entry as any).broker?.mobile && (
                                  <span className="text-[10px] font-mono text-zinc-400 dark:text-zinc-500 mt-0.5">
                                    {(entry as any).broker.mobile}
                                  </span>
                                )}
                                {(entry.driverName || entry.driverMobile) && (
                                  <span className="text-[10px] font-mono text-zinc-500 dark:text-zinc-400 mt-0.5" title={`Driver: ${entry.driverName || 'N/A'}`}>
                                    Dr: {entry.driverMobile || entry.driverName || 'N/A'}
                                  </span>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="flex items-center justify-center gap-1.5">
                              <ViewEntryDialog 
                                entry={entry as any}
                                trigger={
                                  <Button variant="ghost" size="icon" className="h-7 w-7 text-zinc-550 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-900 rounded-md" title="View Entry Details">
                                    <Eye className="w-3.5 h-3.5" />
                                  </Button>
                                }
                              />
                              <EditEntryDialog 
                                entry={entry as any}
                                brokers={brokers}
                                userId={userId}
                                trigger={
                                  <Button variant="ghost" size="icon" className="h-7 w-7 text-zinc-550 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-900 rounded-md" title="Edit Entry">
                                    <Clock className="w-3.5 h-3.5" />
                                  </Button>
                                }
                              />
                              {entry.ewayBillNumber && (
                                <ExtendValidityDialog 
                                  id={entry.id}
                                  vehicleNumber={entry.vehicleNumber}
                                  lrNumber={entry.lrNumber}
                                  ewayBillNumber={entry.ewayBillNumber}
                                  currentExpiryDate={entry.ewayBillValidTill}
                                  trigger={
                                    <Button variant="ghost" size="icon" className="h-7 w-7 text-zinc-550 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-900 rounded-md" title="Extend E-Way Bill Validity">
                                      <CalendarClock className="w-3.5 h-3.5" />
                                    </Button>
                                  }
                                />
                              )}
                              <DeleteEntryDialog 
                                id={entry.id}
                                vehicleNumber={entry.vehicleNumber}
                                lrNumber={entry.lrNumber}
                                trigger={
                                  <Button variant="ghost" size="icon" className="h-7 w-7 text-zinc-550 dark:text-zinc-400 hover:text-rose-600 dark:hover:text-rose-450 hover:bg-rose-50/50 dark:hover:bg-rose-950/20 rounded-md" title="Delete Entry">
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </Button>
                                }
                              />
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-zinc-400 dark:text-zinc-550 italic">
                        No dispatches added yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
