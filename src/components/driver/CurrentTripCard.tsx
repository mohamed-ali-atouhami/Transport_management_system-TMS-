"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin, Package, Truck, Clock, CheckCircle2, XCircle, AlertCircle, Play } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { driverUpdateTripStatus } from "@/lib/actions/driver-actions";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import type { TripStatus } from "@prisma/client";

type CurrentTrip = {
  id: string;
  status: TripStatus;
  departure: string;
  destination: string;
  dateStart: Date;
  dateEnd: Date | null;
  vehicle: {
    plateNumber: string;
    brand: string;
    model: string;
  };
  _count: {
    shipments: number;
  };
};

interface CurrentTripCardProps {
  trip: CurrentTrip | null;
}

export default function CurrentTripCard({ trip }: CurrentTripCardProps) {
  const [isPending, startTransition] = useTransition();
  const [isReportingIssue, setIsReportingIssue] = useState(false);

  const handleStatusUpdate = async (newStatus: "COMPLETED" | "CANCELLED") => {
    if (!trip) return;

    startTransition(async () => {
      const result = await driverUpdateTripStatus(trip.id, newStatus);
      if (result.success) {
        toast.success(`Trip ${newStatus === "COMPLETED" ? "completed" : "cancelled"} successfully`);
        window.location.reload();
      } else {
        toast.error(result.error || "Failed to update trip status");
      }
    });
  };

  if (!trip) {
    return (
      <Card className="border-green-200 bg-gradient-to-br from-green-50 to-white">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Truck className="h-5 w-5 text-green-600" />
            Current Trip
          </CardTitle>
          <CardDescription>Your active trip</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Truck className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p className="text-sm">No active trip at the moment</p>
            <p className="text-xs mt-1">Check your upcoming trips to get started</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const isOngoing = trip.status === "ONGOING";
  const isPlanned = trip.status === "PLANNED";
  const canStart = trip.status === "PLANNED";
  const canComplete = trip.status === "ONGOING";
  const canCancel = trip.status === "PLANNED" || trip.status === "ONGOING";

  const handleStartTrip = async () => {
    if (!trip) return;

    startTransition(async () => {
      const result = await driverUpdateTripStatus(trip.id, "ONGOING");
      if (result.success) {
        toast.success("Trip started successfully");
        window.location.reload();
      } else {
        toast.error(result.error || "Failed to start trip");
      }
    });
  };

  return (
    <Card
      className={`${
        isOngoing
          ? "border-green-200 bg-gradient-to-br from-green-50 to-white"
          : "border-blue-200 bg-gradient-to-br from-blue-50 to-white"
      } shadow-lg`}
    >
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Truck
                className={`h-5 w-5 ${
                  isOngoing ? "text-green-600" : "text-blue-600"
                }`}
              />
              {isOngoing ? "Current Trip" : "Next Trip"}
            </CardTitle>
            <CardDescription>
              {isOngoing
                ? "Your active trip in progress"
                : "Your next scheduled trip - ready to start"}
            </CardDescription>
          </div>
          <Badge
            className={
              isOngoing
                ? "bg-green-600 text-white"
                : "bg-blue-600 text-white"
            }
          >
            {trip.status.replace("_", " ")}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Trip Details */}
        <div className="space-y-3">
          <div
            className={`flex items-start gap-3 p-3 rounded-lg bg-white border ${
              isOngoing ? "border-green-100" : "border-blue-100"
            }`}
          >
            <MapPin
              className={`h-5 w-5 ${
                isOngoing ? "text-green-600" : "text-blue-600"
              } flex-shrink-0 mt-0.5`}
            />
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-gray-900 truncate">
                {trip.departure}
              </div>
              <div className="text-xs text-muted-foreground mt-1">Departure</div>
            </div>
          </div>
          <div className="flex items-center justify-center py-1">
            <div
              className={`h-8 w-0.5 ${isOngoing ? "bg-green-300" : "bg-blue-300"}`}
            ></div>
          </div>
          <div
            className={`flex items-start gap-3 p-3 rounded-lg bg-white border ${
              isOngoing ? "border-green-100" : "border-blue-100"
            }`}
          >
            <MapPin
              className={`h-5 w-5 ${
                isOngoing ? "text-green-600" : "text-blue-600"
              } flex-shrink-0 mt-0.5`}
            />
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-gray-900 truncate">
                {trip.destination}
              </div>
              <div className="text-xs text-muted-foreground mt-1">Destination</div>
            </div>
          </div>
        </div>

        {/* Trip Info */}
        <div className="grid grid-cols-2 gap-3">
          <div
            className={`p-3 rounded-lg bg-white border ${
              isOngoing ? "border-green-100" : "border-blue-100"
            }`}
          >
            <div className="flex items-center gap-2 mb-1">
              <Package
                className={`h-4 w-4 ${isOngoing ? "text-green-600" : "text-blue-600"}`}
              />
              <span className="text-xs text-muted-foreground">Shipments</span>
            </div>
            <div className="text-lg font-semibold text-gray-900">
              {trip._count.shipments}
            </div>
          </div>
          <div
            className={`p-3 rounded-lg bg-white border ${
              isOngoing ? "border-green-100" : "border-blue-100"
            }`}
          >
            <div className="flex items-center gap-2 mb-1">
              <Truck
                className={`h-4 w-4 ${isOngoing ? "text-green-600" : "text-blue-600"}`}
              />
              <span className="text-xs text-muted-foreground">Vehicle</span>
            </div>
            <div className="text-sm font-semibold text-gray-900 truncate">
              {trip.vehicle.plateNumber}
            </div>
            <div className="text-xs text-muted-foreground truncate">
              {trip.vehicle.brand} {trip.vehicle.model}
            </div>
          </div>
        </div>

        {/* Dates */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">Start:</span>
            <span className="font-medium">{format(new Date(trip.dateStart), "MMM dd, yyyy 'at' HH:mm")}</span>
          </div>
          {trip.dateEnd && (
            <div className="flex items-center gap-2 text-sm">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">End:</span>
              <span className="font-medium">{format(new Date(trip.dateEnd), "MMM dd, yyyy 'at' HH:mm")}</span>
            </div>
          )}
        </div>

        {/* Actions */}
        <div
          className={`flex gap-2 pt-2 border-t ${
            isOngoing ? "border-green-200" : "border-blue-200"
          }`}
        >
          <Link href={`/list/trips/${trip.id}`} className="flex-1">
            <Button variant="outline" className="w-full" size="sm">
              View Details
            </Button>
          </Link>
          {canStart && (
            <Button
              onClick={handleStartTrip}
              disabled={isPending}
              className="flex-1 bg-blue-600 hover:bg-blue-700"
              size="sm"
            >
              <Play className="mr-2 h-4 w-4" />
              Start Trip
            </Button>
          )}
          {canComplete && (
            <Button
              onClick={() => handleStatusUpdate("COMPLETED")}
              disabled={isPending}
              className="flex-1 bg-green-600 hover:bg-green-700"
              size="sm"
            >
              <CheckCircle2 className="mr-2 h-4 w-4" />
              Complete Trip
            </Button>
          )}
          {canCancel && (
            <Button
              onClick={() => handleStatusUpdate("CANCELLED")}
              disabled={isPending}
              variant="destructive"
              size="sm"
              className="flex-1"
            >
              <XCircle className="mr-2 h-4 w-4" />
              Cancel
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

