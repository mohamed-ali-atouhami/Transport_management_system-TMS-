import { requireAnyRole } from "@/lib/rbac";
import { StatsCard } from "@/components/dashboard/stats-card";
import FormContainer from "@/components/admin/forms/FormContainer";
import { prisma } from "@/lib/prisma";
import { Route, Clock, CheckCircle } from "lucide-react";
import { ITEMS_PER_PAGE } from "@/lib/settings";
import { TableColumn } from "@/components/admin/tables/Table";
import TableSearch from "@/components/admin/tables/TableSearch";
import Pagination from "@/components/admin/tables/Pagination";
import { Prisma } from "@prisma/client";
import { TripsTable } from "@/components/admin/tables/TripsTable";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

type Trip = {
  id: string;
  driverId: string;
  vehicleId: string;
  departure: string;
  destination: string;
  dateStart: Date;
  dateEnd: Date | null;
  estimatedDuration: number | null;
  actualDuration: number | null;
  distance: number | null;
  status: "PLANNED" | "ONGOING" | "COMPLETED" | "CANCELLED";
  totalCost: number;
  notes: string | null;
  createdAt: Date;
  driver: {
    id: string;
    user: {
      id: string;
      name: string;
      email: string;
    };
  };
  vehicle: {
    id: string;
    plateNumber: string;
    brand: string;
    model: string;
  };
  _count: {
    shipments: number;
    expenses: number;
  };
};

const getColumns = (isAdmin: boolean): TableColumn[] => {
  const baseColumns: TableColumn[] = [
    {
      header: "Route",
      accessor: "route",
    },
    {
      header: "Driver",
      accessor: "driver",
      className: "hidden md:table-cell",
    },
    {
      header: "Vehicle",
      accessor: "vehicle",
      className: "hidden md:table-cell",
    },
    {
      header: "Start Date",
      accessor: "dateStart",
      className: "hidden lg:table-cell",
      sortable: true,
    },
    {
      header: "Status",
      accessor: "status",
      filter: {
        type: "select",
        paramKey: "status",
        defaultValue: "ALL",
        options: [
          { value: "ALL", label: "All Status" },
          { value: "PLANNED", label: "Planned" },
          { value: "ONGOING", label: "Ongoing" },
          { value: "COMPLETED", label: "Completed" },
          { value: "CANCELLED", label: "Cancelled" },
        ],
      },
    },
    {
      header: "Cost",
      accessor: "cost",
      className: "hidden lg:table-cell",
    },
  ];

  // Add View/Actions column for all users
  baseColumns.push({
    header: isAdmin ? "Actions" : "View",
    accessor: "actions",
  });

  return baseColumns;
};


interface Props {
  searchParams: Promise<{ [key: string]: string | undefined }>;
}

