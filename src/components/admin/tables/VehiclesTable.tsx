"use client";

import { TableRow, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { VehicleActions } from "@/components/admin/tables/VehicleActions";
import Table, { TableColumn } from "./Table";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Eye, Truck } from "lucide-react";

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

type VehiclesTableProps = {
  vehicles: Vehicle[];
  columns: TableColumn[];
};

const getStatusBadgeVariant = (status: string): "default" | "secondary" | "destructive" | "outline" => {
  switch (status) {
    case "ACTIVE":
      return "default";
    case "IN_MAINTENANCE":
      return "secondary";
    case "INACTIVE":
      return "destructive";
    default:
      return "default";
  }
};

export function VehiclesTable({ vehicles, columns }: VehiclesTableProps) {
  const renderRow = (vehicle: Vehicle) => {
    return (
      <TableRow key={vehicle.id} className="hover:bg-gray-50">
        <TableCell>
          <Link href={`/list/vehicles/${vehicle.id}`} className="block hover:text-primary transition-colors">
            <div className="flex items-center gap-3">
              {vehicle.image ? (
                <div className="w-10 h-10 rounded-md overflow-hidden border border-input flex-shrink-0">
                  <img
                    src={vehicle.image}
                    alt={`${vehicle.brand} ${vehicle.model}`}
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <div className="w-10 h-10 rounded-md bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center flex-shrink-0">
                  <Truck className="w-5 h-5 text-white" />
                </div>
              )}
              <div>
                <div className="font-medium">{vehicle.plateNumber}</div>
                <div className="text-xs text-muted-foreground">{vehicle.brand} {vehicle.model}</div>
              </div>
            </div>
          </Link>
        </TableCell>
        <TableCell className="hidden md:table-cell">
          <div className="font-medium">{vehicle.type}</div>
        </TableCell>
        <TableCell className="hidden md:table-cell">
          <div>
            <div className="font-medium">{vehicle.brand} {vehicle.model}</div>
          </div>
        </TableCell>
        <TableCell>
          <Badge variant={getStatusBadgeVariant(vehicle.status)}>{vehicle.status}</Badge>
        </TableCell>
        <TableCell className="hidden lg:table-cell">{vehicle.mileage.toLocaleString("en-US")} km</TableCell>
        <TableCell>
          <div className="flex items-center gap-2">
            <Link href={`/list/vehicles/${vehicle.id}`}>
              <Button variant="ghost" size="sm">
                <Eye className="h-4 w-4" />
              </Button>
            </Link>
            <VehicleActions vehicle={vehicle} />
          </div>
        </TableCell>
      </TableRow>
    );
  };

  return <Table columns={columns} renderRow={renderRow} data={vehicles} />;
}

