"use client";

import { TableRow, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { TripActions } from "@/components/admin/tables/TripActions";
import Table, { TableColumn } from "./Table";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Eye } from "lucide-react";

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

type TripsTableProps = {
  trips: Trip[];
  drivers: Array<{ id: string; name: string; email: string; licenseNumber: string }>;
  vehicles: Array<{ id: string; label: string; plateNumber: string; brand: string; model: string; type: string }>;
  columns: TableColumn[];
  isAdmin?: boolean;
};

const getStatusBadgeVariant = (status: string): "default" | "secondary" | "destructive" | "outline" => {
  switch (status) {
    case "PLANNED":
      return "outline";
    case "ONGOING":
      return "default";
    case "COMPLETED":
      return "secondary";
    case "CANCELLED":
      return "destructive";
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
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
};

export function TripsTable({ trips, drivers, vehicles, columns, isAdmin = false }: TripsTableProps) {
  const renderRow = (trip: Trip) => {
    return (
      <TableRow key={trip.id} className="hover:bg-gray-50">
        <TableCell>
          <Link href={`/list/trips/${trip.id}`} className="block hover:text-primary transition-colors">
            <div>
              <div className="font-medium">{trip.departure}</div>
              <div className="text-xs text-muted-foreground">→ {trip.destination}</div>
            </div>
          </Link>
        </TableCell>
        <TableCell className="hidden md:table-cell">
          <div className="font-medium">{trip.driver.user.name}</div>
        </TableCell>
        <TableCell className="hidden md:table-cell">
          <div>
            <div className="font-medium">{trip.vehicle.plateNumber}</div>
            <div className="text-xs text-muted-foreground">
              {trip.vehicle.brand} {trip.vehicle.model}
            </div>
          </div>
        </TableCell>
        <TableCell className="hidden lg:table-cell">{formatDate(trip.dateStart)}</TableCell>
        <TableCell>
          <Badge variant={getStatusBadgeVariant(trip.status)}>{trip.status}</Badge>
        </TableCell>
        <TableCell className="hidden lg:table-cell">${trip.totalCost.toFixed(2)}</TableCell>
        {isAdmin && (
          <TableCell>
            <div className="flex items-center gap-2">
              <Link href={`/list/trips/${trip.id}`}>
                <Button variant="ghost" size="sm">
                  <Eye className="h-4 w-4" />
                </Button>
              </Link>
              <TripActions trip={trip} drivers={drivers} vehicles={vehicles} />
            </div>
          </TableCell>
        )}
        {!isAdmin && (
          <TableCell>
            <Link href={`/list/trips/${trip.id}`}>
              <Button variant="ghost" size="sm">
                <Eye className="h-4 w-4" />
                View
              </Button>
            </Link>
          </TableCell>
        )}
      </TableRow>
    );
  };

  return <Table columns={columns} renderRow={renderRow} data={trips} />;
}

