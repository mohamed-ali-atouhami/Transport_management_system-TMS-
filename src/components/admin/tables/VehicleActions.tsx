"use client";

import FormModal from "@/components/admin/forms/FormModal";
import { StatusFormModal } from "@/components/admin/forms/StatusFormModal";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, Settings } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";

export type Vehicle = {
  id: string;
  plateNumber: string;
  type: string;
  brand: string;
  model: string;
  status: "ACTIVE" | "IN_MAINTENANCE" | "INACTIVE";
  mileage: number;
  purchaseDate: Date | null;
  lastServiceDate: Date | null;
  capacityWeight: number | null;
  capacityVolume: number | null;
  createdAt: Date;
};

interface VehicleActionsProps {
  vehicle: Vehicle;
}

export function VehicleActions({ vehicle }: VehicleActionsProps) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const router = useRouter();

  // Convert vehicle to the format expected by VehicleForm
  const vehicleData = {
    id: vehicle.id,
    plateNumber: vehicle.plateNumber,
    type: vehicle.type,
    brand: vehicle.brand,
    model: vehicle.model,
    status: vehicle.status,
    mileage: vehicle.mileage,
    purchaseDate: vehicle.purchaseDate,
    lastServiceDate: vehicle.lastServiceDate,
    capacityWeight: vehicle.capacityWeight,
    capacityVolume: vehicle.capacityVolume,
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
              table="vehicles" 
              type="edit" 
              data={vehicleData} 
              id={vehicle.id}
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
              table="vehicles" 
              type="delete" 
              id={vehicle.id}
              onSuccess={() => {
                setDropdownOpen(false);
                router.refresh();
              }}
            />
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <StatusFormModal
        table="vehicles"
        id={vehicle.id}
        currentStatus={vehicle.status}
        displayInfo={vehicle.plateNumber}
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

