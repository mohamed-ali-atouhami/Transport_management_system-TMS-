"use server";

import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/rbac";
import { ShipmentSchema, ClientShipmentRequestSchema } from "@/lib/FormValidationSchema";
import { auth } from "@clerk/nextjs/server";

// ==================== Types ====================

type ShipmentStatus = "PENDING" | "ASSIGNED" | "IN_TRANSIT" | "DELIVERED" | "CANCELLED";

type CurrentState = {
  success: boolean;
  error: boolean | string;
};

// ==================== Create Shipment ====================

export async function createShipment(currentState: CurrentState, formData: ShipmentSchema) {
  if (!formData || !formData.clientId || !formData.trackingNumber || !formData.description || !formData.price || !formData.pickupAddress || !formData.deliveryAddress) {
    console.error('Invalid form data received:', formData);
    return { success: false, error: 'Missing required fields' };
  }

  try {
    await requireRole("admin");

    // Validate client exists
    const client = await prisma.clientProfile.findUnique({
      where: { id: formData.clientId },
      include: { user: true },
    });

    if (!client) {
      return {
        success: false,
        error: "Client not found",
      };
    }

    // Check if tracking number already exists
    const existing = await prisma.shipment.findUnique({
      where: { trackingNumber: formData.trackingNumber },
    });

    if (existing) {
      return {
        success: false,
        error: "A shipment with this tracking number already exists",
      };
    }

    // Validate trip if provided
    if (formData.tripId) {
      const trip = await prisma.trip.findUnique({
        where: { id: formData.tripId },
      });

      if (!trip) {
        return {
          success: false,
          error: "Trip not found",
        };
      }
    }

    await prisma.shipment.create({
      data: {
        clientId: formData.clientId,
        tripId: formData.tripId || null,
        trackingNumber: formData.trackingNumber,
        description: formData.description,
        weight: formData.weight || null,
        volume: formData.volume || null,
        price: formData.price,
        pickupAddress: formData.pickupAddress,
        deliveryAddress: formData.deliveryAddress,
        priority: formData.priority || "NORMAL",
        status: formData.status || "PENDING",
        pickupDate: formData.pickupDate || null,
        deliveryDate: formData.deliveryDate || null,
      },
    });

    return {
      success: true,
      error: false,
    };
  } catch (error: any) {
    console.error("Error creating shipment:", error);
    return {
      success: false,
      error: error.message || "Failed to create shipment",
    };
  }
}

// ==================== Update Shipment ====================

export async function updateShipment(currentState: CurrentState, formData: ShipmentSchema) {
  if (!formData || !formData.id) {
    console.error('Invalid form data received:', formData);
    return { success: false, error: 'Shipment ID is required' };
  }

  try {
    await requireRole("admin");

    // Ensure all date fields are properly handled
    const processDate = (date: Date | string | null | undefined): Date | null => {
      if (!date) return null;
      if (date instanceof Date) {
        if (isNaN(date.getTime())) return null;
        return date;
      }
      try {
        const parsed = new Date(date);
        if (isNaN(parsed.getTime())) return null;
        return parsed;
      } catch {
        return null;
      }
    };

    const processedFormData = {
      ...formData,
      pickupDate: processDate(formData.pickupDate),
      deliveryDate: processDate(formData.deliveryDate),
      tripId: formData.tripId === "" ? null : formData.tripId,
    };

    const existingShipment = await prisma.shipment.findUnique({
      where: { id: processedFormData.id },
    });

    if (!existingShipment) {
      return {
        success: false,
        error: "Shipment not found",
      };
    }

    // Validate client if provided
    if (processedFormData.clientId) {
      const client = await prisma.clientProfile.findUnique({
        where: { id: processedFormData.clientId },
      });

      if (!client) {
        return {
          success: false,
          error: "Client not found",
        };
      }
    }

    // Validate trip if provided
    if (processedFormData.tripId !== undefined && processedFormData.tripId !== null) {
      const trip = await prisma.trip.findUnique({
        where: { id: processedFormData.tripId },
      });

      if (!trip) {
        return {
          success: false,
          error: "Trip not found",
        };
      }
    }

    // Check if tracking number is being changed and if it already exists
    if (processedFormData.trackingNumber && processedFormData.trackingNumber !== existingShipment.trackingNumber) {
      const existing = await prisma.shipment.findUnique({
        where: { trackingNumber: processedFormData.trackingNumber },
      });

      if (existing) {
        return {
          success: false,
          error: "A shipment with this tracking number already exists",
        };
      }
    }

    const updateData: any = {};

    if (processedFormData.clientId) updateData.clientId = processedFormData.clientId;
    if (processedFormData.tripId !== undefined) updateData.tripId = processedFormData.tripId;
    if (processedFormData.trackingNumber) updateData.trackingNumber = processedFormData.trackingNumber;
    if (processedFormData.description) updateData.description = processedFormData.description;
    if (processedFormData.weight !== undefined) updateData.weight = processedFormData.weight || null;
    if (processedFormData.volume !== undefined) updateData.volume = processedFormData.volume || null;
    if (processedFormData.price !== undefined) updateData.price = processedFormData.price;
    if (processedFormData.pickupAddress) updateData.pickupAddress = processedFormData.pickupAddress;
    if (processedFormData.deliveryAddress) updateData.deliveryAddress = processedFormData.deliveryAddress;
    if (processedFormData.priority) updateData.priority = processedFormData.priority;
    if (processedFormData.status) updateData.status = processedFormData.status;
    if (processedFormData.pickupDate !== undefined) updateData.pickupDate = processedFormData.pickupDate;
    if (processedFormData.deliveryDate !== undefined) updateData.deliveryDate = processedFormData.deliveryDate;

    await prisma.shipment.update({
      where: { id: processedFormData.id },
      data: updateData,
    });

    return {
      success: true,
      error: false,
    };
  } catch (error: any) {
    console.error("Error updating shipment:", error);
    return {
      success: false,
      error: error.message || "Failed to update shipment",
    };
  }
}

