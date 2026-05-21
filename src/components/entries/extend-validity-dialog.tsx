"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Calendar, Clock, Save } from "lucide-react";
import { extendEwayBillValidity } from "@/actions/entry-actions";
import { toast } from "sonner";
import { format } from "date-fns";

interface ExtendValidityDialogProps {
  id: string;
  vehicleNumber: string;
  lrNumber: string;
  ewayBillNumber: string | null | undefined;
  currentExpiryDate: Date | string | null | undefined;
  trigger?: React.ReactElement;
  onSuccess?: () => void;
}

export function ExtendValidityDialog({
  id,
  vehicleNumber,
  lrNumber,
  ewayBillNumber,
  currentExpiryDate,
  trigger,
  onSuccess,
}: ExtendValidityDialogProps) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [newDate, setNewDate] = useState(() => {
    if (!currentExpiryDate) return "";
    const d = new Date(currentExpiryDate);
    return isNaN(d.getTime()) ? "" : d.toISOString().split("T")[0];
  });

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDate) {
      toast.error("Please select a valid date");
      return;
    }

    setIsLoading(true);
    const result = await extendEwayBillValidity(id, newDate);
    setIsLoading(false);

    if (result.success) {
      toast.success("E-Way Bill validity extended successfully");
      setOpen(false);
      if (onSuccess) onSuccess();
    } else {
      toast.error(result.error || "Failed to extend validity");
    }
  };

  const defaultTrigger = (
    <Button
      variant="outline"
      size="sm"
      className="text-zinc-700 hover:text-zinc-900 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:text-zinc-100 dark:hover:bg-zinc-900 border-zinc-200 dark:border-zinc-800"
    >
      <Clock className="w-3.5 h-3.5 mr-1.5" /> Extend Validity
    </Button>
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={trigger || defaultTrigger} />
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSave}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-zinc-600 dark:text-zinc-400" />
              Extend E-Way Bill Validity
            </DialogTitle>
            <DialogDescription>
              Update the validity date for the E-Way bill associated with vehicle{" "}
              <strong className="text-zinc-800 dark:text-zinc-200">{vehicleNumber}</strong> (LR No: {lrNumber}).
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="rounded-lg bg-zinc-50 dark:bg-zinc-900 p-3.5 border text-xs space-y-1.5">
              <div className="flex justify-between">
                <span className="text-zinc-500">E-Way Bill No:</span>
                <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                  {ewayBillNumber || "Not Provided"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Current Expiry:</span>
                <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                  {currentExpiryDate
                    ? format(new Date(currentExpiryDate), "dd MMM yyyy")
                    : "None Selected"}
                </span>
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="newValidityDate">New Validity Expiry Date *</Label>
              <Input
                id="newValidityDate"
                type="date"
                required
                value={newDate}
                onChange={(e) => setNewDate(e.target.value)}
                className="w-full text-zinc-800 dark:text-zinc-200"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading} className="bg-zinc-900 hover:bg-zinc-850 dark:bg-zinc-100 dark:hover:bg-zinc-200 text-white dark:text-zinc-900">
              {isLoading ? "Saving..." : <><Save className="w-4 h-4 mr-2" /> Save Extension</>}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