export default async function TripsPage({ searchParams }: Props) {
  // Allow admin, driver, and client access
  await requireAnyRole(["admin", "driver", "client"]);

  const { userId } = await auth();
  if (!userId) {
    redirect("/onboarding");
  }

  // Get user role and profile
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });

  if (!user || (user.role !== "ADMIN" && user.role !== "DRIVER" && user.role !== "CLIENT")) {
    redirect("/onboarding");
  }

  const isAdmin = user.role === "ADMIN";
  const isDriver = user.role === "DRIVER";
  const isClient = user.role === "CLIENT";

  // Get driver or client profile if needed
  let driverProfile = null;
  let clientProfile = null;

  if (isDriver) {
    driverProfile = await prisma.driverProfile.findUnique({
      where: { userId },
    });
    if (!driverProfile) {
      return <div>Driver profile not found. Please contact administrator.</div>;
    }
  }

  if (isClient) {
    clientProfile = await prisma.clientProfile.findUnique({
      where: { userId },
    });
    if (!clientProfile) {
      return <div>Client profile not found. Please contact administrator.</div>;
    }
  }

  const resolvedParams = await searchParams;
  const { page, search, status, driverId, vehicleId, ...queryparams } = resolvedParams;
  const pageNumber = page ? Number(page) : 1;

  // Build query conditions
  const query: Prisma.TripWhereInput = {};

  // Filter by driverId or vehicleId if provided in query params (for admin viewing specific driver's/vehicle's trips)
  if (driverId && isAdmin) {
    query.driverId = driverId;
  } else if (vehicleId && isAdmin) {
    query.vehicleId = vehicleId;
  } else if (isDriver && driverProfile) {
    // Drivers see only their own trips
    query.driverId = driverProfile.id;
  } else if (isClient && clientProfile) {
    // Clients see trips that have their shipments
    query.shipments = {
      some: {
        clientId: clientProfile.id,
      },
    };
  }
  // Admins see all trips (no filter) unless driverId or vehicleId is specified

  if (search) {
    query.OR = [
      { departure: { contains: search, mode: "insensitive" } },
      { destination: { contains: search, mode: "insensitive" } },
      { driver: { user: { name: { contains: search, mode: "insensitive" } } } },
      { vehicle: { plateNumber: { contains: search, mode: "insensitive" } } },
    ];
  }

  if (status && status !== "ALL") {
    query.status = status as "PLANNED" | "ONGOING" | "COMPLETED" | "CANCELLED";
  }

  // Handle sorting
  const sort = resolvedParams.sort || "dateStart";
  const order = resolvedParams.order || "desc";
  let orderBy: any = { dateStart: "desc" };
  if (sort === "dateStart") {
    orderBy = { dateStart: order };
  } else if (sort === "totalCost") {
    orderBy = { totalCost: order };
  }

  // Build stats query (same filters as main query)
  const statsQuery: Prisma.TripWhereInput = {};
  if (driverId && isAdmin) {
    statsQuery.driverId = driverId;
  } else if (vehicleId && isAdmin) {
    statsQuery.vehicleId = vehicleId;
  } else if (isDriver && driverProfile) {
    statsQuery.driverId = driverProfile.id;
  } else if (isClient && clientProfile) {
    statsQuery.shipments = {
      some: {
        clientId: clientProfile.id,
      },
    };
  }

  // Fetch stats, trips, drivers, and vehicles
  const [totalTrips, plannedTrips, ongoingTrips, completedTrips, tripsData, count, drivers, vehicles] =
    await Promise.all([
      prisma.trip.count({ where: statsQuery }),
      prisma.trip.count({ where: { ...statsQuery, status: "PLANNED" } }),
      prisma.trip.count({ where: { ...statsQuery, status: "ONGOING" } }),
      prisma.trip.count({ where: { ...statsQuery, status: "COMPLETED" } }),
      prisma.trip.findMany({
        where: query,
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
          _count: {
            select: {
              shipments: true,
              expenses: true,
            },
          },
        },
        take: ITEMS_PER_PAGE,
        skip: (pageNumber - 1) * ITEMS_PER_PAGE,
        orderBy,
      }),
      prisma.trip.count({
        where: query,
      }),
      // Only fetch drivers and vehicles for admins (needed for forms)
      isAdmin
        ? prisma.driverProfile.findMany({
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
          })
        : Promise.resolve([]),
      isAdmin
        ? prisma.vehicle.findMany({
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
          })
        : Promise.resolve([]),
    ]);

  // Convert Decimal to number for serialization
  const serializedTrips = tripsData.map((trip) => ({
    ...trip,
    distance: trip.distance ? Number(trip.distance) : null,
    totalCost: Number(trip.totalCost),
  })) as Trip[];

  const driversData = drivers.map((driver) => ({
    id: driver.id,
    name: driver.user.name,
    email: driver.user.email || "",
    licenseNumber: driver.licenseNumber,
  }));

  const vehiclesData = vehicles.map((vehicle) => ({
    id: vehicle.id,
    label: `${vehicle.plateNumber} - ${vehicle.brand} ${vehicle.model} (${vehicle.type})`,
    plateNumber: vehicle.plateNumber,
    brand: vehicle.brand,
    model: vehicle.model,
    type: vehicle.type,
  }));

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">{isAdmin ? "Trip Management" : isDriver ? "My Trips" : "My Shipment Trips"}</h1>
          <p className="text-gray-500 mt-1">
            {isAdmin ? "Manage trips, assign drivers and vehicles" : isDriver ? "View and manage your assigned trips" : "View trips carrying your shipments"}
          </p>
        </div>
      </div>

      {/* Stats Cards - Only show for admins (drivers/clients have dashboards) */}
      {isAdmin && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatsCard
            title="Total Trips"
            value={totalTrips.toString()}
            icon={Route}
          />
          <StatsCard
            title="Planned"
            value={plannedTrips.toString()}
            icon={Clock}
          />
          <StatsCard
            title="Ongoing"
            value={ongoingTrips.toString()}
            icon={Route}
          />
          <StatsCard
            title="Completed"
            value={completedTrips.toString()}
            icon={CheckCircle}
          />
        </div>
      )}

      {/* Table */}
      <div className="bg-white p-4 rounded-md flex-1">
        {/* top */}
        <div className="flex justify-between items-center mb-4">
          <h1 className="hidden md:block text-lg font-semibold">{isAdmin ? "All Trips" : isDriver ? "My Trips" : "My Shipment Trips"}</h1>
          <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto">
            <TableSearch placeholder={isAdmin ? "Search by route, driver, or vehicle..." : "Search by route..."} />
            {isAdmin && (
              <div className="flex items-center gap-4 self-end">
                <FormContainer table="trips" type="create" />
              </div>
            )}
          </div>
        </div>
        {/* list */}
        <TripsTable
          trips={serializedTrips}
          drivers={driversData}
          vehicles={vehiclesData}
          columns={getColumns(isAdmin)}
          isAdmin={isAdmin}
        />
        {/* pagination */}
        <Pagination page={pageNumber} totalCount={count} />
      </div>
    </div>
  );
}