// ==================== Delete Shipment ====================

export async function deleteShipment(formData: FormData) {
  const id = formData.get("id") as string;
  
  if (!id) {
    console.error("No shipment ID provided");
    return false;
  }

  try {
    await requireRole("admin");

    const shipment = await prisma.shipment.findUnique({
      where: { id },
    });

    if (!shipment) {
      console.error("Shipment not found");
      return false;
    }

    // Only allow deletion of pending or cancelled shipments
    if (shipment.status !== "PENDING" && shipment.status !== "CANCELLED") {
      console.error("Cannot delete shipment that is not pending or cancelled");
      return false;
    }

    await prisma.shipment.delete({
      where: { id },
    });

    return true;
  } catch (error: any) {
    console.error("Error deleting shipment:", error);
    return false;
  }
}

// ==================== Update Shipment Status ====================

export async function updateShipmentStatus(shipmentId: string, status: ShipmentStatus) {
  try {
    await requireRole("admin");

    const shipment = await prisma.shipment.findUnique({
      where: { id: shipmentId },
    });

    if (!shipment) {
      return {
        success: false,
        error: "Shipment not found",
      };
    }

    // Validate status transition
    const validTransitions: Record<string, string[]> = {
      PENDING: ["ASSIGNED", "CANCELLED"],
      ASSIGNED: ["IN_TRANSIT", "CANCELLED"],
      IN_TRANSIT: ["DELIVERED", "CANCELLED"],
      DELIVERED: [],
      CANCELLED: [],
    };

    if (!validTransitions[shipment.status].includes(status)) {
      return {
        success: false,
        error: `Cannot change status from ${shipment.status} to ${status}`,
      };
    }

    const updateData: any = { status };

    // If delivering shipment, set delivery date if not set
    if (status === "DELIVERED" && !shipment.deliveryDate) {
      updateData.deliveryDate = new Date();
    }

    await prisma.shipment.update({
      where: { id: shipmentId },
      data: updateData,
    });

    return {
      success: true,
    };
  } catch (error: any) {
    console.error("Error updating shipment status:", error);
    return {
      success: false,
      error: error.message || "Failed to update shipment status",
    };
  }
}

// ==================== Client Shipment Request ====================

/**
 * Generate a unique tracking number
 * Format: TRK-YYYYMMDD-XXXX (e.g., TRK-20250115-0001)
 */
function generateTrackingNumber(): string {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, "0");
  return `TRK-${year}${month}${day}-${random}`;
}

export async function requestShipment(currentState: CurrentState, formData: ClientShipmentRequestSchema) {
  if (!formData || !formData.description || !formData.pickupAddress || !formData.deliveryAddress) {
    console.error('Invalid form data received:', formData);
    return { success: false, error: 'Missing required fields' };
  }

  try {
    // Require client role (not admin)
    await requireRole("client");

    const { userId } = await auth();
    if (!userId) {
      return {
        success: false,
        error: "Unauthorized",
      };
    }

    // Get client profile for the logged-in user
    const clientProfile = await prisma.clientProfile.findUnique({
      where: { userId },
      include: { user: true },
    });

    if (!clientProfile) {
      return {
        success: false,
        error: "Client profile not found. Please contact administrator.",
      };
    }

    // Generate unique tracking number
    let trackingNumber = generateTrackingNumber();
    let attempts = 0;
    while (attempts < 10) {
      const existing = await prisma.shipment.findUnique({
        where: { trackingNumber },
      });
      if (!existing) break;
      trackingNumber = generateTrackingNumber();
      attempts++;
    }

    if (attempts >= 10) {
      return {
        success: false,
        error: "Failed to generate unique tracking number. Please try again.",
      };
    }

    // Create shipment with auto-assigned values
    await prisma.shipment.create({
      data: {
        clientId: clientProfile.id,
        tripId: null, // Will be assigned by admin later
        trackingNumber: trackingNumber,
        description: formData.description,
        weight: formData.weight || null,
        volume: formData.volume || null,
        price: 0, // Admin will set price later
        pickupAddress: formData.pickupAddress,
        deliveryAddress: formData.deliveryAddress,
        priority: formData.priority || "NORMAL",
        status: "PENDING", // Always starts as PENDING
        pickupDate: formData.pickupDate || null,
        deliveryDate: null,
      },
    });

    return {
      success: true,
      error: false,
    };
  } catch (error: any) {
    console.error("Error creating shipment request:", error);
    return {
      success: false,
      error: error.message || "Failed to create shipment request",
    };
  }
}

