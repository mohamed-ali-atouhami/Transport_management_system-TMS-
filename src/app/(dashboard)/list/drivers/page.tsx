import { requireRole } from "@/lib/rbac";
import { StatsCard } from "@/components/dashboard/stats-card";
import { prisma } from "@/lib/prisma";
import { Users, UserCheck, UserX } from "lucide-react";
import { ITEMS_PER_PAGE } from "@/lib/settings";
import { DriversTable } from "@/components/admin/tables/DriversTable";
import { TableColumn } from "@/components/admin/tables/Table";
import TableSearch from "@/components/admin/tables/TableSearch";
import Pagination from "@/components/admin/tables/Pagination";
import { Prisma } from "@prisma/client";

type Driver = {
  id: string;
  userId: string;
  licenseNumber: string;
  experienceYears: number;
  status: "ACTIVE" | "INACTIVE" | "SUSPENDED";
  createdAt: Date;
  user: {
    id: string;
    name: string;
    email: string | null;
    phone: string | null;
    image: string | null;
  };
};

const getColumns = (): TableColumn[] => [
  {
    header: "Driver",
    accessor: "name",
    sortable: true,
  },
  {
    header: "Email",
    accessor: "email",
    className: "hidden md:table-cell",
    sortable: true,
  },
  {
    header: "License Number",
    accessor: "licenseNumber",
    sortable: true,
  },
  {
    header: "Experience",
    accessor: "experienceYears",
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
        { value: "ACTIVE", label: "Active" },
        { value: "INACTIVE", label: "Inactive" },
        { value: "SUSPENDED", label: "Suspended" },
      ],
    },
  },
  {
    header: "Actions",
    accessor: "actions",
  },
];

interface Props {
  searchParams: Promise<{ [key: string]: string | undefined }>;
}

export default async function DriversPage({ searchParams }: Props) {
  await requireRole("admin");

  const resolvedParams = await searchParams;
  const { page, search, status, sort, order, ...queryparams } = resolvedParams;
  const pageNumber = page ? Number(page) : 1;

  // Build query conditions
  const query: Prisma.DriverProfileWhereInput = {
    // Only get drivers where user role is DRIVER
    user: {
      role: "DRIVER",
    },
  };

  if (search) {
    query.OR = [
      { user: { name: { contains: search, mode: "insensitive" } } },
      { user: { email: { contains: search, mode: "insensitive" } } },
      { licenseNumber: { contains: search, mode: "insensitive" } },
    ];
  }

  if (status && status !== "ALL") {
    query.status = status as "ACTIVE" | "INACTIVE" | "SUSPENDED";
  }

  // Handle sorting
  const sortColumn = sort || "createdAt";
  const sortOrder = order || "desc";
  let orderBy: any = { createdAt: "desc" };

  if (sortColumn === "name") {
    orderBy = { user: { name: sortOrder } };
  } else if (sortColumn === "email") {
    orderBy = { user: { email: sortOrder } };
  } else if (sortColumn === "licenseNumber") {
    orderBy = { licenseNumber: sortOrder };
  } else if (sortColumn === "experienceYears") {
    orderBy = { experienceYears: sortOrder };
  } else if (sortColumn === "createdAt") {
    orderBy = { createdAt: sortOrder };
  }

  // Fetch stats and drivers
  const [driversData, count, stats] = await Promise.all([
    prisma.driverProfile.findMany({
      where: query,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            image: true,
          },
        },
      },
      take: ITEMS_PER_PAGE,
      skip: (pageNumber - 1) * ITEMS_PER_PAGE,
      orderBy,
    }),
    prisma.driverProfile.count({
      where: query,
    }),
    prisma.driverProfile.groupBy({
      by: ["status"],
      _count: true,
    }),
  ]);

  const totalDrivers = stats.reduce((acc, stat) => acc + stat._count, 0);
  const activeDrivers = stats.find((s) => s.status === "ACTIVE")?._count || 0;
  const inactiveDrivers = stats.find((s) => s.status === "INACTIVE")?._count || 0;
  const suspendedDrivers = stats.find((s) => s.status === "SUSPENDED")?._count || 0;

  const serializedDrivers = driversData.map((driver) => ({
    id: driver.id,
    userId: driver.userId,
    licenseNumber: driver.licenseNumber,
    experienceYears: driver.experienceYears,
    status: driver.status,
    createdAt: driver.createdAt,
    user: driver.user,
  })) as Driver[];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Driver Management</h1>
        <p className="text-gray-600 mt-1">Manage driver profiles and status</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatsCard
          title="Total Drivers"
          value={totalDrivers.toString()}
          icon={Users}
          description="All registered drivers"
        />
        <StatsCard
          title="Active Drivers"
          value={activeDrivers.toString()}
          icon={UserCheck}
          description="Currently active"
        />
        <StatsCard
          title="Inactive Drivers"
          value={inactiveDrivers.toString()}
          icon={UserX}
          description="Not available"
        />
        <StatsCard
          title="Suspended Drivers"
          value={suspendedDrivers.toString()}
          icon={UserX}
          description="Temporarily suspended"
        />
      </div>

      {/* Table */}
      <div className="bg-white p-4 rounded-md flex-1">
        <div className="flex justify-between items-center mb-4">
          <h1 className="hidden md:block text-lg font-semibold">All Drivers</h1>
          <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto">
            <TableSearch placeholder="Search by name, email, or license number..." />
          </div>
        </div>
        <DriversTable drivers={serializedDrivers} columns={getColumns()} />
        <Pagination page={pageNumber} totalCount={count} />
      </div>
    </div>
  );
}

