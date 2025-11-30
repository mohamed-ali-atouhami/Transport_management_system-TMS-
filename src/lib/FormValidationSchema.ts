import { z } from "zod";

// Trip Schemas
export const tripSchema = z.object({
  id: z.string().optional(),
  driverId: z.string().min(1, { message: "Driver is required!" }),
  vehicleId: z.string().min(1, { message: "Vehicle is required!" }),
  departure: z.string().min(1, { message: "Departure location is required!" }),
  destination: z.string().min(1, { message: "Destination location is required!" }),
  dateStart: z.coerce.date({ message: "Start date is required!" }),
  dateEnd: z.coerce.date().optional().nullable(),
  estimatedDuration: z.coerce.number().positive().optional().nullable(),
  actualDuration: z.coerce.number().positive().optional().nullable(),
  distance: z.coerce.number().positive().optional().nullable(),
  status: z.enum(["PLANNED", "ONGOING", "COMPLETED", "CANCELLED"]).optional(),
  totalCost: z.coerce.number().min(0).optional(),
  notes: z.string().optional().nullable(),
});

export type TripSchema = z.infer<typeof tripSchema>;

// Vehicle Schemas
export const vehicleSchema = z.object({
  id: z.string().optional(),
  plateNumber: z.string().min(1, { message: "Plate number is required!" }),
  type: z.string().min(1, { message: "Type is required!" }),
  brand: z.string().min(1, { message: "Brand is required!" }),
  model: z.string().min(1, { message: "Model is required!" }),
  status: z.enum(["ACTIVE", "IN_MAINTENANCE", "INACTIVE"]).optional(),
  image: z.string().optional().nullable(), // Vehicle image URL from Cloudinary
  mileage: z.coerce.number().min(0).optional(),
  purchaseDate: z.coerce.date().optional().nullable(),
  lastServiceDate: z.coerce.date().optional().nullable(),
  capacityWeight: z.coerce.number().positive().optional().nullable(),
  capacityVolume: z.coerce.number().positive().optional().nullable(),
});

export type VehicleSchema = z.infer<typeof vehicleSchema>;

// User Schemas (for edit only)
export const userSchema = z.object({
  id: z.string(),
  name: z.string().min(1, { message: "Name is required!" }),
  email: z.union([z.string().email(), z.literal("")]).optional().nullable(),
  username: z.string().optional().nullable(), // Optional - can be cleared
  phone: z.string().optional().nullable(),
  role: z.enum(["ADMIN", "DRIVER", "CLIENT"]),
  image: z.string().optional().nullable(), // Profile image URL from Cloudinary
  licenseNumber: z.string().optional(),
  experienceYears: z.coerce.number().min(0).optional(),
  companyName: z.string().optional(),
  address: z.string().optional(),
  vatNumber: z.string().optional(),
});

export type UserSchema = z.infer<typeof userSchema>;

// Shipment Schemas
export const shipmentSchema = z.object({
  id: z.string().optional(),
  tripId: z.string().optional().nullable(),
  clientId: z.string().min(1, { message: "Client is required!" }),
  trackingNumber: z.string().min(1, { message: "Tracking number is required!" }),
  description: z.string().min(1, { message: "Description is required!" }),
  weight: z.coerce.number().positive().optional().nullable(),
  volume: z.coerce.number().positive().optional().nullable(),
  price: z.coerce.number().min(0, { message: "Price is required!" }),
  pickupAddress: z.string().min(1, { message: "Pickup address is required!" }),
  deliveryAddress: z.string().min(1, { message: "Delivery address is required!" }),
  priority: z.enum(["LOW", "NORMAL", "HIGH", "URGENT"]).optional(),
  status: z.enum(["PENDING", "ASSIGNED", "IN_TRANSIT", "DELIVERED", "CANCELLED"]).optional(),
  pickupDate: z.coerce.date().optional().nullable(),
  deliveryDate: z.coerce.date().optional().nullable(),
});

export type ShipmentSchema = z.infer<typeof shipmentSchema>;

// Client Shipment Request Schema (simplified - for clients to request shipments)
export const clientShipmentRequestSchema = z.object({
  description: z.string().min(1, { message: "Description is required!" }),
  weight: z.coerce.number().positive().optional().nullable(),
  volume: z.coerce.number().positive().optional().nullable(),
  pickupAddress: z.string().min(1, { message: "Pickup address is required!" }),
  deliveryAddress: z.string().min(1, { message: "Delivery address is required!" }),
  priority: z.enum(["LOW", "NORMAL", "HIGH", "URGENT"]).optional(),
  pickupDate: z.coerce.date().optional().nullable(),
});

export type ClientShipmentRequestSchema = z.infer<typeof clientShipmentRequestSchema>;

// Expense Schemas
export const expenseSchema = z.object({
  id: z.string().optional(),
  tripId: z.string().optional().nullable(),
  vehicleId: z.string().optional().nullable(),
  type: z.enum(["FUEL", "TOLL", "REPAIR", "MAINTENANCE", "OTHER"], {
    message: "Expense type is required!",
  }),
  amount: z.coerce.number().positive({ message: "Amount must be greater than 0!" }),
  date: z.coerce.date({ message: "Date is required!" }),
  note: z.string().optional().nullable(),
  receiptUrl: z.string().optional().nullable(),
});

export type ExpenseSchema = z.infer<typeof expenseSchema>;

// Driver Profile Schemas
export const driverProfileSchema = z.object({
  id: z.string(),
  userId: z.string(),
  licenseNumber: z.string().min(1, { message: "License number is required!" }),
  experienceYears: z.coerce.number().min(0, { message: "Experience years must be 0 or greater!" }),
  status: z.enum(["ACTIVE", "INACTIVE", "SUSPENDED"], { message: "Status is required!" }),
});

export type DriverProfileSchema = z.infer<typeof driverProfileSchema>;

// Client Profile Schemas
export const clientProfileSchema = z.object({
  id: z.string(),
  userId: z.string(),
  companyName: z.string().min(1, { message: "Company name is required!" }),
  address: z.string().min(1, { message: "Address is required!" }),
  vatNumber: z.string().optional().nullable(),
});

export type ClientProfileSchema = z.infer<typeof clientProfileSchema>;