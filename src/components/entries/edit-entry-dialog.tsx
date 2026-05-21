"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Edit, Pencil } from "lucide-react";
import { EntryForm } from "./entry-form";
import { Broker, VehicleEntry } from "@prisma/client";

interface EditEntryDialogProps {
  entry: VehicleEntry;
  brokers: Broker[];
  userId: string;
  trigger?: React.ReactElement;
  onSuccess?: () => void;
}

export function EditEntryDialog({
  entry,
  brokers,
  userId,
  trigger,
  onSuccess,
}: EditEntryDialogProps) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          trigger || (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 hover:bg-zinc-100 dark:hover:bg-zinc-900 text-zinc-650 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
              title="Edit Entry"
            >
              <Pencil className="h-4 w-4" />
            </Button>
          )
        }
      />
      <DialogContent className="sm:max-w-4xl lg:max-w-5xl xl:max-w-6xl w-[calc(100%-2rem)] max-h-[90vh] overflow-y-auto border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 shadow-xl backdrop-blur-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl font-bold">
            <Edit className="h-5 w-5 text-zinc-750 dark:text-zinc-300" />
            Edit Vehicle Entry
          </DialogTitle>
          <DialogDescription>
            Update details for vehicle <strong className="text-zinc-800 dark:text-zinc-200">{entry.vehicleNumber}</strong> (LR No: {entry.lrNumber}).
          </DialogDescription>
        </DialogHeader>
        <div className="py-2">
          <EntryForm
            brokers={brokers}
            userId={userId}
            initialData={entry}
            onSuccess={() => {
              setOpen(false);
              if (onSuccess) onSuccess();
            }}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
