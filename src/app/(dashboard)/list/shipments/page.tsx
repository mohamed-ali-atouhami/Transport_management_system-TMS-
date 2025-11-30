import { requireRole } from "@/lib/rbac";
import { StatsCard } from "@/components/dashboard/stats-card";
import FormContainer from "@/components/admin/forms/FormContainer";
import { prisma } from "@/lib/prisma";
import { Package, Clock, Truck, CheckCircle, XCircle } from "lucide-react";
import { ITEMS_PER_PAGE } from "@/lib/settings";
import { ShipmentsTable } from "@/components/admin/tables/ShipmentsTable";
import { TableColumn } from "@/components/admin/tables/Table";
import TableSearch from "@/components/admin/tables/TableSearch";
import Pagination from "@/components/admin/tables/Pagination";
import { Prisma } from "@prisma/client";
import { Suspense } from "react";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

type Shipment = {
  id: string;
  tripId: string | null;
  clientId: string;
  trackingNumber: string;
  description: string;
  weight: number | null;
  volume: number | null;
  price: number;
  pickupAddress: string;
  deliveryAddress: string;
  priority: "LOW" | "NORMAL" | "HIGH" | "URGENT";
  status: "PENDING" | "ASSIGNED" | "IN_TRANSIT" | "DELIVERED" | "CANCELLED";
  pickupDate: Date | null;
  deliveryDate: Date | null;
  createdAt: Date;
  client: {
    id: string;
    companyName: string;
    user: {
      id: string;
      name: string;
      email: string;
    };
  };
  trip: {
    id: string;
    departure: string;
    destination: string;
  } | null;
};

const getColumns = (isAdmin: boolean): TableColumn[] => {
  const baseColumns: TableColumn[] = [
    {
      header: "Tracking Number",
      accessor: "trackingNumber",
      sortable: true,
    },
    {
      header: "Client",
      accessor: "client",
      className: "hidden md:table-cell",
      sortable: true,
    },
    {
      header: "Description",
      accessor: "description",
      className: "hidden md:table-cell",
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
          { value: "PENDING", label: "Pending" },
          { value: "ASSIGNED", label: "Assigned" },
          { value: "IN_TRANSIT", label: "In Transit" },
          { value: "DELIVERED", label: "Delivered" },
          { value: "CANCELLED", label: "Cancelled" },
        ],
      },
    },
    {
      header: "Priority",
      accessor: "priority",
      className: "hidden lg:table-cell",
      filter: {
        type: "select",
        paramKey: "priority",
        defaultValue: "ALL",
        options: [
          { value: "ALL", label: "All Priorities" },
          { value: "LOW", label: "Low" },
          { value: "NORMAL", label: "Normal" },
          { value: "HIGH", label: "High" },
          { value: "URGENT", label: "Urgent" },
        ],
      },
    },
    {
      header: "Price",
      accessor: "price",
      className: "hidden lg:table-cell",
      sortable: true,
    },
    {
      header: "Trip",
      accessor: "trip",
      className: "hidden lg:table-cell",
    },
  ];

  // Only add Actions column for admins
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

