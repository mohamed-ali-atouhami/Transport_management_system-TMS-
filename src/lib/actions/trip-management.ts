"use server";

import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/rbac";
import { TripSchema } from "@/lib/FormValidationSchema";
import { createNotification } from "@/lib/actions/notification-management";

// ==================== Types ====================

type TripStatus = "PLANNED" | "ONGOING" | "COMPLETED" | "CANCELLED";

type CurrentState = {
  success: boolean;
  error: boolean | string;
};

// ==================== Create Trip ====================

export async function createTrip(currentState: CurrentState, formData: TripSchema) {
  if (!formData || !formData.driverId || !formData.vehicleId || !formData.departure || !formData.destination || !formData.dateStart) {
    console.error('Invalid form data received:', formData);
    return { success: false, error: 'Missing required fields' };
  }

  try {
    await requireRole("admin");

    // Validate driver exists and is active
    const driver = await prisma.driverProfile.findUnique({
      where: { id: formData.driverId },
      include: { user: true },
    });

    if (!driver) {
      return {
        success: false,
        error: "Driver not found",
      };
    }

    if (driver.status !== "ACTIVE") {
      return {
        success: false,
        error: "Driver is not active",
      };
    }

    // Validate vehicle exists and is available
    const vehicle = await prisma.vehicle.findUnique({
      where: { id: formData.vehicleId },
    });

    if (!vehicle) {
      return {
        success: false,
        error: "Vehicle not found",
      };
    }

    if (vehicle.status !== "ACTIVE") {
      return {
        success: false,
        error: "Vehicle is not active",
      };
    }

    // Check for overlapping trips
    const overlappingTrip = await prisma.trip.findFirst({
      where: {
        OR: [
          {
            driverId: formData.driverId,
            status: { in: ["PLANNED", "ONGOING"] },
            dateStart: { lte: formData.dateEnd ? formData.dateEnd : formData.dateStart },
            dateEnd: { gte: formData.dateStart },
          },
          {
            vehicleId: formData.vehicleId,
            status: { in: ["PLANNED", "ONGOING"] },
            dateStart: { lte: formData.dateEnd ? formData.dateEnd : formData.dateStart },
            dateEnd: { gte: formData.dateStart },
          },
        ],
      },
    });

    if (overlappingTrip) {
      return {
        success: false,
        error: "Driver or vehicle is already assigned to another trip during this time",
      };
    }

    const trip = await prisma.trip.create({
      data: {
        driverId: formData.driverId,
        vehicleId: formData.vehicleId,
        departure: formData.departure,
        destination: formData.destination,
        dateStart: formData.dateStart,
        dateEnd: formData.dateEnd || null,
        estimatedDuration: formData.estimatedDuration || null,
        distance: formData.distance || null,
        totalCost: formData.totalCost || 0,
        notes: formData.notes || null,
        status: "PLANNED",
      },
    });

    // Notify driver about new trip assignment
    await createNotification({
      userId: driver.user.id,
      title: "New Trip Assigned",
      message: `You have been assigned a new trip: ${formData.departure} → ${formData.destination}`,
      type: "TRIP_UPDATE",
      link: `/list/trips/${trip.id}`,
    });

    return {
      success: true,
      error: false,
    };
  } catch (error: any) {
    console.error("Error creating trip:", error);
    return {
      success: false,
      error: error.message || "Failed to create trip",
    };
  }
}

// ==================== Update Trip ====================

