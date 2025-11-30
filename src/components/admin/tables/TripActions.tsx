"use client";

import FormModal from "@/components/admin/forms/FormModal";
import { StatusFormModal } from "@/components/admin/forms/StatusFormModal";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, Settings } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";

export type Trip = {
  id: string;
  driverId: string;
  vehicleId: string;
  departure: string;
  destination: string;
  dateStart: Date;
  dateEnd: Date | null;
  estimatedDuration: number | null;
  actualDuration: number | null;
  distance: number | null;
  status: "PLANNED" | "ONGOING" | "COMPLETED" | "CANCELLED";
  totalCost: number;
  notes: string | null;
  createdAt: Date;
  driver: {
    id: string;
    user: {
      id: string;
      name: string;
      email: string;
    };
  };
  vehicle: {
    id: string;
    plateNumber: string;
    brand: string;
    model: string;
  };
  _count: {
    shipments: number;
    expenses: number;
  };
};

interface TripActionsProps {
  trip: Trip;
  drivers: Array<{ id: string; name: string; email: string; licenseNumber: string }>;
  vehicles: Array<{ id: string; label: string; plateNumber: string; brand: string; model: string; type: string }>;
}

export function TripActions({ trip, drivers, vehicles }: TripActionsProps) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const router = useRouter();

  // Convert trip to the format expected by TripForm
  const tripData = {
    id: trip.id,
    driverId: trip.driverId,
    vehicleId: trip.vehicleId,
    departure: trip.departure,
    destination: trip.destination,
    dateStart: trip.dateStart,
    dateEnd: trip.dateEnd,
    estimatedDuration: trip.estimatedDuration,
    actualDuration: trip.actualDuration,
    distance: trip.distance,
    status: trip.status,
    totalCost: trip.totalCost,
    notes: trip.notes,
  };

  const relatedData = {
    drivers,
    vehicles,
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
          <DropdownMenuItem asChild onSelect={(e) => e.preventDefault()}>
            <FormModal 
              table="trips" 
              type="edit" 
              data={tripData} 
              id={trip.id} 
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
              table="trips" 
              type="delete" 
              id={trip.id}
              onSuccess={() => {
                setDropdownOpen(false);
                router.refresh();
              }}
            />
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <StatusFormModal
        table="trips"
        id={trip.id}
        currentStatus={trip.status}
        displayInfo={`${trip.departure} → ${trip.destination}`}
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
    </>
  );
}
