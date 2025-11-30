"use client";

import { useState, useTransition, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { assignShipmentToTrip, getAvailableTripsForAssignment } from "@/lib/actions/shipment-management";
import { toast } from "sonner";
import { Loader2, Package, Route, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
//import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import TripCreationWizard from "./TripCreationWizard";
import FormModal from "./FormModal";

type Trip = {
  id: string;
  departure: string;
  destination: string;
  dateStart: Date;
  dateEnd: Date | null;
  status: "PLANNED" | "ONGOING" | "COMPLETED" | "CANCELLED";
  driver: {
    id: string;
    name: string;
    email: string;
  };
  vehicle: {
    id: string;
    plateNumber: string;
    brand: string;
    model: string;
  };
  shipmentCount: number;
  matchScore: number;
  matchReason: string;
};

interface AssignShipmentToTripProps {
  shipmentId: string;
  shipmentTrackingNumber: string;
  shipmentPickupAddress: string;
  shipmentDeliveryAddress: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export default function AssignShipmentToTrip({
  shipmentId,
  shipmentTrackingNumber,
  shipmentPickupAddress,
  shipmentDeliveryAddress,
  open,
  onOpenChange,
  onSuccess,
}: AssignShipmentToTripProps) {
  const [selectedTripId, setSelectedTripId] = useState<string>("");
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [wizardOpen, setWizardOpen] = useState(false);
  const router = useRouter();

  // Fetch available trips when dialog opens
  useEffect(() => {
    if (open) {
      setLoading(true);
      getAvailableTripsForAssignment(shipmentId)
        .then((fetchedTrips) => {
          setTrips(fetchedTrips as Trip[]);
          setLoading(false);
        })
        .catch((error) => {
          console.error("Error fetching trips:", error);
          toast.error("Failed to load available trips");
          setLoading(false);
        });
    } else {
      // Reset state when dialog closes
      setSelectedTripId("");
      setTrips([]);
    }
  }, [open, shipmentId]);

  const handleAssign = () => {
    if (!selectedTripId) {
      toast.error("Please select a trip");
      return;
    }

    startTransition(async () => {
      const result = await assignShipmentToTrip(shipmentId, selectedTripId);
      
      if (result.success) {
        toast.success("Shipment assigned to trip successfully");
        onOpenChange(false);
        if (onSuccess) {
          onSuccess();
        }
        router.refresh();
      } else {
        toast.error(result.error as string || "Failed to assign shipment");
      }
    });
  };

  const selectedTrip = trips.find((t) => t.id === selectedTripId);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Assign Shipment to Trip
          </DialogTitle>
          <DialogDescription>
            Assign shipment <strong>{shipmentTrackingNumber}</strong> to an existing trip or create a new one.
          </DialogDescription>
        </DialogHeader>

        {/* Shipment Info */}
        <div className="bg-gray-50 p-4 rounded-lg space-y-2">
          <div className="flex items-start gap-2">
            <Route className="h-4 w-4 text-gray-500 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-700">Route</p>
              <p className="text-sm text-gray-600">
                {shipmentPickupAddress} → {shipmentDeliveryAddress}
              </p>
            </div>
          </div>
        </div>

        {/* Trip Selection */}
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Select Trip</label>
            {loading ? (
              <div className="flex items-center justify-center p-8">
                <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                <span className="ml-2 text-sm text-gray-500">Loading available trips...</span>
              </div>
            ) : trips.length === 0 ? (
              <div className="text-center p-8 text-gray-500">
                <p className="text-sm">No available trips found.</p>
                <p className="text-xs mt-1">Create a new trip to assign this shipment.</p>
              </div>
            ) : (
              <Select value={selectedTripId} onValueChange={setSelectedTripId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a trip or create new..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="new">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">+ Create New Trip</span>
                    </div>
                  </SelectItem>
                  {trips.map((trip) => (
                    <SelectItem key={trip.id} value={trip.id}>
                      <div className="flex items-center gap-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">
                              {trip.departure} → {trip.destination}
                            </span>
                            {trip.matchScore > 0 && (
                              <span className="flex items-center gap-1 text-xs text-blue-600">
                                <Sparkles className="h-3 w-3" />
                                {trip.matchReason}
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-gray-500 mt-0.5">
                            {new Date(trip.dateStart).toLocaleDateString()} • {trip.driver.name} • {trip.vehicle.plateNumber}
                          </div>
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Selected Trip Details */}
          {selectedTrip && selectedTrip.id !== "new" && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-3">
              <h4 className="font-medium text-sm text-blue-900">Trip Details</h4>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-gray-600">Route</p>
                  <p className="font-medium">{selectedTrip.departure} → {selectedTrip.destination}</p>
                </div>
                <div>
                  <p className="text-gray-600">Status</p>
                  <p className="font-medium capitalize">{selectedTrip.status.toLowerCase()}</p>
                </div>
                <div>
                  <p className="text-gray-600">Start Date</p>
                  <p className="font-medium">
                    {new Date(selectedTrip.dateStart).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <p className="text-gray-600">Driver</p>
                  <p className="font-medium">{selectedTrip.driver.name}</p>
                </div>
                <div>
                  <p className="text-gray-600">Vehicle</p>
                  <p className="font-medium">
                    {selectedTrip.vehicle.brand} {selectedTrip.vehicle.model} ({selectedTrip.vehicle.plateNumber})
                  </p>
                </div>
                <div>
                  <p className="text-gray-600">Current Shipments</p>
                  <p className="font-medium">{selectedTrip.shipmentCount}</p>
                </div>
              </div>
            </div>
          )}

          {/* Create New Trip Option */}
          {selectedTripId === "new" && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-sm text-yellow-800 mb-3">
                Create a new trip for this shipment. The route will be pre-filled with the shipment's addresses.
              </p>
              <Button
                type="button"
                onClick={() => setWizardOpen(true)}
                className="w-full"
              >
                Open Trip Creation Wizard
              </Button>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
            Cancel
          </Button>
          <Button
            onClick={handleAssign}
            disabled={!selectedTripId || selectedTripId === "new" || isPending}
          >
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Assigning...
              </>
            ) : (
              "Assign to Trip"
            )}
          </Button>
        </div>
      </DialogContent>
      
      {/* Trip Creation Wizard Dialog */}
      <Dialog open={wizardOpen} onOpenChange={setWizardOpen}>
        <DialogContent className="max-w-5xl max-h-[95vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Trip</DialogTitle>
          </DialogHeader>
          <TripCreationWizard
            setOpen={(open) => {
              setWizardOpen(open);
              if (!open) {
                // Refresh trips list when wizard closes
                getAvailableTripsForAssignment(shipmentId)
                  .then((fetchedTrips) => {
                    setTrips(fetchedTrips as Trip[]);
                  })
                  .catch((error) => {
                    console.error("Error refreshing trips:", error);
                  });
              }
            }}
            onSuccess={() => {
              setWizardOpen(false);
              // Refresh trips list
              getAvailableTripsForAssignment(shipmentId)
                .then((fetchedTrips) => {
                  setTrips(fetchedTrips as Trip[]);
                })
                .catch((error) => {
                  console.error("Error refreshing trips:", error);
                });
              router.refresh();
            }}
            prefillData={{
              departure: shipmentPickupAddress,
              destination: shipmentDeliveryAddress,
            }}
          />
        </DialogContent>
      </Dialog>
    </Dialog>
  );
}

