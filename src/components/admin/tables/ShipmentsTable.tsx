"use client";

import { TableRow, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ShipmentActions } from "@/components/admin/tables/ShipmentActions";
import Table, { TableColumn } from "./Table";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Eye } from "lucide-react";

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

type ShipmentsTableProps = {
  shipments: Shipment[];
  clients: Array<{ id: string; companyName: string; user: { name: string; email: string } }>;
  trips: Array<{ id: string; departure: string; destination: string; dateStart: Date }>;
  columns: TableColumn[];
  isAdmin?: boolean; // Whether to show action buttons
};

const getStatusBadgeVariant = (status: string): "default" | "secondary" | "destructive" | "outline" => {
  switch (status) {
    case "PENDING":
      return "outline";
    case "ASSIGNED":
      return "default";
    case "IN_TRANSIT":
      return "default";
    case "DELIVERED":
      return "secondary";
    case "CANCELLED":
      return "destructive";
    default:
      return "default";
  }
};

const getPriorityBadgeVariant = (priority: string): "default" | "secondary" | "destructive" | "outline" => {
  switch (priority) {
    case "LOW":
      return "outline";
    case "NORMAL":
      return "secondary";
    case "HIGH":
      return "default";
    case "URGENT":
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

export function ShipmentsTable({ shipments, clients, trips, columns, isAdmin = true }: ShipmentsTableProps) {
  const renderRow = (shipment: Shipment) => {
    return (
      <TableRow key={shipment.id} className="hover:bg-gray-50">
        <TableCell>
          <Link href={`/list/shipments/${shipment.id}`} className="block hover:text-primary transition-colors">
            <div className="font-medium">{shipment.trackingNumber}</div>
          </Link>
        </TableCell>
        <TableCell className="hidden md:table-cell">
          <div>
            <div className="font-medium">{shipment.client.companyName}</div>
            <div className="text-xs text-muted-foreground">{shipment.client.user.name}</div>
          </div>
        </TableCell>
        <TableCell className="hidden md:table-cell">
          <div className="max-w-[200px] truncate">{shipment.description}</div>
        </TableCell>
        <TableCell>
          <Badge variant={getStatusBadgeVariant(shipment.status)}>{shipment.status}</Badge>
        </TableCell>
        <TableCell className="hidden lg:table-cell">
          <Badge variant={getPriorityBadgeVariant(shipment.priority)}>{shipment.priority}</Badge>
        </TableCell>
        <TableCell className="hidden lg:table-cell">${shipment.price.toFixed(2)}</TableCell>
        <TableCell className="hidden lg:table-cell">
          {shipment.trip ? (
            <div>
              <div className="text-xs">{shipment.trip.departure}</div>
              <div className="text-xs text-muted-foreground">→ {shipment.trip.destination}</div>
            </div>
          ) : (
            <span className="text-muted-foreground">-</span>
          )}
        </TableCell>
        {/* View/Actions column */}
        <TableCell>
          <div className="flex items-center gap-2">
            <Link href={`/list/shipments/${shipment.id}`}>
              <Button variant="ghost" size="sm">
                <Eye className="h-4 w-4" />
              </Button>
            </Link>
            {isAdmin && (
              <ShipmentActions shipment={shipment} clients={clients} trips={trips} />
            )}
          </div>
        </TableCell>
      </TableRow>
    );
  };

  return <Table columns={columns} renderRow={renderRow} data={shipments} />;
}

