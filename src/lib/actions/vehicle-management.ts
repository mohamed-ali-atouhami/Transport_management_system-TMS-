"use server";

import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/rbac";
import { VehicleSchema } from "@/lib/FormValidationSchema";

// ==================== Types ====================

type CurrentState = {
  success: boolean;
  error: boolean | string;
};

// ==================== Create Vehicle ====================

export async function createVehicle(currentState: CurrentState, formData: VehicleSchema) {
  if (!formData || !formData.plateNumber || !formData.type || !formData.brand || !formData.model) {
    console.error('Invalid form data received:', formData);
    return { success: false, error: 'Missing required fields' };
  }

  try {
    await requireRole("admin");

    // Check if plate number already exists
    const existing = await prisma.vehicle.findUnique({
      where: { plateNumber: formData.plateNumber },
    });

    if (existing) {
      return {
        success: false,
        error: "A vehicle with this plate number already exists",
      };
    }

    await prisma.vehicle.create({
      data: {
        plateNumber: formData.plateNumber,
        type: formData.type,
        brand: formData.brand,
        model: formData.model,
        status: formData.status || "ACTIVE",
        image: formData.image || null,
        mileage: formData.mileage || 0,
        purchaseDate: formData.purchaseDate || null,
        lastServiceDate: formData.lastServiceDate || null,
        capacityWeight: formData.capacityWeight || null,
        capacityVolume: formData.capacityVolume || null,
      },
    });

    return {
      success: true,
      error: false,
    };
  } catch (error: any) {
    console.error("Error creating vehicle:", error);
    return {
      success: false,
      error: error.message || "Failed to create vehicle",
    };
  }
}

// ==================== Update Vehicle ====================

export async function updateVehicle(currentState: CurrentState, formData: VehicleSchema) {
  if (!formData || !formData.id) {
    console.error('Invalid form data received:', formData);
    return { success: false, error: 'Vehicle ID is required' };
  }

  try {
    await requireRole("admin");

    const existing = await prisma.vehicle.findUnique({
      where: { id: formData.id },
    });

    if (!existing) {
      return {
        success: false,
        error: "Vehicle not found",
      };
    }

    // If plate number is being updated, check for duplicates
    if (formData.plateNumber && formData.plateNumber !== existing.plateNumber) {
      const duplicate = await prisma.vehicle.findUnique({
        where: { plateNumber: formData.plateNumber },
      });

      if (duplicate) {
        return {
          success: false,
          error: "A vehicle with this plate number already exists",
        };
      }
    }

    const updateData: any = {};

    if (formData.plateNumber !== undefined) updateData.plateNumber = formData.plateNumber;
    if (formData.type !== undefined) updateData.type = formData.type;
    if (formData.brand !== undefined) updateData.brand = formData.brand;
    if (formData.model !== undefined) updateData.model = formData.model;
    if (formData.status !== undefined) updateData.status = formData.status;
    if (formData.image !== undefined) updateData.image = formData.image || null;
    if (formData.mileage !== undefined) updateData.mileage = formData.mileage;
    if (formData.purchaseDate !== undefined) {
      updateData.purchaseDate = formData.purchaseDate || null;
    }
    if (formData.lastServiceDate !== undefined) {
      updateData.lastServiceDate = formData.lastServiceDate || null;
    }
    if (formData.capacityWeight !== undefined) {
      updateData.capacityWeight = formData.capacityWeight || null;
    }
    if (formData.capacityVolume !== undefined) {
      updateData.capacityVolume = formData.capacityVolume || null;
    }

    await prisma.vehicle.update({
      where: { id: formData.id },
      data: updateData,
    });

    return {
      success: true,
      error: false,
    };
  } catch (error: any) {
    console.error("Error updating vehicle:", error);
    return {
      success: false,
      error: error.message || "Failed to update vehicle",
    };
  }
}

// ==================== Delete Vehicle ====================

export async function deleteVehicle(formData: FormData) {
  const id = formData.get("id") as string;
  
  if (!id) {
    console.error("No vehicle ID provided");
    return false;
  }

  try {
    await requireRole("admin");

    // Check if vehicle has associated trips
    const vehicle = await prisma.vehicle.findUnique({
      where: { id },
      include: {
        trips: {
          where: {
            status: {
              in: ["PLANNED", "ONGOING"],
            },
          },
        },
      },
    });

    if (!vehicle) {
      console.error("Vehicle not found");
      return false;
    }

    if (vehicle.trips.length > 0) {
      console.error("Cannot delete vehicle with active or planned trips");
      return false;
    }

    await prisma.vehicle.delete({
      where: { id },
    });

    return true;
  } catch (error: any) {
    console.error("Error deleting vehicle:", error);
    return false;
  }
}

// ==================== Update Vehicle Status ====================

export async function updateVehicleStatus(vehicleId: string, status: "ACTIVE" | "IN_MAINTENANCE" | "INACTIVE") {
  try {
    await requireRole("admin");

    const vehicle = await prisma.vehicle.findUnique({
      where: { id: vehicleId },
    });

    if (!vehicle) {
      return {
        success: false,
        error: "Vehicle not found",
      };
    }

    await prisma.vehicle.update({
      where: { id: vehicleId },
      data: { status },
    });

    return {
      success: true,
    };
  } catch (error: any) {
    console.error("Error updating vehicle status:", error);
    return {
      success: false,
      error: error.message || "Failed to update vehicle status",
    };
  }
}

