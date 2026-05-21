"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Trash2, AlertTriangle } from "lucide-react";
import { deleteVehicleEntry } from "@/actions/entry-actions";
import { toast } from "sonner";

interface DeleteEntryDialogProps {
  id: string;
  vehicleNumber: string;
  lrNumber: string;
  trigger?: React.ReactElement;
  onSuccess?: () => void;
}

export function DeleteEntryDialog({
  id,
  vehicleNumber,
  lrNumber,
  trigger,
  onSuccess,
}: DeleteEntryDialogProps) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleDelete = async () => {
    setIsLoading(true);
    const result = await deleteVehicleEntry(id);
    setIsLoading(false);

    if (result.success) {
      toast.success("Vehicle entry deleted successfully from everywhere");
      setOpen(false);
      if (onSuccess) onSuccess();
    } else {
      toast.error(result.error || "Failed to delete vehicle entry");
    }
  };

  const defaultTrigger = (
    <Button
      variant="ghost"
      size="icon"
      className="h-8 w-8 hover:bg-rose-50 dark:hover:bg-rose-950/20 text-zinc-550 dark:text-zinc-400 hover:text-rose-600 dark:hover:text-rose-450 rounded-md"
      title="Delete Entry"
    >
      <Trash2 className="h-4 w-4" />
    </Button>
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={trigger || defaultTrigger} />
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-zinc-900 dark:text-zinc-100">
            <Trash2 className="w-5 h-5 text-rose-500 shrink-0" />
            Delete Vehicle Entry
          </DialogTitle>
          <DialogDescription className="text-zinc-500 dark:text-zinc-400 mt-2">
            Are you sure you want to permanently delete vehicle <strong className="text-zinc-900 dark:text-zinc-50 font-bold">{vehicleNumber}</strong> (LR No: {lrNumber})?
          </DialogDescription>
        </DialogHeader>

        <div className="my-2 p-3 bg-rose-50/50 dark:bg-rose-950/10 border border-rose-500/10 dark:border-rose-500/5 rounded-lg flex gap-3 text-xs text-rose-600 dark:text-rose-400 leading-normal">
          <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
          <div>
            <strong>Warning:</strong> This action is permanent and will completely remove this vehicle dispatch along with all its transaction and payment histories from the entire ledger database.
          </div>
        </div>

        <DialogFooter className="mt-4 gap-2 sm:gap-0">
          <Button
            type="button"
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={isLoading}
            className="w-full sm:w-auto"
          >
            Cancel
          </Button>
          <Button
            type="button"
            disabled={isLoading}
            onClick={handleDelete}
            className="w-full sm:w-auto bg-zinc-900 hover:bg-rose-600 dark:bg-zinc-100 dark:hover:bg-rose-500 text-white dark:text-zinc-900 hover:text-white dark:hover:text-white border border-transparent transition-all"
          >
            {isLoading ? "Deleting..." : "Delete Entry"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