// ==================== Assign Shipment to Trip ====================

export async function assignShipmentToTrip(shipmentId: string, tripId: string) {
  try {
    await requireRole("admin");

    // Validate shipment exists and is pending
    const shipment = await prisma.shipment.findUnique({
      where: { id: shipmentId },
      include: { trip: true },
    });

    if (!shipment) {
      return {
        success: false,
        error: "Shipment not found",
      };
    }

    if (shipment.status !== "PENDING") {
      return {
        success: false,
        error: "Only pending shipments can be assigned to trips",
      };
    }

    // Validate trip exists and is available (PLANNED or ONGOING)
    const trip = await prisma.trip.findUnique({
      where: { id: tripId },
      include: {
        shipments: true,
      },
    });

    if (!trip) {
      return {
        success: false,
        error: "Trip not found",
      };
    }

    if (trip.status !== "PLANNED" && trip.status !== "ONGOING") {
      return {
        success: false,
        error: "Shipments can only be assigned to planned or ongoing trips",
      };
    }

    // Use transaction to ensure data consistency
    await prisma.$transaction(async (tx) => {
      // Update shipment: assign to trip and change status to ASSIGNED
      await tx.shipment.update({
        where: { id: shipmentId },
        data: {
          tripId: tripId,
          status: "ASSIGNED",
        },
      });

      // Update trip total cost (add shipment price)
      await tx.trip.update({
        where: { id: tripId },
        data: {
          totalCost: {
            increment: Number(shipment.price),
          },
        },
      });
    });

    return {
      success: true,
      error: false,
    };
  } catch (error: any) {
    console.error("Error assigning shipment to trip:", error);
    return {
      success: false,
      error: error.message || "Failed to assign shipment to trip",
    };
  }
}

// ==================== Get Available Trips for Assignment ====================

export async function getAvailableTripsForAssignment(shipmentId?: string) {
  try {
    await requireRole("admin");

    // Get shipment details if provided (for route matching)
    let shipment = null;
    if (shipmentId) {
      shipment = await prisma.shipment.findUnique({
        where: { id: shipmentId },
      });
    }

    // Get trips that are PLANNED or ONGOING (available for assignment)
    const trips = await prisma.trip.findMany({
      where: {
        status: {
          in: ["PLANNED", "ONGOING"],
        },
      },
      include: {
        driver: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
        vehicle: {
          select: {
            id: true,
            plateNumber: true,
            brand: true,
            model: true,
          },
        },
        shipments: {
          select: {
            id: true,
          },
        },
        _count: {
          select: {
            shipments: true,
          },
        },
      },
      orderBy: {
        dateStart: "asc",
      },
    });

    // If shipment is provided, add route matching score
    const tripsWithScore = trips.map((trip) => {
      let matchScore = 0;
      let matchReason = "";

      if (shipment) {
        // Check if pickup/delivery addresses match trip route
        const pickupMatch = 
          trip.departure.toLowerCase().includes(shipment.pickupAddress.toLowerCase()) ||
          shipment.pickupAddress.toLowerCase().includes(trip.departure.toLowerCase());
        const deliveryMatch = 
          trip.destination.toLowerCase().includes(shipment.deliveryAddress.toLowerCase()) ||
          shipment.deliveryAddress.toLowerCase().includes(trip.destination.toLowerCase());

        if (pickupMatch && deliveryMatch) {
          matchScore = 100;
          matchReason = "Perfect route match";
        } else if (pickupMatch || deliveryMatch) {
          matchScore = 50;
          matchReason = pickupMatch ? "Pickup location matches" : "Delivery location matches";
        }
      }

      return {
        id: trip.id,
        departure: trip.departure,
        destination: trip.destination,
        dateStart: trip.dateStart,
        dateEnd: trip.dateEnd,
        status: trip.status,
        driver: {
          id: trip.driver.id,
          name: trip.driver.user.name,
          email: trip.driver.user.email,
        },
        vehicle: {
          id: trip.vehicle.id,
          plateNumber: trip.vehicle.plateNumber,
          brand: trip.vehicle.brand,
          model: trip.vehicle.model,
        },
        shipmentCount: trip._count.shipments,
        matchScore,
        matchReason,
      };
    });

    // Sort by match score (highest first), then by date
    tripsWithScore.sort((a, b) => {
      if (b.matchScore !== a.matchScore) {
        return b.matchScore - a.matchScore;
      }
      return a.dateStart.getTime() - b.dateStart.getTime();
    });

    return tripsWithScore;
  } catch (error: any) {
    console.error("Error fetching available trips:", error);
    return [];
  }
}

