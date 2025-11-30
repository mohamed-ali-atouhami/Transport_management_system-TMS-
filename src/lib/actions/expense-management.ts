"use server";

import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/rbac";
import { ExpenseSchema } from "@/lib/FormValidationSchema";
import { auth } from "@clerk/nextjs/server";

// ==================== Types ====================

type CurrentState = {
  success: boolean;
  error: boolean | string;
};

// ==================== Create Expense ====================

export async function createExpense(currentState: CurrentState, formData: ExpenseSchema) {
  if (!formData || !formData.type || !formData.amount || !formData.date) {
    console.error('Invalid form data received:', formData);
    return { success: false, error: 'Missing required fields' };
  }

  try {
    await requireRole("admin");

    const { userId } = await auth();
    if (!userId) {
      return {
        success: false,
        error: "Unauthorized",
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

    // Validate vehicle if provided
    if (formData.vehicleId) {
      const vehicle = await prisma.vehicle.findUnique({
        where: { id: formData.vehicleId },
      });

      if (!vehicle) {
        return {
          success: false,
          error: "Vehicle not found",
        };
      }
    }

    await prisma.expense.create({
      data: {
        tripId: formData.tripId || null,
        vehicleId: formData.vehicleId || null,
        createdById: userId,
        type: formData.type,
        amount: formData.amount,
        date: formData.date,
        note: formData.note || null,
        receiptUrl: formData.receiptUrl || null,
      },
    });

    return {
      success: true,
      error: false,
    };
  } catch (error: any) {
    console.error("Error creating expense:", error);
    return {
      success: false,
      error: error.message || "Failed to create expense",
    };
  }
}

// ==================== Update Expense ====================

export async function updateExpense(currentState: CurrentState, formData: ExpenseSchema) {
  if (!formData || !formData.id) {
    console.error('Invalid form data received:', formData);
    return { success: false, error: 'Expense ID is required' };
  }

  try {
    await requireRole("admin");

    const { id, ...updateData } = formData;

    // Validate trip if provided
    if (updateData.tripId) {
      const trip = await prisma.trip.findUnique({
        where: { id: updateData.tripId },
      });

      if (!trip) {
        return {
          success: false,
          error: "Trip not found",
        };
      }
    }

    // Validate vehicle if provided
    if (updateData.vehicleId) {
      const vehicle = await prisma.vehicle.findUnique({
        where: { id: updateData.vehicleId },
      });

      if (!vehicle) {
        return {
          success: false,
          error: "Vehicle not found",
        };
      }
    }

    await prisma.expense.update({
      where: { id },
      data: {
        tripId: updateData.tripId || null,
        vehicleId: updateData.vehicleId || null,
        type: updateData.type,
        amount: updateData.amount,
        date: updateData.date,
        note: updateData.note || null,
        receiptUrl: updateData.receiptUrl || null,
      },
    });

    return {
      success: true,
      error: false,
    };
  } catch (error: any) {
    console.error("Error updating expense:", error);
    return {
      success: false,
      error: error.message || "Failed to update expense",
    };
  }
}

// ==================== Delete Expense ====================

export async function deleteExpense(formData: FormData) {
  const id = formData.get("id") as string;

  if (!id) {
    console.error("No expense ID provided");
    return false;
  }

  try {
    await requireRole("admin");

    await prisma.expense.delete({
      where: { id },
    });

    return true;
  } catch (error: any) {
    console.error("Error deleting expense:", error);
    return false;
  }
}

// ==================== Get Expenses ====================

export async function getExpenses({
  search = "",
  page = 1,
  limit = 10,
  sort = "date",
  order = "desc",
  tripId,
  vehicleId,
  type,
}: {
  search?: string;
  page?: number;
  limit?: number;
  sort?: string;
  order?: "asc" | "desc";
  tripId?: string;
  vehicleId?: string;
  type?: string;
} = {}) {
  try {
    await requireRole("admin");

    const skip = (page - 1) * limit;

    const where: any = {};

    if (search) {
      where.OR = [
        { note: { contains: search, mode: "insensitive" } },
      ];
    }

    if (tripId) {
      where.tripId = tripId;
    }

    if (vehicleId) {
      where.vehicleId = vehicleId;
    }

    if (type) {
      where.type = type;
    }

    const orderBy: any = {};
    if (sort === "amount") {
      orderBy.amount = order;
    } else if (sort === "date") {
      orderBy.date = order;
    } else if (sort === "type") {
      orderBy.type = order;
    } else {
      orderBy.createdAt = order;
    }

    const [expenses, count] = await Promise.all([
      prisma.expense.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: {
          trip: {
            select: {
              id: true,
              departure: true,
              destination: true,
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
          createdBy: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      }),
      prisma.expense.count({ where }),
    ]);

    return {
      expenses,
      count,
      totalPages: Math.ceil(count / limit),
    };
  } catch (error: any) {
    console.error("Error fetching expenses:", error);
    return {
      expenses: [],
      count: 0,
      totalPages: 0,
    };
  }
}

// ==================== Get Expense ====================

export async function getExpense(id: string) {
  try {
    await requireRole("admin");

    const expense = await prisma.expense.findUnique({
      where: { id },
      include: {
        trip: {
          select: {
            id: true,
            departure: true,
            destination: true,
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
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return expense;
  } catch (error: any) {
    console.error("Error fetching expense:", error);
    return null;
  }
}

// ==================== Get Trips for Select ====================

export async function getTripsForExpense() {
  try {
    await requireRole("admin");

    const trips = await prisma.trip.findMany({
      select: {
        id: true,
        departure: true,
        destination: true,
        dateStart: true,
      },
      orderBy: {
        dateStart: "desc",
      },
    });

    return trips;
  } catch (error: any) {
    console.error("Error fetching trips:", error);
    return [];
  }
}

// ==================== Get Vehicles for Select ====================

export async function getVehiclesForExpense() {
  try {
    await requireRole("admin");

    const vehicles = await prisma.vehicle.findMany({
      select: {
        id: true,
        plateNumber: true,
        brand: true,
        model: true,
        type: true,
      },
      orderBy: {
        plateNumber: "asc",
      },
    });

    return vehicles;
  } catch (error: any) {
    console.error("Error fetching vehicles:", error);
    return [];
  }
}

