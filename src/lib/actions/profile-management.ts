"use server";

import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/rbac";

// ==================== Types ====================

type CurrentState = {
  success: boolean;
  error: boolean | string;
};

type DriverProfileSchema = {
  id: string;
  userId: string;
  licenseNumber: string;
  experienceYears: number;
  status: "ACTIVE" | "INACTIVE" | "SUSPENDED";
};

type ClientProfileSchema = {
  id: string;
  userId: string;
  companyName: string;
  address: string;
  vatNumber?: string | null;
};

// ==================== Update Driver Profile ====================

export async function updateDriverProfile(currentState: CurrentState, formData: DriverProfileSchema) {
  if (!formData || !formData.id) {
    console.error('Invalid form data received:', formData);
    return { success: false, error: 'Driver profile ID is required' };
  }

  try {
    await requireRole("admin");

    // Check if driver profile exists
    const existing = await prisma.driverProfile.findUnique({
      where: { id: formData.id },
    });

    if (!existing) {
      return {
        success: false,
        error: "Driver profile not found",
      };
    }

    // Check if license number is being changed and if it already exists
    if (formData.licenseNumber !== existing.licenseNumber) {
      const licenseExists = await prisma.driverProfile.findUnique({
        where: { licenseNumber: formData.licenseNumber },
      });

      if (licenseExists) {
        return {
          success: false,
          error: "A driver with this license number already exists",
        };
      }
    }

    await prisma.driverProfile.update({
      where: { id: formData.id },
      data: {
        licenseNumber: formData.licenseNumber,
        experienceYears: formData.experienceYears,
        status: formData.status,
      },
    });

    return {
      success: true,
      error: false,
    };
  } catch (error: any) {
    console.error("Error updating driver profile:", error);
    return {
      success: false,
      error: error.message || "Failed to update driver profile",
    };
  }
}

// ==================== Update Driver Status ====================

export async function updateDriverStatus(driverId: string, status: "ACTIVE" | "INACTIVE" | "SUSPENDED") {
  try {
    await requireRole("admin");

    const driver = await prisma.driverProfile.findUnique({
      where: { id: driverId },
    });

    if (!driver) {
      return {
        success: false,
        error: "Driver profile not found",
      };
    }

    await prisma.driverProfile.update({
      where: { id: driverId },
      data: { status },
    });

    return {
      success: true,
    };
  } catch (error: any) {
    console.error("Error updating driver status:", error);
    return {
      success: false,
      error: error.message || "Failed to update driver status",
    };
  }
}

// ==================== Update Client Profile ====================

export async function updateClientProfile(currentState: CurrentState, formData: ClientProfileSchema) {
  if (!formData || !formData.id) {
    console.error('Invalid form data received:', formData);
    return { success: false, error: 'Client profile ID is required' };
  }

  try {
    await requireRole("admin");

    // Check if client profile exists
    const existing = await prisma.clientProfile.findUnique({
      where: { id: formData.id },
    });

    if (!existing) {
      return {
        success: false,
        error: "Client profile not found",
      };
    }

    await prisma.clientProfile.update({
      where: { id: formData.id },
      data: {
        companyName: formData.companyName,
        address: formData.address,
        vatNumber: formData.vatNumber || null,
      },
    });

    return {
      success: true,
      error: false,
    };
  } catch (error: any) {
    console.error("Error updating client profile:", error);
    return {
      success: false,
      error: error.message || "Failed to update client profile",
    };
  }
}

