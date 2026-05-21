import { getBrokers } from "@/actions/broker-actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AddBrokerDialog } from "@/components/brokers/add-broker-dialog";
import { User, Phone, MapPin } from "lucide-react";

export default async function BrokersPage() {
  const brokersResult = await getBrokers();
  const brokers = brokersResult.success && brokersResult.data ? brokersResult.data : [];

  return (
    <div className="flex-1 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50">
            Brokers Directory
          </h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            Manage your broker contacts and their vehicle dispatch history.
          </p>
        </div>
        <AddBrokerDialog />
      </div>
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mt-4">
        {brokers.length === 0 ? (
          <div className="col-span-full p-12 text-center border border-dashed rounded-xl bg-white/50 dark:bg-zinc-950/50 backdrop-blur-md flex flex-col items-center justify-center space-y-3">
            <User className="h-10 w-10 text-zinc-400 dark:text-zinc-600 animate-pulse" />
            <h3 className="font-semibold text-lg text-zinc-800 dark:text-zinc-200">No Brokers Added</h3>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 max-w-xs">
              Keep transport entries organized by associating them with brokers. Click the button above to add one.
            </p>
          </div>
        ) : (
          brokers.map((broker) => (
            <Card 
              key={broker.id} 
              className="group border border-zinc-200/80 dark:border-zinc-800/80 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-sm shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md hover:border-zinc-350 dark:hover:border-zinc-700"
            >
              <CardHeader className="pb-3 border-b border-zinc-100 dark:border-zinc-900">
                <CardTitle className="flex items-center gap-2 text-lg font-bold text-zinc-800 dark:text-zinc-100">
                  <div className="h-8 w-8 rounded-lg bg-zinc-100 dark:bg-zinc-900 border border-zinc-200/55 dark:border-zinc-800/50 text-zinc-750 dark:text-zinc-300 flex items-center justify-center text-sm font-semibold shadow-sm group-hover:scale-105 transition-transform">
                    {broker.brokerName.charAt(0).toUpperCase()}
                  </div>
                  <span className="truncate">{broker.brokerName}</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4 space-y-3">
                <div className="flex items-center gap-2.5 text-sm text-zinc-600 dark:text-zinc-300">
                  <Phone className="h-4 w-4 text-zinc-400 dark:text-zinc-500 shrink-0" />
                  <span className="font-medium">{broker.mobile}</span>
                </div>
                <div className="flex items-start gap-2.5 text-sm text-zinc-600 dark:text-zinc-300">
                  <MapPin className="h-4 w-4 text-zinc-400 dark:text-zinc-500 shrink-0 mt-0.5" />
                  <span className="line-clamp-2">{broker.address || "No address provided"}</span>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
