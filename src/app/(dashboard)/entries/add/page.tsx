import { EntryForm } from "@/components/entries/entry-form";
import { getBrokers } from "@/actions/broker-actions";
import { auth } from "@/auth";

export default async function AddEntryPage() {
  const session = await auth();
  const brokersResult = await getBrokers();
  const brokers = brokersResult.success && brokersResult.data ? brokersResult.data : [];

  return (
    <div className="flex-1 space-y-4 max-w-5xl mx-auto">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Add Vehicle Entry</h2>
      </div>
      
      <div className="bg-white dark:bg-zinc-950 p-6 rounded-lg shadow-sm border">
        <EntryForm brokers={brokers} userId={(session?.user?.id as string) || "admin-bypass"} />
      </div>
    </div>
  );
}
