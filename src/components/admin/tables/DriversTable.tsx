"use client";

import { TableRow, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { DriverActions, Driver } from "@/components/admin/tables/DriverActions";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import Table, { TableColumn } from "./Table";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Eye } from "lucide-react";

type DriversTableProps = {
  drivers: Driver[];
  columns: TableColumn[];
};

const getStatusBadgeVariant = (status: string): "default" | "secondary" | "destructive" | "outline" => {
  switch (status) {
    case "ACTIVE":
      return "default";
    case "INACTIVE":
      return "secondary";
    case "SUSPENDED":
      return "destructive";
    default:
      return "default";
  }
};

const getInitials = (name: string) => {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
};

export function DriversTable({ drivers, columns }: DriversTableProps) {
  const renderRow = (driver: Driver) => {
    return (
      <TableRow key={driver.id} className="hover:bg-gray-50">
        <TableCell>
          <Link href={`/list/drivers/${driver.id}`} className="block hover:text-primary transition-colors">
            <div className="flex items-center gap-3">
              <Avatar>
                {driver.user.image && (
                  <AvatarImage src={driver.user.image} alt={driver.user.name} />
                )}
                <AvatarFallback>{getInitials(driver.user.name)}</AvatarFallback>
              </Avatar>
              <div>
                <div className="font-medium">{driver.user.name}</div>
                {driver.user.phone && (
                  <div className="text-xs text-muted-foreground">{driver.user.phone}</div>
                )}
              </div>
            </div>
          </Link>
        </TableCell>
        <TableCell className="hidden md:table-cell">
          <div className="font-medium">{driver.user.email || "-"}</div>
        </TableCell>
        <TableCell>
          <div className="font-medium">{driver.licenseNumber}</div>
        </TableCell>
        <TableCell>
          <div className="font-medium">{driver.experienceYears} years</div>
        </TableCell>
        <TableCell>
          <Badge variant={getStatusBadgeVariant(driver.status)}>
            {driver.status}
          </Badge>
        </TableCell>
        <TableCell>
          <div className="flex items-center gap-2">
            <Link href={`/list/drivers/${driver.id}`}>
              <Button variant="ghost" size="sm">
                <Eye className="h-4 w-4" />
              </Button>
            </Link>
            <DriverActions driver={driver} />
          </div>
        </TableCell>
      </TableRow>
    );
  };

  return <Table columns={columns} renderRow={renderRow} data={drivers} />;
}