export default async function ShipmentsPage({ searchParams }: Props) {
  // Allow admin, client, and driver access
  const { userId } = await auth();
  if (!userId) {
    redirect("/onboarding");
  }

  // Check if user is admin, client, or driver
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });

  if (!user || (user.role !== "ADMIN" && user.role !== "CLIENT" && user.role !== "DRIVER")) {
    redirect("/onboarding");
  }

  const isAdmin = user.role === "ADMIN";
  const isClient = user.role === "CLIENT";
  const isDriver = user.role === "DRIVER";

  // Get client or driver profile if needed
  let clientProfile = null;
  let driverProfile = null;

  if (isClient) {
    clientProfile = await prisma.clientProfile.findUnique({
      where: { userId },
    });
    if (!clientProfile) {
      return <div>Client profile not found. Please contact administrator.</div>;
    }
  }

  if (isDriver) {
    driverProfile = await prisma.driverProfile.findUnique({
      where: { userId },
    });
    if (!driverProfile) {
      return <div>Driver profile not found. Please contact administrator.</div>;
    }
  }

  const resolvedParams = await searchParams;
  const { page, search, status, priority, sort, order, clientId } = resolvedParams;
  const pageNumber = page ? Number(page) : 1;

  // Build query conditions
  const query: Prisma.ShipmentWhereInput = {};

  // Filter by clientId if provided in query params (for admin viewing specific client's shipments)
  if (clientId && isAdmin) {
    query.clientId = clientId;
  } else if (isClient && clientProfile) {
    // If client, only show their shipments
    query.clientId = clientProfile.id;
  }

  // If driver, only show shipments assigned to their trips
  if (isDriver && driverProfile) {
    query.trip = {
      driverId: driverProfile.id,
    };
  }

  if (search) {
    query.OR = [
      { trackingNumber: { contains: search, mode: "insensitive" } },
      { description: { contains: search, mode: "insensitive" } },
      { pickupAddress: { contains: search, mode: "insensitive" } },
      { deliveryAddress: { contains: search, mode: "insensitive" } },
      { client: { companyName: { contains: search, mode: "insensitive" } } },
    ];
  }

  if (status && status !== "ALL") {
    query.status = status as "PENDING" | "ASSIGNED" | "IN_TRANSIT" | "DELIVERED" | "CANCELLED";
  }

  if (priority && priority !== "ALL") {
    query.priority = priority as "LOW" | "NORMAL" | "HIGH" | "URGENT";
  }

  // Build orderBy
  let orderBy: Prisma.ShipmentOrderByWithRelationInput = { createdAt: "desc" };
  if (sort) {
    if (sort === "trackingNumber") {
      orderBy = { trackingNumber: order === "asc" ? "asc" : "desc" };
    } else if (sort === "client") {
      orderBy = { client: { companyName: order === "asc" ? "asc" : "desc" } };
    } else if (sort === "price") {
      orderBy = { price: order === "asc" ? "asc" : "desc" };
    }
  }

  // Build stats query filter (same as main query)
  const statsQuery: Prisma.ShipmentWhereInput = {};
  if (clientId && isAdmin) {
    statsQuery.clientId = clientId;
  } else if (isClient && clientProfile) {
    statsQuery.clientId = clientProfile.id;
  }
  if (isDriver && driverProfile) {
    statsQuery.trip = {
      driverId: driverProfile.id,
    };
  }

  // Fetch stats and shipments
  const [totalShipments, pendingShipments, inTransitShipments, deliveredShipments, cancelledShipments, shipmentsData, count, clients, trips] =
    await Promise.all([
      prisma.shipment.count({ where: statsQuery }),
      prisma.shipment.count({ where: { ...statsQuery, status: "PENDING" } }),
      prisma.shipment.count({ where: { ...statsQuery, status: "IN_TRANSIT" } }),
      prisma.shipment.count({ where: { ...statsQuery, status: "DELIVERED" } }),
      prisma.shipment.count({ where: { ...statsQuery, status: "CANCELLED" } }),
      prisma.shipment.findMany({
        where: query,
        take: ITEMS_PER_PAGE,
        skip: (pageNumber - 1) * ITEMS_PER_PAGE,
        orderBy,
        include: {
          client: {
            include: {
              user: true,
            },
          },
          trip: {
            select: {
              id: true,
              departure: true,
              destination: true,
            },
          },
        },
      }),
      prisma.shipment.count({
        where: query,
      }),
      // Only fetch clients and trips if admin (clients don't need this data)
      isAdmin
        ? prisma.clientProfile.findMany({
            include: {
              user: true,
            },
          })
        : Promise.resolve([]),
      isAdmin
        ? prisma.trip.findMany({
            select: {
              id: true,
              departure: true,
              destination: true,
              dateStart: true,
            },
            orderBy: {
              dateStart: "desc",
            },
          })
        : Promise.resolve([]),
    ]);

  // Convert Decimal to number for serialization
  const serializedShipments = shipmentsData.map((shipment) => ({
    ...shipment,
    weight: shipment.weight ? Number(shipment.weight) : null,
    volume: shipment.volume ? Number(shipment.volume) : null,
    price: Number(shipment.price),
  })) as Shipment[];

  const clientsData = Array.isArray(clients) && clients.length > 0
    ? clients.map((client: any) => ({
        id: client.id,
        companyName: client.companyName,
        user: {
          name: client.user.name,
          email: client.user.email,
        },
      }))
    : [];

  const tripsData = Array.isArray(trips) && trips.length > 0
    ? trips.map((trip: any) => ({
        id: trip.id,
        departure: trip.departure,
        destination: trip.destination,
        dateStart: trip.dateStart,
      }))
    : [];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h1 className="text-3xl font-bold">
            {isAdmin ? "Shipment Management" : isDriver ? "My Trip Shipments" : "My Shipments"}
          </h1>
          <p className="text-gray-500 mt-1">
            {isAdmin ? "Manage shipments, track deliveries" : isDriver ? "View shipments assigned to your trips" : "Track your shipments"}
          </p>
        </div>
      </div>

      {/* Stats Cards - Only show for admins (drivers/clients have dashboards) */}
      {isAdmin && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          <StatsCard
            title="Total Shipments"
            value={totalShipments.toString()}
            icon={Package}
          />
          <StatsCard
            title="Pending"
            value={pendingShipments.toString()}
            icon={Clock}
          />
          <StatsCard
            title="In Transit"
            value={inTransitShipments.toString()}
            icon={Truck}
          />
          <StatsCard
            title="Delivered"
            value={deliveredShipments.toString()}
            icon={CheckCircle}
          />
          <StatsCard
            title="Cancelled"
            value={cancelledShipments.toString()}
            icon={XCircle}
          />
        </div>
      )}

      {/* Table */}
      <div className="bg-white p-4 rounded-md flex-1">
        {/* top */}
        <div className="flex justify-between items-center mb-4">
          <h1 className="hidden md:block text-lg font-semibold">
            {isAdmin ? "All Shipments" : isDriver ? "My Trip Shipments" : "My Shipments"}
          </h1>
          <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto">
            <TableSearch placeholder={
              isAdmin 
                ? "Search by tracking number, description, address, or client..." 
                : isDriver
                ? "Search by tracking number, description, or address..."
                : "Search by tracking number, description, or address..."
            } />
            {isAdmin && (
              <div className="flex items-center gap-4 self-end">
                <FormContainer table="shipments" type="create" relatedData={{ clients: clientsData, trips: tripsData }} />
              </div>
            )}
          </div>
        </div>
        {/* list */}
        <Suspense fallback={<div>Loading...</div>}>
          <ShipmentsTable
            shipments={serializedShipments}
            clients={clientsData}
            trips={tripsData}
            columns={getColumns(isAdmin)}
            isAdmin={isAdmin}
          />
        </Suspense>
        {/* pagination */}
        <Pagination page={pageNumber} totalCount={count} />
      </div>
    </div>
  );
}

