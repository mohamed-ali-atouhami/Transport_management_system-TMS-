import { requireRole } from "@/lib/rbac";
import { StatsCard } from "@/components/dashboard/stats-card";
import FormContainer from "@/components/admin/forms/FormContainer";
import { prisma } from "@/lib/prisma";
import { Truck, Wrench, CheckCircle } from "lucide-react";
import { ITEMS_PER_PAGE } from "@/lib/settings";
import { VehiclesTable } from "@/components/admin/tables/VehiclesTable";
import { TableColumn } from "@/components/admin/tables/Table";
import TableSearch from "@/components/admin/tables/TableSearch";
import Pagination from "@/components/admin/tables/Pagination";
import { Prisma } from "@prisma/client";
import { Badge } from "@/components/ui/badge";
import { VehicleActions } from "@/components/admin/tables/VehicleActions";
import { TableRow, TableCell } from "@/components/ui/table";

type Vehicle = {
  id: string;
  plateNumber: string;
  type: string;
  brand: string;
  model: string;
  status: "ACTIVE" | "IN_MAINTENANCE" | "INACTIVE";
  image: string | null;
  mileage: number;
  purchaseDate: Date | null;
  lastServiceDate: Date | null;
  capacityWeight: number | null;
  capacityVolume: number | null;
  createdAt: Date;
};

const getColumns = (): TableColumn[] => [
  {
    header: "Plate Number",
    accessor: "plateNumber",
  },
  {
    header: "Type",
    accessor: "type",
    className: "hidden md:table-cell",
  },
  {
    header: "Brand & Model",
    accessor: "brandModel",
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
        { value: "ACTIVE", label: "Active" },
        { value: "IN_MAINTENANCE", label: "In Maintenance" },
        { value: "INACTIVE", label: "Inactive" },
      ],
    },
  },
  {
    header: "Mileage",
    accessor: "mileage",
    className: "hidden lg:table-cell",
  },
  {
    header: "Actions",
    accessor: "actions",
  },
];


interface Props {
  searchParams: Promise<{ [key: string]: string | undefined }>;
}

export default async function VehiclesPage({ searchParams }: Props) {
  await requireRole("admin");

  const resolvedParams = await searchParams;
  const { page, search, status, ...queryparams } = resolvedParams;
  const pageNumber = page ? Number(page) : 1;

  // Build query conditions
  const query: Prisma.VehicleWhereInput = {};

  if (search) {
    query.OR = [
      { plateNumber: { contains: search, mode: "insensitive" } },
      { brand: { contains: search, mode: "insensitive" } },
      { model: { contains: search, mode: "insensitive" } },
      { type: { contains: search, mode: "insensitive" } },
    ];
  }

  if (status && status !== "ALL") {
    query.status = status as "ACTIVE" | "IN_MAINTENANCE" | "INACTIVE";
  }

  // Fetch stats and vehicles
  const [totalVehicles, activeVehicles, inMaintenanceVehicles, vehiclesData, count] =
    await Promise.all([
      prisma.vehicle.count(),
      prisma.vehicle.count({ where: { status: "ACTIVE" } }),
      prisma.vehicle.count({ where: { status: "IN_MAINTENANCE" } }),
      prisma.vehicle.findMany({
        where: query,
        take: ITEMS_PER_PAGE,
        skip: (pageNumber - 1) * ITEMS_PER_PAGE,
        orderBy: {
          createdAt: "desc",
        },
      }),
      prisma.vehicle.count({
        where: query,
      }),
    ]);

  // Convert Decimal to number for serialization
  const serializedVehicles = vehiclesData.map((vehicle) => ({
    ...vehicle,
    capacityWeight: vehicle.capacityWeight ? Number(vehicle.capacityWeight) : null,
    capacityVolume: vehicle.capacityVolume ? Number(vehicle.capacityVolume) : null,
  })) as Vehicle[];

  const availableVehicles = activeVehicles;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Vehicle Management</h1>
          <p className="text-gray-500 mt-1">Manage your fleet of vehicles</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total Vehicles"
          value={totalVehicles.toString()}
          icon={Truck}
        />
        <StatsCard
          title="Active Vehicles"
          value={activeVehicles.toString()}
          icon={CheckCircle}
        />
        <StatsCard
          title="In Maintenance"
          value={inMaintenanceVehicles.toString()}
          icon={Wrench}
        />
        <StatsCard
          title="Available Now"
          value={availableVehicles.toString()}
          icon={Truck}
        />
      </div>

      {/* Table */}
      <div className="bg-white p-4 rounded-md flex-1">
        {/* top */}
        <div className="flex justify-between items-center mb-4">
          <h1 className="hidden md:block text-lg font-semibold">All Vehicles</h1>
          <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto">
            <TableSearch placeholder="Search by plate number, brand, model, or type..." />
            <div className="flex items-center gap-4 self-end">
              <FormContainer table="vehicles" type="create" />
            </div>
          </div>
        </div>
        {/* list */}
        <VehiclesTable
          vehicles={serializedVehicles}
          columns={getColumns()}
        />
        {/* pagination */}
        <Pagination page={pageNumber} totalCount={count} />
      </div>
    </div>
  );
}
