"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { brokerSchema } from "@/lib/schemas";
import { createBroker } from "@/actions/broker-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Plus, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

interface AddBrokerDialogProps {
  onSuccess?: (id: string, name: string) => void;
  trigger?: React.ReactElement;
}

export function AddBrokerDialog({ onSuccess, trigger }: AddBrokerDialogProps) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const form = useForm<z.infer<typeof brokerSchema>>({
    resolver: zodResolver(brokerSchema),
    defaultValues: {
      brokerName: "",
      mobile: "",
      address: "",
    },
  });

  const { register, handleSubmit, formState: { errors }, reset } = form;

  async function onSubmit(values: z.infer<typeof brokerSchema>) {
    setIsLoading(true);
    const result = await createBroker(values);
    setIsLoading(false);

    if (result.success) {
      toast.success("Broker added successfully!");
      reset();
      setOpen(false);
      router.refresh();
      if (onSuccess && result.data) {
        onSuccess(result.data.id, result.data.brokerName);
      }
    } else {
      toast.error(result.error || "Failed to add broker");
    }
  }

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      setOpen(isOpen);
      if (!isOpen) reset();
    }}>
      <DialogTrigger render={trigger || (
        <Button className="shadow-md transition-all hover:shadow-lg hover:-translate-y-0.5">
          <Plus className="mr-2 h-4 w-4" /> Add Broker
        </Button>
      )} />
      <DialogContent className="sm:max-w-[425px] backdrop-blur-xl bg-white/95 dark:bg-zinc-950/95">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Add New Broker</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="brokerName">Broker Name *</Label>
            <Input id="brokerName" {...register("brokerName")} placeholder="Enter broker name" className="bg-zinc-50 dark:bg-zinc-900" />
            {errors.brokerName && <span className="text-xs text-red-500">{errors.brokerName.message}</span>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="mobile">Mobile Number *</Label>
            <Input id="mobile" {...register("mobile")} type="tel" placeholder="Enter 10-digit mobile number" className="bg-zinc-50 dark:bg-zinc-900" />
            {errors.mobile && <span className="text-xs text-red-500">{errors.mobile.message}</span>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="address">Address</Label>
            <Input id="address" {...register("address")} placeholder="Enter full address" className="bg-zinc-50 dark:bg-zinc-900" />
          </div>
          <DialogFooter className="pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Broker
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
