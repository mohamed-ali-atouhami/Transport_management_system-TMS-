import { requireRole } from "@/lib/rbac";
import { StatsCard } from "@/components/dashboard/stats-card";
import { prisma } from "@/lib/prisma";
import { AlertCircle, AlertTriangle, CheckCircle, Clock } from "lucide-react";
import { ITEMS_PER_PAGE } from "@/lib/settings";
import { TableColumn } from "@/components/admin/tables/Table";
import TableSearch from "@/components/admin/tables/TableSearch";
import Pagination from "@/components/admin/tables/Pagination";
import { Prisma } from "@prisma/client";
import { IssuesTable } from "@/components/admin/tables/IssuesTable";

type Issue = {
  id: string;
  tripId: string;
  driverId: string;
  type: "VEHICLE_BREAKDOWN" | "ACCIDENT" | "DELAY" | "SHIPMENT_PROBLEM" | "OTHER";
  severity: "LOW" | "NORMAL" | "HIGH" | "URGENT";
  description: string;
  status: "OPEN" | "IN_PROGRESS" | "RESOLVED" | "CLOSED";
  resolution: string | null;
  resolvedAt: Date | null;
  createdAt: Date;
  trip: {
    id: string;
    departure: string;
    destination: string;
    status: string;
    dateStart: Date;
  };
  driver: {
    id: string;
    user: {
      id: string;
      name: string;
      email: string;
      image: string | null;
    };
  };
};

const getColumns = (): TableColumn[] => [
  {
    header: "Type",
    accessor: "type",
    filter: {
      type: "select",
      options: [
        { value: "", label: "All Types" },
        { value: "VEHICLE_BREAKDOWN", label: "Vehicle Breakdown" },
        { value: "ACCIDENT", label: "Accident" },
        { value: "DELAY", label: "Delay" },
        { value: "SHIPMENT_PROBLEM", label: "Shipment Problem" },
        { value: "OTHER", label: "Other" },
      ],
      paramKey: "type",
    },
  },
  {
    header: "Severity",
    accessor: "severity",
    filter: {
      type: "select",
      options: [
        { value: "", label: "All Severities" },
        { value: "LOW", label: "Low" },
        { value: "NORMAL", label: "Normal" },
        { value: "HIGH", label: "High" },
        { value: "URGENT", label: "Urgent" },
      ],
      paramKey: "severity",
    },
  },
  {
    header: "Status",
    accessor: "status",
    filter: {
      type: "select",
      options: [
        { value: "", label: "All Statuses" },
        { value: "OPEN", label: "Open" },
        { value: "IN_PROGRESS", label: "In Progress" },
        { value: "RESOLVED", label: "Resolved" },
        { value: "CLOSED", label: "Closed" },
      ],
      paramKey: "status",
    },
  },
  {
    header: "Description",
    accessor: "description",
  },
  {
    header: "Trip",
    accessor: "trip",
  },
  {
    header: "Driver",
    accessor: "driver",
  },
  {
    header: "Reported",
    accessor: "createdAt",
    sortable: true,
  },
  {
    header: "Actions",
    accessor: "actions",
  },
];

interface Props {
  searchParams: Promise<{
    page?: string;
    search?: string;
    status?: string;
    severity?: string;
    type?: string;
  }>;
}

export default async function IssuesPage({ searchParams }: Props) {
  await requireRole("admin");

  const params = await searchParams;
  const pageNumber = Number(params.page) || 1;
  const search = params.search || "";
  const statusFilter = params.status || "";
  const severityFilter = params.severity || "";
  const typeFilter = params.type || "";

  const skip = (pageNumber - 1) * ITEMS_PER_PAGE;

  // Build query
  const query: Prisma.IssueWhereInput = {};

  if (statusFilter) {
    query.status = statusFilter as any;
  }

  if (severityFilter) {
    query.severity = severityFilter as any;
  }

  if (typeFilter) {
    query.type = typeFilter as any;
  }

  if (search) {
    query.OR = [
      { description: { contains: search, mode: "insensitive" } },
      {
        trip: {
          OR: [
            { departure: { contains: search, mode: "insensitive" } },
            { destination: { contains: search, mode: "insensitive" } },
          ],
        },
      },
      {
        driver: {
          user: {
            OR: [
              { name: { contains: search, mode: "insensitive" } },
              { email: { contains: search, mode: "insensitive" } },
            ],
          },
        },
      },
    ];
  }

  // Fetch issues and counts
  const [issuesData, count, openCount, inProgressCount, resolvedCount, closedCount] = await Promise.all([
    prisma.issue.findMany({
      where: query,
      include: {
        trip: {
          select: {
            id: true,
            departure: true,
            destination: true,
            status: true,
            dateStart: true,
          },
        },
        driver: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                image: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      skip,
      take: ITEMS_PER_PAGE,
    }),
    prisma.issue.count({ where: query }),
    prisma.issue.count({ where: { ...query, status: "OPEN" } }),
    prisma.issue.count({ where: { ...query, status: "IN_PROGRESS" } }),
    prisma.issue.count({ where: { ...query, status: "RESOLVED" } }),
    prisma.issue.count({ where: { ...query, status: "CLOSED" } }),
  ]);

  const serializedIssues = issuesData as Issue[];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Issue Management</h1>
        <p className="text-gray-600 mt-1">View and manage reported issues from drivers</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatsCard
          title="Total Issues"
          value={count.toString()}
          icon={AlertCircle}
          description="All reported issues"
        />
        <StatsCard
          title="Open Issues"
          value={openCount.toString()}
          icon={AlertTriangle}
          description="Requires attention"
          className="border-red-200 bg-gradient-to-br from-red-50 to-white"
        />
        <StatsCard
          title="In Progress"
          value={inProgressCount.toString()}
          icon={Clock}
          description="Being handled"
          className="border-blue-200 bg-gradient-to-br from-blue-50 to-white"
        />
        <StatsCard
          title="Resolved"
          value={resolvedCount.toString()}
          icon={CheckCircle}
          description="Successfully resolved"
          className="border-green-200 bg-gradient-to-br from-green-50 to-white"
        />
      </div>

      {/* Table */}
      <div className="bg-white p-4 rounded-md flex-1">
        <div className="flex justify-between items-center mb-4">
          <h1 className="hidden md:block text-lg font-semibold">All Issues</h1>
          <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto">
            <TableSearch placeholder="Search by description, trip route, or driver..." />
          </div>
        </div>
        <IssuesTable issues={serializedIssues} columns={getColumns()} />
        <Pagination page={pageNumber} totalCount={count} />
      </div>
    </div>
  );
}