export async function updateTrip(currentState: CurrentState, formData: TripSchema) {
  if (!formData || !formData.id) {
    console.error('Invalid form data received:', formData);
    return { success: false, error: 'Trip ID is required' };
  }

  try {
    await requireRole("admin");

    const existingTrip = await prisma.trip.findUnique({
      where: { id: formData.id },
    });

    if (!existingTrip) {
      return {
        success: false,
        error: "Trip not found",
      };
    }

    // If updating driver or vehicle, validate they exist and are active
    if (formData.driverId) {
      const driver = await prisma.driverProfile.findUnique({
        where: { id: formData.driverId },
      });

      if (!driver || driver.status !== "ACTIVE") {
        return {
          success: false,
          error: "Driver not found or not active",
        };
      }
    }

    if (formData.vehicleId) {
      const vehicle = await prisma.vehicle.findUnique({
        where: { id: formData.vehicleId },
      });

      if (!vehicle || vehicle.status !== "ACTIVE") {
        return {
          success: false,
          error: "Vehicle not found or not active",
        };
      }
    }

    // Check for overlapping trips (excluding current trip)
    if (formData.driverId || formData.vehicleId || formData.dateStart || formData.dateEnd) {
      const dateStart = formData.dateStart || existingTrip.dateStart;
      const dateEnd = formData.dateEnd || existingTrip.dateEnd;
      const driverId = formData.driverId || existingTrip.driverId;
      const vehicleId = formData.vehicleId || existingTrip.vehicleId;

      const overlappingTrip = await prisma.trip.findFirst({
        where: {
          id: { not: formData.id },
          status: { in: ["PLANNED", "ONGOING"] },
          OR: [
            {
              driverId: driverId,
              dateStart: { lte: dateEnd || dateStart },
              dateEnd: { gte: dateStart },
            },
            {
              vehicleId: vehicleId,
              dateStart: { lte: dateEnd || dateStart },
              dateEnd: { gte: dateStart },
            },
          ],
        },
      });

      if (overlappingTrip) {
        return {
          success: false,
          error: "Driver or vehicle is already assigned to another trip during this time",
        };
      }
    }

    const updateData: any = {};

    if (formData.driverId) updateData.driverId = formData.driverId;
    if (formData.vehicleId) updateData.vehicleId = formData.vehicleId;
    if (formData.departure) updateData.departure = formData.departure;
    if (formData.destination) updateData.destination = formData.destination;
    if (formData.dateStart) updateData.dateStart = formData.dateStart;
    if (formData.dateEnd !== undefined) updateData.dateEnd = formData.dateEnd || null;
    if (formData.estimatedDuration !== undefined) updateData.estimatedDuration = formData.estimatedDuration || null;
    if (formData.actualDuration !== undefined) updateData.actualDuration = formData.actualDuration || null;
    if (formData.distance !== undefined) updateData.distance = formData.distance || null;
    if (formData.status) updateData.status = formData.status;
    if (formData.totalCost !== undefined) updateData.totalCost = formData.totalCost;
    if (formData.notes !== undefined) updateData.notes = formData.notes || null;

    // Check if status is changing
    const statusChanged = formData.status && formData.status !== existingTrip.status;

    await prisma.trip.update({
      where: { id: formData.id },
      data: updateData,
    });

    // Notify driver and admin if status changed
    if (statusChanged) {
      const updatedTrip = await prisma.trip.findUnique({
        where: { id: formData.id },
        include: {
          driver: {
            include: {
              user: {
                select: { id: true },
              },
            },
          },
        },
      });

      if (updatedTrip) {
        // Notify driver
        await createNotification({
          userId: updatedTrip.driver.user.id,
          title: "Trip Status Updated",
          message: `Trip ${updatedTrip.departure} → ${updatedTrip.destination} is now ${formData.status}`,
          type: "TRIP_UPDATE",
          link: `/list/trips/${formData.id}`,
        });

        // Notify all admins
        const admins = await prisma.user.findMany({
          where: { role: "ADMIN", isActive: true },
          select: { id: true },
        });

        for (const admin of admins) {
          await createNotification({
            userId: admin.id,
            title: "Trip Status Updated",
            message: `Trip ${updatedTrip.departure} → ${updatedTrip.destination} is now ${formData.status}`,
            type: "TRIP_UPDATE",
            link: `/list/trips/${formData.id}`,
          });
        }
      }
    }


    return {
      success: true,
      error: false,
    };
  } catch (error: any) {
    console.error("Error updating trip:", error);
    return {
      success: false,
      error: error.message || "Failed to update trip",
    };
  }
}

// ==================== Delete Trip ====================

