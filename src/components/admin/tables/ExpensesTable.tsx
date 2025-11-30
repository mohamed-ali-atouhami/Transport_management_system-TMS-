"use client";

import { TableRow, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ExpenseActions } from "@/components/admin/tables/ExpenseActions";
import Table, { TableColumn } from "./Table";

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

type ExpensesTableProps = {
  expenses: Expense[];
  trips: Array<{ id: string; departure: string; destination: string; dateStart: Date }>;
  vehicles: Array<{ id: string; plateNumber: string; brand: string; model: string; type: string }>;
  columns: TableColumn[];
};

const getTypeBadgeVariant = (type: string): "default" | "secondary" | "destructive" | "outline" => {
  switch (type) {
    case "FUEL":
      return "default";
    case "TOLL":
      return "secondary";
    case "REPAIR":
      return "destructive";
    case "MAINTENANCE":
      return "outline";
    case "OTHER":
      return "secondary";
    default:
      return "default";
  }
};

const formatDate = (date: Date | null) => {
  if (!date) return "-";
  return new Date(date).toLocaleString("en-US", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
};

export function ExpensesTable({ expenses, trips, vehicles, columns }: ExpensesTableProps) {
  const renderRow = (expense: Expense) => {
    return (
      <TableRow key={expense.id}>
        <TableCell>
          <Badge variant={getTypeBadgeVariant(expense.type)}>{expense.type}</Badge>
        </TableCell>
        <TableCell className="hidden md:table-cell">
          <div className="font-medium">${expense.amount.toFixed(2)}</div>
        </TableCell>
        <TableCell className="hidden md:table-cell">
          {formatDate(expense.date)}
        </TableCell>
        <TableCell className="hidden lg:table-cell">
          {expense.trip ? (
            <div>
              <div className="text-xs">{expense.trip.departure}</div>
              <div className="text-xs text-muted-foreground">→ {expense.trip.destination}</div>
            </div>
          ) : (
            <span className="text-muted-foreground">-</span>
          )}
        </TableCell>
        <TableCell className="hidden lg:table-cell">
          {expense.vehicle ? (
            <div>
              <div className="font-medium">{expense.vehicle.plateNumber}</div>
              <div className="text-xs text-muted-foreground">{expense.vehicle.brand} {expense.vehicle.model}</div>
            </div>
          ) : (
            <span className="text-muted-foreground">-</span>
          )}
        </TableCell>
        <TableCell className="hidden lg:table-cell">
          {expense.note ? (
            <div className="max-w-[200px] truncate">{expense.note}</div>
          ) : (
            <span className="text-muted-foreground">-</span>
          )}
        </TableCell>
        <TableCell>
          <ExpenseActions expense={expense} trips={trips} vehicles={vehicles} />
        </TableCell>
      </TableRow>
    );
  };

  return <Table columns={columns} renderRow={renderRow} data={expenses} />;
}

