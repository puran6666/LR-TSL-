import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileDown } from "lucide-react";

export default function ReportsPage() {
  return (
    <div className="flex-1 space-y-4">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Reports</h2>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Daily Vehicle Report</CardTitle>
            <CardDescription>Export today's vehicle entries.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" className="w-full">
              <FileDown className="mr-2 h-4 w-4" /> Download Excel
            </Button>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Pending Balance Report</CardTitle>
            <CardDescription>Export all pending freight payments.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" className="w-full">
              <FileDown className="mr-2 h-4 w-4" /> Download Excel
            </Button>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Monthly Freight Total</CardTitle>
            <CardDescription>Export monthly earnings report.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" className="w-full">
              <FileDown className="mr-2 h-4 w-4" /> Download Excel
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
