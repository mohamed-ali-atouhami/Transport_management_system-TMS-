"use client";

import FormModal from "@/components/admin/forms/FormModal";
import { StatusFormModal } from "@/components/admin/forms/StatusFormModal";
import AssignShipmentToTrip from "@/components/admin/forms/AssignShipmentToTrip";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, Settings, Package } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";

export type Shipment = {
  id: string;
  tripId: string | null;
  clientId: string;
  trackingNumber: string;
  description: string;
  weight: number | null;
  volume: number | null;
  price: number;
  pickupAddress: string;
  deliveryAddress: string;
  priority: "LOW" | "NORMAL" | "HIGH" | "URGENT";
  status: "PENDING" | "ASSIGNED" | "IN_TRANSIT" | "DELIVERED" | "CANCELLED";
  pickupDate: Date | null;
  deliveryDate: Date | null;
  createdAt: Date;
  client: {
    id: string;
    companyName: string;
    user: {
      id: string;
      name: string;
      email: string;
    };
  };
  trip: {
    id: string;
    departure: string;
    destination: string;
  } | null;
};

interface ShipmentActionsProps {
  shipment: Shipment;
  clients: Array<{ id: string; companyName: string; user: { name: string; email: string } }>;
  trips: Array<{ id: string; departure: string; destination: string; dateStart: Date }>;
}

export function ShipmentActions({ shipment, clients, trips }: ShipmentActionsProps) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const router = useRouter();

  // Convert shipment to the format expected by ShipmentForm
  const shipmentData = {
    id: shipment.id,
    tripId: shipment.tripId,
    clientId: shipment.clientId,
    trackingNumber: shipment.trackingNumber,
    description: shipment.description,
    weight: shipment.weight,
    volume: shipment.volume,
    price: shipment.price,
    pickupAddress: shipment.pickupAddress,
    deliveryAddress: shipment.deliveryAddress,
    priority: shipment.priority,
    status: shipment.status,
    pickupDate: shipment.pickupDate,
    deliveryDate: shipment.deliveryDate,
  };

  const relatedData = {
    clients,
    trips,
  };

  return (
    <>
      <DropdownMenu open={dropdownOpen} onOpenChange={setDropdownOpen}>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {shipment.status === "PENDING" && (
            <DropdownMenuItem
              onClick={() => {
                setAssignDialogOpen(true);
                setDropdownOpen(false);
              }}
            >
              <Package className="mr-2 h-4 w-4" />
              Assign to Trip
            </DropdownMenuItem>
          )}
          <DropdownMenuItem asChild onSelect={(e) => e.preventDefault()}>
            <FormModal 
              table="shipments" 
              type="edit" 
              data={shipmentData} 
              id={shipment.id} 
              relatedData={relatedData}
              onSuccess={() => {
                setDropdownOpen(false);
                router.refresh();
              }}
            />
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => {
              setStatusDialogOpen(true);
            }}
          >
            <Settings className="mr-2 h-4 w-4" />
            Change Status
          </DropdownMenuItem>
          <DropdownMenuItem asChild onSelect={(e) => e.preventDefault()}>
            <FormModal 
              table="shipments" 
              type="delete" 
              id={shipment.id}
              onSuccess={() => {
                setDropdownOpen(false);
                router.refresh();
              }}
            />
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <StatusFormModal
        table="shipments"
        id={shipment.id}
        currentStatus={shipment.status}
        displayInfo={shipment.trackingNumber}
        open={statusDialogOpen}
        onOpenChange={(open) => {
          setStatusDialogOpen(open);
          if (!open) {
            setDropdownOpen(false);
          }
        }}
        onSuccess={() => {
          setDropdownOpen(false);
          router.refresh();
        }}
      />
      <AssignShipmentToTrip
        shipmentId={shipment.id}
        shipmentTrackingNumber={shipment.trackingNumber}
        shipmentPickupAddress={shipment.pickupAddress}
        shipmentDeliveryAddress={shipment.deliveryAddress}
        open={assignDialogOpen}
        onOpenChange={(open) => {
          setAssignDialogOpen(open);
          if (!open) {
            setDropdownOpen(false);
          }
        }}
        onSuccess={() => {
          setDropdownOpen(false);
          router.refresh();
        }}
      />
    </>
  );
}

