import { getBrokers } from "@/actions/broker-actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export default async function BrokersPage() {
  const brokersResult = await getBrokers();
  const brokers = brokersResult.success && brokersResult.data ? brokersResult.data : [];

  return (
    <div className="flex-1 space-y-4">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Brokers</h2>
        <Button>
          <Plus className="mr-2 h-4 w-4" /> Add Broker
        </Button>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mt-4">
        {brokers.length === 0 ? (
          <div className="col-span-full p-8 text-center text-muted-foreground border rounded-lg bg-white dark:bg-zinc-950">
            No brokers found. Add a new broker to get started.
          </div>
        ) : (
          brokers.map((broker) => (
            <Card key={broker.id}>
              <CardHeader>
                <CardTitle>{broker.brokerName}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-sm space-y-2">
                  <p><span className="font-semibold">Mobile:</span> {broker.mobile}</p>
                  <p><span className="font-semibold">Address:</span> {broker.address || "N/A"}</p>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
