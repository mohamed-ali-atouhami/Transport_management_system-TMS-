import { requireRole } from "@/lib/rbac";
import { StatsCard } from "@/components/dashboard/stats-card";
import { prisma } from "@/lib/prisma";
import { Building2, Users } from "lucide-react";
import { ITEMS_PER_PAGE } from "@/lib/settings";
import { ClientsTable } from "@/components/admin/tables/ClientsTable";
import { TableColumn } from "@/components/admin/tables/Table";
import TableSearch from "@/components/admin/tables/TableSearch";
import Pagination from "@/components/admin/tables/Pagination";
import { Prisma } from "@prisma/client";

type Client = {
  id: string;
  userId: string;
  companyName: string;
  address: string;
  vatNumber: string | null;
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
    header: "Client",
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
    header: "Company Name",
    accessor: "companyName",
    sortable: true,
  },
  {
    header: "Address",
    accessor: "address",
    className: "hidden lg:table-cell",
  },
  {
    header: "VAT Number",
    accessor: "vatNumber",
    className: "hidden md:table-cell",
  },
  {
    header: "Actions",
    accessor: "actions",
  },
];

interface Props {
  searchParams: Promise<{ [key: string]: string | undefined }>;
}

export default async function ClientsPage({ searchParams }: Props) {
  await requireRole("admin");

  const resolvedParams = await searchParams;
  const { page, search, sort, order, ...queryparams } = resolvedParams;
  const pageNumber = page ? Number(page) : 1;

  // Build query conditions
  const query: Prisma.ClientProfileWhereInput = {
    // Only get clients where user role is CLIENT
    user: {
      role: "CLIENT",
    },
  };

  if (search) {
    query.OR = [
      { user: { name: { contains: search, mode: "insensitive" } } },
      { user: { email: { contains: search, mode: "insensitive" } } },
      { companyName: { contains: search, mode: "insensitive" } },
      { address: { contains: search, mode: "insensitive" } },
    ];
  }

  // Handle sorting
  const sortColumn = sort || "createdAt";
  const sortOrder = order || "desc";
  let orderBy: any = { createdAt: "desc" };

  if (sortColumn === "name") {
    orderBy = { user: { name: sortOrder } };
  } else if (sortColumn === "email") {
    orderBy = { user: { email: sortOrder } };
  } else if (sortColumn === "companyName") {
    orderBy = { companyName: sortOrder };
  } else if (sortColumn === "createdAt") {
    orderBy = { createdAt: sortOrder };
  }

  // Fetch stats and clients
  const [clientsData, count] = await Promise.all([
    prisma.clientProfile.findMany({
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
    prisma.clientProfile.count({
      where: query,
    }),
  ]);

  const serializedClients = clientsData.map((client) => ({
    id: client.id,
    userId: client.userId,
    companyName: client.companyName,
    address: client.address,
    vatNumber: client.vatNumber,
    createdAt: client.createdAt,
    user: client.user,
  })) as Client[];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Client Management</h1>
        <p className="text-gray-600 mt-1">Manage client profiles and company information</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <StatsCard
          title="Total Clients"
          value={count.toString()}
          icon={Users}
          description="All registered clients"
        />
        <StatsCard
          title="Companies"
          value={count.toString()}
          icon={Building2}
          description="Active companies"
        />
      </div>

      {/* Table */}
      <div className="bg-white p-4 rounded-md flex-1">
        <div className="flex justify-between items-center mb-4">
          <h1 className="hidden md:block text-lg font-semibold">All Clients</h1>
          <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto">
            <TableSearch placeholder="Search by name, email, company, or address..." />
          </div>
        </div>
        <ClientsTable clients={serializedClients} columns={getColumns()} />
        <Pagination page={pageNumber} totalCount={count} />
      </div>
    </div>
  );
}