export async function deleteTrip(formData: FormData) {
  const id = formData.get("id") as string;
  
  if (!id) {
    console.error("No trip ID provided");
    return false;
  }

  try {
    await requireRole("admin");

    const trip = await prisma.trip.findUnique({
      where: { id },
      include: {
        shipments: true,
        expenses: true,
      },
    });

    if (!trip) {
      console.error("Trip not found");
      return false;
    }

    // Check if trip has shipments or expenses
    if (trip.shipments.length > 0) {
      console.error("Cannot delete trip with assigned shipments");
      return false;
    }

    if (trip.expenses.length > 0) {
      console.error("Cannot delete trip with expenses");
      return false;
    }

    await prisma.trip.delete({
      where: { id },
    });


    return true;
  } catch (error: any) {
    console.error("Error deleting trip:", error);
    return false;
  }
}

// ==================== Update Trip Status ====================

export async function updateTripStatus(tripId: string, status: TripStatus) {
  try {
    await requireRole("admin");

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
          console.log(
            `[Workflow] Trip ${tripId}: Updated ${updatedShipmentsCount} shipments from ASSIGNED to IN_TRANSIT`
          );
        }
      } else if (status === "COMPLETED" && trip.status === "ONGOING") {
        // Rule 2: Trip ONGOING → COMPLETED: Update IN_TRANSIT shipments to DELIVERED
        const inTransitShipments = trip.shipments.filter(
          (s) => s.status === "IN_TRANSIT"
        );

        if (inTransitShipments.length > 0) {
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
          console.log(
            `[Workflow] Trip ${tripId}: Updated ${updatedShipmentsCount} shipments from IN_TRANSIT to DELIVERED`
          );
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
          console.log(
            `[Workflow] Trip ${tripId}: Cancelled ${updatedShipmentsCount} shipments`
          );
        }
      }
    });

    // Notify driver and admin about status change
    const updatedTrip = await prisma.trip.findUnique({
      where: { id: tripId },
      include: {
        driver: {
          include: {
            user: {
              select: { id: true },
            },
          },
        },
      },
    });

    if (updatedTrip) {
      // Notify driver
      await createNotification({
        userId: updatedTrip.driver.user.id,
        title: "Trip Status Updated",
        message: `Trip ${updatedTrip.departure} → ${updatedTrip.destination} is now ${status}`,
        type: "TRIP_UPDATE",
        link: `/list/trips/${tripId}`,
      });

      // Notify all admins
      const admins = await prisma.user.findMany({
        where: { role: "ADMIN", isActive: true },
        select: { id: true },
      });

      for (const admin of admins) {
        await createNotification({
          userId: admin.id,
          title: "Trip Status Updated",
          message: `Trip ${updatedTrip.departure} → ${updatedTrip.destination} is now ${status}`,
          type: "TRIP_UPDATE",
          link: `/list/trips/${tripId}`,
        });
      }
    }

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

// ==================== Get Smart Driver Suggestions ====================

