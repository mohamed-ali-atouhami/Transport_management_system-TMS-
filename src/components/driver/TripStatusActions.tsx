"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { CheckCircle2, XCircle, Play, AlertCircle } from "lucide-react";
import { driverUpdateTripStatus } from "@/lib/actions/driver-actions";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import type { TripStatus } from "@prisma/client";

interface TripStatusActionsProps {
  tripId: string;
  currentStatus: TripStatus;
}

export default function TripStatusActions({ tripId, currentStatus }: TripStatusActionsProps) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const handleStatusUpdate = async (newStatus: "ONGOING" | "COMPLETED" | "CANCELLED") => {
    startTransition(async () => {
      const result = await driverUpdateTripStatus(tripId, newStatus);
      if (result.success) {
        toast.success(
          `Trip ${newStatus === "ONGOING" ? "started" : newStatus === "COMPLETED" ? "completed" : "cancelled"} successfully`
        );
        router.refresh();
      } else {
        toast.error(result.error || "Failed to update trip status");
      }
    });
  };

  return (
    <div className="flex flex-wrap gap-2">
      {currentStatus === "PLANNED" && (
        <>
          <Button
            onClick={() => handleStatusUpdate("ONGOING")}
            disabled={isPending}
            className="bg-green-600 hover:bg-green-700"
            size="sm"
          >
            <Play className="mr-2 h-4 w-4" />
            Start Trip
          </Button>
          <Button
            onClick={() => handleStatusUpdate("CANCELLED")}
            disabled={isPending}
            variant="destructive"
            size="sm"
          >
            <XCircle className="mr-2 h-4 w-4" />
            Cancel Trip
          </Button>
        </>
      )}
      {currentStatus === "ONGOING" && (
        <>
          <Button
            onClick={() => handleStatusUpdate("COMPLETED")}
            disabled={isPending}
            className="bg-green-600 hover:bg-green-700"
            size="sm"
          >
            <CheckCircle2 className="mr-2 h-4 w-4" />
            Complete Trip
          </Button>
          <Button
            onClick={() => handleStatusUpdate("CANCELLED")}
            disabled={isPending}
            variant="destructive"
            size="sm"
          >
            <XCircle className="mr-2 h-4 w-4" />
            Cancel Trip
          </Button>
        </>
      )}
    </div>
  );
}

