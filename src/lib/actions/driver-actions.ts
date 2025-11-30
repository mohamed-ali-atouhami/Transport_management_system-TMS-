"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import type { TripStatus, IssueType, PriorityLevel } from "@prisma/client";

/**
 * Update trip status (driver can only update their own trips)
 */
export async function driverUpdateTripStatus(tripId: string, status: TripStatus) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return {
        success: false,
        error: "Unauthorized",
      };
    }

    // Get driver profile
    const driverProfile = await prisma.driverProfile.findUnique({
      where: { userId },
    });

    if (!driverProfile) {
      return {
        success: false,
        error: "Driver profile not found",
      };
    }

    // Fetch trip with its shipments
    const trip = await prisma.trip.findUnique({
      where: { id: tripId },
      include: {
        shipments: {
          select: {
            id: true,
            status: true,
            pickupDate: true,
            deliveryDate: true,
          },
        },
      },
    });

    if (!trip) {
      return {
        success: false,
        error: "Trip not found",
      };
    }

    // Verify driver owns this trip
    if (trip.driverId !== driverProfile.id) {
      return {
        success: false,
        error: "You can only update your own trips",
      };
    }

    // Validate status transition
    const validTransitions: Record<string, string[]> = {
      PLANNED: ["ONGOING", "CANCELLED"],
      ONGOING: ["COMPLETED", "CANCELLED"],
      COMPLETED: [],
      CANCELLED: [],
    };

    if (!validTransitions[trip.status].includes(status)) {
      return {
        success: false,
        error: `Cannot change status from ${trip.status} to ${status}`,
      };
    }

    // Use transaction to update trip and shipments atomically
    await prisma.$transaction(async (tx) => {
      const updateData: any = { status };

      // If completing trip, set actual duration if not set
      if (status === "COMPLETED" && !trip.actualDuration && trip.dateEnd) {
        const duration = Math.round(
          (new Date(trip.dateEnd).getTime() - new Date(trip.dateStart).getTime()) / (1000 * 60)
        );
        updateData.actualDuration = duration;
      }

      // Update trip status
      await tx.trip.update({
        where: { id: tripId },
        data: updateData,
      });

      // Workflow Automation: Auto-update shipment statuses based on trip status change
      const now = new Date();
      let updatedShipmentsCount = 0;

      if (status === "ONGOING" && trip.status === "PLANNED") {
        // Rule 1: Trip PLANNED → ONGOING: Update ASSIGNED shipments to IN_TRANSIT
        const assignedShipments = trip.shipments.filter(
          (s) => s.status === "ASSIGNED"
        );

        if (assignedShipments.length > 0) {
          // Update status to IN_TRANSIT
          await tx.shipment.updateMany({
            where: {
              id: { in: assignedShipments.map((s) => s.id) },
              status: "ASSIGNED",
            },
            data: {
              status: "IN_TRANSIT",
            },
          });

          // Set pickupDate for shipments that don't have it
          for (const shipment of assignedShipments) {
            if (!shipment.pickupDate) {
              await tx.shipment.update({
                where: { id: shipment.id },
                data: { pickupDate: now },
              });
            }
          }

          updatedShipmentsCount = assignedShipments.length;
        }
      } else if (status === "COMPLETED" && trip.status === "ONGOING") {
        // Rule 2: Trip ONGOING → COMPLETED: Update IN_TRANSIT shipments to DELIVERED
        const inTransitShipments = trip.shipments.filter(
          (s) => s.status === "IN_TRANSIT"
        );

        if (inTransitShipments.length > 0) {
          // Update status to DELIVERED
          await tx.shipment.updateMany({
            where: {
              id: { in: inTransitShipments.map((s) => s.id) },
              status: "IN_TRANSIT",
            },
            data: {
              status: "DELIVERED",
            },
          });

          // Set deliveryDate for shipments that don't have it
          for (const shipment of inTransitShipments) {
            if (!shipment.deliveryDate) {
              await tx.shipment.update({
                where: { id: shipment.id },
                data: { deliveryDate: now },
              });
            }
          }

          updatedShipmentsCount = inTransitShipments.length;
        }
      } else if (status === "CANCELLED") {
        // Rule 3: Trip → CANCELLED: Cancel all shipments that aren't already DELIVERED or CANCELLED
        const cancellableShipments = trip.shipments.filter(
          (s) => s.status !== "DELIVERED" && s.status !== "CANCELLED"
        );

        if (cancellableShipments.length > 0) {
          await tx.shipment.updateMany({
            where: {
              id: { in: cancellableShipments.map((s) => s.id) },
              status: { notIn: ["DELIVERED", "CANCELLED"] },
            },
            data: {
              status: "CANCELLED",
            },
          });

          updatedShipmentsCount = cancellableShipments.length;
        }
      }
    });

    return {
      success: true,
    };
  } catch (error: any) {
    console.error("Error updating trip status:", error);
    return {
      success: false,
      error: error.message || "Failed to update trip status",
    };
  }
}

/**
 * Report an issue for a trip
 */
export async function reportTripIssue(
  tripId: string,
  issueType: IssueType,
  description: string,
  severity: PriorityLevel
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return {
        success: false,
        error: "Unauthorized",
      };
    }

    // Get driver profile
    const driverProfile = await prisma.driverProfile.findUnique({
      where: { userId },
    });

    if (!driverProfile) {
      return {
        success: false,
        error: "Driver profile not found",
      };
    }

    // Verify driver owns this trip
    const trip = await prisma.trip.findUnique({
      where: { id: tripId },
      select: { driverId: true },
    });

    if (!trip) {
      return {
        success: false,
        error: "Trip not found",
      };
    }

    if (trip.driverId !== driverProfile.id) {
      return {
        success: false,
        error: "You can only report issues for your own trips",
      };
    }

    // Create issue record
    await prisma.issue.create({
      data: {
        tripId,
        driverId: driverProfile.id,
        type: issueType,
        severity,
        description: description.trim(),
        status: "OPEN",
      },
    });

    return {
      success: true,
    };
  } catch (error: any) {
    console.error("Error reporting issue:", error);
    return {
      success: false,
      error: error.message || "Failed to report issue",
    };
  }
}