export async function getSmartDriverSuggestions(dateStart: Date, dateEnd?: Date | null) {
  try {
    await requireRole("admin");

    const endDate = dateEnd || dateStart;

    // Get all active drivers
    const allDrivers = await prisma.driverProfile.findMany({
      where: {
        status: "ACTIVE",
        user: {
          isActive: true,
        },
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        trips: {
          where: {
            status: {
              in: ["PLANNED", "ONGOING"],
            },
            dateStart: { lte: endDate },
            dateEnd: { gte: dateStart },
          },
          select: {
            id: true,
            departure: true,
            destination: true,
            dateStart: true,
            dateEnd: true,
          },
        },
        _count: {
          select: {
            trips: true,
          },
        },
      },
      orderBy: {
        user: {
          name: "asc",
        },
      },
    });

    // Score and rank drivers
    const driversWithScore = allDrivers.map((driver) => {
      let score = 100;
      let reasons: string[] = [];
      let availabilityStatus = "Available";

      // Check availability (no overlapping trips)
      if (driver.trips.length > 0) {
        score = 0;
        availabilityStatus = "Unavailable";
        reasons.push(`Has ${driver.trips.length} overlapping trip(s)`);
      } else {
        reasons.push("No overlapping trips");
      }

      // Prefer drivers with fewer total trips (less workload)
      const totalTrips = driver._count.trips;
      if (totalTrips === 0) {
        score += 20;
        reasons.push("No previous trips (fresh)");
      } else if (totalTrips < 5) {
        score += 10;
        reasons.push("Low workload");
      }

      return {
        id: driver.id,
        name: driver.user.name,
        email: driver.user.email || "",
        licenseNumber: driver.licenseNumber,
        experienceYears: driver.experienceYears,
        status: driver.status,
        score,
        availabilityStatus,
        reasons,
        overlappingTrips: driver.trips,
        totalTrips,
      };
    });

    // Sort by score (highest first), then by name
    driversWithScore.sort((a, b) => {
      if (b.score !== a.score) {
        return b.score - a.score;
      }
      return a.name.localeCompare(b.name);
    });

    return driversWithScore;
  } catch (error: any) {
    console.error("Error fetching smart driver suggestions:", error);
    return [];
  }
}

// ==================== Get Smart Vehicle Suggestions ====================

export async function getSmartVehicleSuggestions(dateStart: Date, dateEnd?: Date | null) {
  try {
    await requireRole("admin");

    const endDate = dateEnd || dateStart;

    // Get all active vehicles
    const allVehicles = await prisma.vehicle.findMany({
      where: {
        status: "ACTIVE",
      },
      include: {
        trips: {
          where: {
            status: {
              in: ["PLANNED", "ONGOING"],
            },
            dateStart: { lte: endDate },
            dateEnd: { gte: dateStart },
          },
          select: {
            id: true,
            departure: true,
            destination: true,
            dateStart: true,
            dateEnd: true,
          },
        },
        _count: {
          select: {
            trips: true,
          },
        },
      },
      orderBy: {
        plateNumber: "asc",
      },
    });

    // Score and rank vehicles
    const vehiclesWithScore = allVehicles.map((vehicle) => {
      let score = 100;
      let reasons: string[] = [];
      let availabilityStatus = "Available";

      // Check availability (no overlapping trips)
      if (vehicle.trips.length > 0) {
        score = 0;
        availabilityStatus = "Unavailable";
        reasons.push(`Has ${vehicle.trips.length} overlapping trip(s)`);
      } else {
        reasons.push("No overlapping trips");
      }

      // Prefer vehicles with lower mileage (newer/better condition)
      if (vehicle.mileage) {
        const mileage = Number(vehicle.mileage);
        if (mileage < 50000) {
          score += 15;
          reasons.push("Low mileage");
        } else if (mileage < 100000) {
          score += 5;
          reasons.push("Moderate mileage");
        }
      }

      // Prefer vehicles with fewer total trips (less wear)
      const totalTrips = vehicle._count.trips;
      if (totalTrips < 10) {
        score += 10;
        reasons.push("Low usage");
      }

      return {
        id: vehicle.id,
        plateNumber: vehicle.plateNumber,
        brand: vehicle.brand,
        model: vehicle.model,
        type: vehicle.type,
        mileage: vehicle.mileage ? Number(vehicle.mileage) : null,
        status: vehicle.status,
        capacityWeight: vehicle.capacityWeight ? Number(vehicle.capacityWeight) : null,
        capacityVolume: vehicle.capacityVolume ? Number(vehicle.capacityVolume) : null,
        score,
        availabilityStatus,
        reasons,
        overlappingTrips: vehicle.trips,
        totalTrips,
      };
    });

    // Sort by score (highest first), then by plate number
    vehiclesWithScore.sort((a, b) => {
      if (b.score !== a.score) {
        return b.score - a.score;
      }
      return a.plateNumber.localeCompare(b.plateNumber);
    });

    return vehiclesWithScore;
  } catch (error: any) {
    console.error("Error fetching smart vehicle suggestions:", error);
    return [];
  }
}

