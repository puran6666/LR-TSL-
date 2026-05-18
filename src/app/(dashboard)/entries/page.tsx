import { getVehicleEntries } from "@/actions/entry-actions";
import { columns } from "./columns";
import { DataTable } from "./data-table";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export default async function EntriesPage() {
  const entriesResult = await getVehicleEntries();
  const data = entriesResult.success ? entriesResult.data! : [];

  return (
    <div className="flex-1 space-y-4">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Daily Entries</h2>
        <div className="flex items-center space-x-2">
          <Link href="/entries/add">
            <Button>
              <Plus className="mr-2 h-4 w-4" /> Add Entry
            </Button>
          </Link>
        </div>
      </div>
      
      <div className="bg-white dark:bg-zinc-950 p-4 rounded-lg shadow-sm border">
        <DataTable columns={columns} data={data} />
      </div>
    </div>
  );
}
