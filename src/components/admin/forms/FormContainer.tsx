import { prisma } from "@/lib/prisma";
import FormModal from "./FormModal";

type RelatedData = {
  drivers?: { id: string; name: string; email: string; licenseNumber: string }[];
  vehicles?: { id: string; label: string; plateNumber: string; brand: string; model: string; type: string }[];
  clients?: { id: string; companyName: string; user: { name: string; email: string } }[];
  trips?: { id: string; departure: string; destination: string; dateStart: Date }[];
};

export type FormContainerProps = {
  table: "trips" | "users" | "vehicles" | "shipments" | "expenses";
  type: "create" | "edit" | "delete";
  data?: Record<string, unknown> | null;
  id?: string;
  relatedData?: RelatedData;
};

export default async function FormContainer({ table, type, data, id, relatedData }: FormContainerProps) {
  let fetchedRelatedData: RelatedData = relatedData || {};

  if (type !== "delete") {
    switch (table) {
      case "trips":
        const [drivers, vehicles] = await Promise.all([
          prisma.driverProfile.findMany({
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
            },
            orderBy: {
              user: {
                name: "asc",
              },
            },
          }),
          prisma.vehicle.findMany({
            where: {
              status: "ACTIVE",
            },
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
          }),
        ]);

        fetchedRelatedData.drivers = drivers.map((driver) => ({
          id: driver.id,
          name: driver.user.name,
          email: driver.user.email || "",
          licenseNumber: driver.licenseNumber,
        }));

        fetchedRelatedData.vehicles = vehicles.map((vehicle) => ({
          id: vehicle.id,
          label: `${vehicle.plateNumber} - ${vehicle.brand} ${vehicle.model} (${vehicle.type})`,
          plateNumber: vehicle.plateNumber,
          brand: vehicle.brand,
          model: vehicle.model,
          type: vehicle.type,
        }));
        break;
      case "shipments":
        const [clients, trips] = await Promise.all([
          prisma.clientProfile.findMany({
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
            },
            orderBy: {
              companyName: "asc",
            },
          }),
          prisma.trip.findMany({
            where: {
              status: {
                in: ["PLANNED", "ONGOING"],
              },
            },
            select: {
              id: true,
              departure: true,
              destination: true,
              dateStart: true,
            },
            orderBy: {
              dateStart: "desc",
            },
          }),
        ]);

        fetchedRelatedData.clients = clients.map((client) => ({
          id: client.id,
          companyName: client.companyName,
          user: {
            name: client.user.name,
            email: client.user.email || "",
          },
        }));

        fetchedRelatedData.trips = trips.map((trip) => ({
          id: trip.id,
          departure: trip.departure,
          destination: trip.destination,
          dateStart: trip.dateStart,
        }));
        break;
      case "expenses":
        const [expenseTrips, expenseVehicles] = await Promise.all([
          prisma.trip.findMany({
            select: {
              id: true,
              departure: true,
              destination: true,
              dateStart: true,
            },
            orderBy: {
              dateStart: "desc",
            },
          }),
          prisma.vehicle.findMany({
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
          }),
        ]);

        fetchedRelatedData.trips = expenseTrips.map((trip) => ({
          id: trip.id,
          departure: trip.departure,
          destination: trip.destination,
          dateStart: trip.dateStart,
        }));

        fetchedRelatedData.vehicles = expenseVehicles.map((vehicle) => ({
          id: vehicle.id,
          label: `${vehicle.plateNumber} - ${vehicle.brand} ${vehicle.model} (${vehicle.type})`,
          plateNumber: vehicle.plateNumber,
          brand: vehicle.brand,
          model: vehicle.model,
          type: vehicle.type,
        }));
        break;
      // Add cases for users and vehicles later
      default:
        break;
    }
  }

  return <FormModal table={table} type={type} data={data} id={id} relatedData={fetchedRelatedData} />;
}

