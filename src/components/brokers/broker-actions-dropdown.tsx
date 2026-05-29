"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { brokerSchema } from "@/lib/schemas";
import { updateBroker, deleteBroker } from "@/actions/broker-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { MoreVertical, Loader2, Edit, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import type { Broker } from "@prisma/client";

interface BrokerActionsDropdownProps {
  broker: Broker;
}

export function BrokerActionsDropdown({ broker }: BrokerActionsDropdownProps) {
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const router = useRouter();

  const form = useForm<z.infer<typeof brokerSchema>>({
    resolver: zodResolver(brokerSchema),
    defaultValues: {
      brokerName: broker.brokerName,
      mobile: broker.mobile,
      address: broker.address || "",
    },
  });

  const { register, handleSubmit, formState: { errors } } = form;

  async function onEdit(values: z.infer<typeof brokerSchema>) {
    setIsEditing(true);
    const result = await updateBroker(broker.id, values);
    setIsEditing(false);

    if (result.success) {
      toast.success("Broker updated successfully!");
      setIsEditOpen(false);
      router.refresh();
    } else {
      toast.error(result.error || "Failed to update broker");
    }
  }

  async function onDelete() {
    setIsDeleting(true);
    const result = await deleteBroker(broker.id);
    setIsDeleting(false);

    if (result.success) {
      toast.success("Broker deleted successfully!");
      setIsDeleteOpen(false);
      router.refresh();
    } else {
      toast.error(result.error || "Failed to delete broker");
    }
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger className="h-8 w-8 inline-flex items-center justify-center rounded-md text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:text-zinc-100 dark:hover:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-zinc-400">
          <MoreVertical className="h-4 w-4" />
          <span className="sr-only">Open menu</span>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-40">
          <DropdownMenuItem onClick={() => setIsEditOpen(true)} className="cursor-pointer">
            <Edit className="mr-2 h-4 w-4" />
            Edit Broker
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setIsDeleteOpen(true)} className="cursor-pointer text-red-600 dark:text-red-400 focus:text-red-700 dark:focus:text-red-300">
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-[425px] backdrop-blur-xl bg-white/95 dark:bg-zinc-950/95">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Edit Broker</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onEdit)} className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="brokerName">Broker Name *</Label>
              <Input id="brokerName" {...register("brokerName")} className="bg-zinc-50 dark:bg-zinc-900" />
              {errors.brokerName && <span className="text-xs text-red-500">{errors.brokerName.message}</span>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="mobile">Mobile Number *</Label>
              <Input id="mobile" {...register("mobile")} type="tel" className="bg-zinc-50 dark:bg-zinc-900" />
              {errors.mobile && <span className="text-xs text-red-500">{errors.mobile.message}</span>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Input id="address" {...register("address")} className="bg-zinc-50 dark:bg-zinc-900" />
            </div>
            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={() => setIsEditOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isEditing}>
                {isEditing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Changes
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent className="sm:max-w-[425px] backdrop-blur-xl bg-white/95 dark:bg-zinc-950/95">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-red-600 dark:text-red-400">Delete Broker</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete <strong>{broker.brokerName}</strong>? This action cannot be undone. 
              Note: You cannot delete a broker if they have active vehicle entries.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="pt-4">
            <Button type="button" variant="outline" onClick={() => setIsDeleteOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={onDelete} disabled={isDeleting}>
              {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete Broker
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
