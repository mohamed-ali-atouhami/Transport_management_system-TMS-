"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import ClientShipmentRequestForm from "./ClientShipmentRequestForm";
import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";

interface ShipmentRequestDialogProps {
  variant?: "default" | "outline";
  className?: string;
}

export default function ShipmentRequestDialog({
  variant = "default",
  className,
}: ShipmentRequestDialogProps) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant={variant} className={cn("w-full justify-start", className)}>
          <Plus className="mr-2 h-4 w-4" />
          Request Shipment
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Request New Shipment</DialogTitle>
        </DialogHeader>
        <ClientShipmentRequestForm setOpen={setOpen} />
      </DialogContent>
    </Dialog>
  );
}
