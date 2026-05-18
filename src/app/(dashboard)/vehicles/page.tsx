import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function VehiclesPage() {
  return (
    <div className="flex-1 space-y-4">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Vehicles Master</h2>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Vehicle Directory</CardTitle>
          <CardDescription>Manage your fleet and track vehicle histories.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground p-8 text-center border rounded-md">
            Vehicle master module will be implemented in future phases.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
