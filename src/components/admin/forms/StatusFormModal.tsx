"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { updateTripStatus } from "@/lib/actions/trip-management";
import { updateVehicleStatus } from "@/lib/actions/vehicle-management";
import { updateShipmentStatus } from "@/lib/actions/shipment-management";
import { updateDriverStatus } from "@/lib/actions/profile-management";

type TripStatus = "PLANNED" | "ONGOING" | "COMPLETED" | "CANCELLED";
type VehicleStatus = "ACTIVE" | "IN_MAINTENANCE" | "INACTIVE";
type ShipmentStatus = "PENDING" | "ASSIGNED" | "IN_TRANSIT" | "DELIVERED" | "CANCELLED";
type DriverStatus = "ACTIVE" | "INACTIVE" | "SUSPENDED";

type StatusType = TripStatus | VehicleStatus | ShipmentStatus | DriverStatus;

type StatusUpdateResult = {
  success: boolean;
  error?: string;
};

type StatusUpdateFunction = (id: string, status: StatusType) => Promise<StatusUpdateResult>;

interface StatusFormModalProps {
  table: "trips" | "vehicles" | "shipments" | "drivers";
  id: string;
  currentStatus: StatusType;
  displayInfo?: string; // e.g., "ABC-123" for vehicle, "TRK-001" for shipment, "City A → City B" for trip
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

// Map table names to their status update functions
const statusUpdateMap: Record<"trips" | "vehicles" | "shipments" | "drivers", StatusUpdateFunction> = {
  trips: updateTripStatus as StatusUpdateFunction,
  vehicles: updateVehicleStatus as StatusUpdateFunction,
  shipments: updateShipmentStatus as StatusUpdateFunction,
  drivers: updateDriverStatus as StatusUpdateFunction,
};

// Get valid next statuses based on table type and current status
const getValidStatuses = (table: "trips" | "vehicles" | "shipments" | "drivers", currentStatus: StatusType): StatusType[] => {
  switch (table) {
    case "drivers":
      // Drivers can change to any status (including current, so user can see current status)
      return ["ACTIVE", "INACTIVE", "SUSPENDED"];
    case "trips":
      const tripStatus = currentStatus as TripStatus;
      let tripStatuses: TripStatus[] = [];
      switch (tripStatus) {
        case "PLANNED":
          tripStatuses = ["ONGOING", "CANCELLED"];
          break;
        case "ONGOING":
          tripStatuses = ["COMPLETED", "CANCELLED"];
          break;
        case "COMPLETED":
        case "CANCELLED":
          tripStatuses = [];
          break;
        default:
          tripStatuses = [];
      }
      // Include current status so it can be pre-selected
      if (tripStatuses.length > 0 && !tripStatuses.includes(tripStatus)) {
        tripStatuses.unshift(tripStatus);
      }
      return tripStatuses;
    case "vehicles":
      // Vehicles can change to any status (including current, so user can see current status)
      return ["ACTIVE", "IN_MAINTENANCE", "INACTIVE"];
    case "shipments":
      const shipmentStatus = currentStatus as ShipmentStatus;
      let shipmentStatuses: ShipmentStatus[] = [];
      switch (shipmentStatus) {
        case "PENDING":
          shipmentStatuses = ["ASSIGNED", "CANCELLED"];
          break;
        case "ASSIGNED":
          shipmentStatuses = ["IN_TRANSIT", "CANCELLED"];
          break;
        case "IN_TRANSIT":
          shipmentStatuses = ["DELIVERED", "CANCELLED"];
          break;
        case "DELIVERED":
        case "CANCELLED":
          shipmentStatuses = [];
          break;
        default:
          shipmentStatuses = [];
      }
      // Include current status so it can be pre-selected
      if (shipmentStatuses.length > 0 && !shipmentStatuses.includes(shipmentStatus)) {
        shipmentStatuses.unshift(shipmentStatus);
      }
      return shipmentStatuses;
    default:
      return [];
  }
};

// Format status for display
const formatStatus = (status: StatusType): string => {
  return status
    .split("_")
    .map((word) => word.charAt(0) + word.slice(1).toLowerCase())
    .join(" ");
};

export function StatusFormModal({
  table,
  id,
  currentStatus,
  displayInfo,
  open,
  onOpenChange,
  onSuccess,
}: StatusFormModalProps) {
  const router = useRouter();
  const [selectedStatus, setSelectedStatus] = useState<StatusType | "">("");
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validStatuses = getValidStatuses(table, currentStatus);

  useEffect(() => {
    if (open) {
      setError(null);
      // Pre-select current status for all tables so it's visible in the dropdown
      setSelectedStatus(currentStatus);
    }
  }, [open, currentStatus, table]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStatus) return;

    setIsUpdating(true);
    setError(null);

    try {
      const updateFunction = statusUpdateMap[table];
      const result = await updateFunction(id, selectedStatus as StatusType);

      if (result.success) {
        toast.success(`${table.slice(0, -1)} status updated successfully!`);
        if (onSuccess) {
          onSuccess();
        }
        onOpenChange(false);
        router.refresh();
      } else {
        const errorMessage = result.error || `Failed to update ${table} status`;
        setError(errorMessage);
        toast.error(errorMessage);
      }
    } catch (err: any) {
      const errorMessage = err.message || `Failed to update ${table} status`;
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsUpdating(false);
    }
  };

  const getTitle = () => {
    const tableName = table.slice(0, -1);
    return `Change ${tableName.charAt(0).toUpperCase() + tableName.slice(1)} Status`;
  };

  const getDescription = () => {
    if (displayInfo) {
      return (
        <>
          Update the status for {table.slice(0, -1)}: <strong>{displayInfo}</strong>
          <br />
          Current status: <strong>{formatStatus(currentStatus)}</strong>
        </>
      );
    }
    return (
      <>
        Current status: <strong>{formatStatus(currentStatus)}</strong>
      </>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{getTitle()}</DialogTitle>
          <DialogDescription>{getDescription()}</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            {error && (
              <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
                {error}
              </div>
            )}

            {validStatuses.length === 0 ? (
              <div className="p-3 text-sm text-gray-600 bg-gray-50 border border-gray-200 rounded-md">
                This {table.slice(0, -1)} cannot be updated further. Status: <strong>{formatStatus(currentStatus)}</strong>
              </div>
            ) : (
              <div className="space-y-2">
                <Label htmlFor="status">New Status</Label>
                <Select
                  value={selectedStatus}
                  onValueChange={(value) => setSelectedStatus(value as StatusType)}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder={`Current: ${formatStatus(currentStatus)} - Select new status`} />
                  </SelectTrigger>
                  <SelectContent>
                    {validStatuses.map((status) => (
                      <SelectItem key={status} value={status}>
                        {formatStatus(status)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isUpdating}
            >
              Cancel
            </Button>
            {validStatuses.length > 0 && (
              <Button type="submit" disabled={isUpdating || !selectedStatus}>
                {isUpdating ? "Updating..." : "Update Status"}
              </Button>
            )}
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

