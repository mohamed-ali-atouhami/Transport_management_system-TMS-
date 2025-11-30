import { requireRole } from "@/lib/rbac";
import { StatsCard } from "@/components/dashboard/stats-card";
import FormContainer from "@/components/admin/forms/FormContainer";
import { prisma } from "@/lib/prisma";
import { DollarSign, Fuel, Wrench, Receipt } from "lucide-react";
import { ITEMS_PER_PAGE } from "@/lib/settings";
import { ExpensesTable } from "@/components/admin/tables/ExpensesTable";
import { TableColumn } from "@/components/admin/tables/Table";
import TableSearch from "@/components/admin/tables/TableSearch";
import Pagination from "@/components/admin/tables/Pagination";
import { Prisma } from "@prisma/client";
import { Suspense } from "react";
import { getExpenses } from "@/lib/actions/expense-management";

type Expense = {
  id: string;
  tripId: string | null;
  vehicleId: string | null;
  type: "FUEL" | "TOLL" | "REPAIR" | "MAINTENANCE" | "OTHER";
  amount: number;
  date: Date;
  note: string | null;
  receiptUrl: string | null;
  createdAt: Date;
  trip: {
    id: string;
    departure: string;
    destination: string;
  } | null;
  vehicle: {
    id: string;
    plateNumber: string;
    brand: string;
    model: string;
  } | null;
  createdBy: {
    id: string;
    name: string;
    email: string;
  } | null;
};

const getColumns = (): TableColumn[] => [
  {
    header: "Type",
    accessor: "type",
    filter: {
      type: "select",
      paramKey: "type",
      defaultValue: "ALL",
      options: [
        { value: "ALL", label: "All Types" },
        { value: "FUEL", label: "Fuel" },
        { value: "TOLL", label: "Toll" },
        { value: "REPAIR", label: "Repair" },
        { value: "MAINTENANCE", label: "Maintenance" },
        { value: "OTHER", label: "Other" },
      ],
    },
  },
  {
    header: "Amount",
    accessor: "amount",
    className: "hidden md:table-cell",
    sortable: true,
  },
  {
    header: "Date",
    accessor: "date",
    className: "hidden md:table-cell",
    sortable: true,
  },
  {
    header: "Trip",
    accessor: "trip",
    className: "hidden lg:table-cell",
  },
  {
    header: "Vehicle",
    accessor: "vehicle",
    className: "hidden lg:table-cell",
  },
  {
    header: "Note",
    accessor: "note",
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

export default async function ExpensesPage({ searchParams }: Props) {
  await requireRole("admin");

  const params = await searchParams;
  const search = params.search || "";
  const page = parseInt(params.page || "1", 10);
  const sort = params.sort || "date";
  const order = (params.order || "desc") as "asc" | "desc";
  const type = params.type || "";

  const pageNumber = Math.max(1, page);
  const limit = ITEMS_PER_PAGE;

  // Fetch expenses
  const { expenses, count, totalPages } = await getExpenses({
    search,
    page: pageNumber,
    limit,
    sort,
    order,
    type: type && type !== "ALL" ? type : undefined,
  });

  // Calculate stats
  const [totalExpenses, fuelExpenses, repairExpenses, totalAmount] = await Promise.all([
    prisma.expense.count(),
    prisma.expense.count({ where: { type: "FUEL" } }),
    prisma.expense.count({ where: { type: { in: ["REPAIR", "MAINTENANCE"] } } }),
    prisma.expense.aggregate({
      _sum: {
        amount: true,
      },
    }),
  ]);

  const totalAmountValue = totalAmount._sum.amount ? Number(totalAmount._sum.amount) : 0;

  // Fetch trips and vehicles for the table
  const [trips, vehicles] = await Promise.all([
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

  const tripsData = trips.map((trip) => ({
    id: trip.id,
    departure: trip.departure,
    destination: trip.destination,
    dateStart: trip.dateStart,
  }));

  const vehiclesData = vehicles.map((vehicle) => ({
    id: vehicle.id,
    plateNumber: vehicle.plateNumber,
    brand: vehicle.brand,
    model: vehicle.model,
    type: vehicle.type,
  }));

  // Serialize expenses
  const serializedExpenses = expenses.map((expense) => ({
    ...expense,
    amount: Number(expense.amount),
    date: expense.date,
    createdAt: expense.createdAt,
  })) as Expense[];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h1 className="text-3xl font-bold">Expense Management</h1>
          <p className="text-gray-500 mt-1">Track and manage expenses</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total Expenses"
          value={totalExpenses.toString()}
          icon={Receipt}
        />
        <StatsCard
          title="Fuel Expenses"
          value={fuelExpenses.toString()}
          icon={Fuel}
        />
        <StatsCard
          title="Repair/Maintenance"
          value={repairExpenses.toString()}
          icon={Wrench}
        />
        <StatsCard
          title="Total Amount"
          value={`$${totalAmountValue.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          icon={DollarSign}
        />
      </div>

      {/* Table */}
      <div className="bg-white p-4 rounded-md flex-1">
        {/* top */}
        <div className="flex justify-between items-center mb-4">
          <h1 className="hidden md:block text-lg font-semibold">All Expenses</h1>
          <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto">
            <TableSearch placeholder="Search by notes..." />
            <div className="flex items-center gap-4 self-end">
              <FormContainer table="expenses" type="create" />
            </div>
          </div>
        </div>
        {/* list */}
        <Suspense fallback={<div>Loading expenses...</div>}>
          <ExpensesTable
            expenses={serializedExpenses}
            trips={tripsData}
            vehicles={vehiclesData}
            columns={getColumns()}
          />
        </Suspense>
        {/* pagination */}
        <Pagination page={pageNumber} totalCount={count} />
      </div>
    </div>
  );
}

