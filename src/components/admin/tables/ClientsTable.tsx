"use client";

import { TableRow, TableCell } from "@/components/ui/table";
import { ClientActions, Client } from "@/components/admin/tables/ClientActions";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import Table, { TableColumn } from "./Table";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Eye } from "lucide-react";

type ClientsTableProps = {
  clients: Client[];
  columns: TableColumn[];
};

const getInitials = (name: string) => {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
};

export function ClientsTable({ clients, columns }: ClientsTableProps) {
  const renderRow = (client: Client) => {
    return (
      <TableRow key={client.id} className="hover:bg-gray-50">
        <TableCell>
          <Link href={`/list/clients/${client.id}`} className="block hover:text-primary transition-colors">
            <div className="flex items-center gap-3">
              <Avatar>
                {client.user.image && (
                  <AvatarImage src={client.user.image} alt={client.user.name} />
                )}
                <AvatarFallback>{getInitials(client.user.name)}</AvatarFallback>
              </Avatar>
              <div>
                <div className="font-medium">{client.user.name}</div>
                {client.user.phone && (
                  <div className="text-xs text-muted-foreground">{client.user.phone}</div>
                )}
              </div>
            </div>
          </Link>
        </TableCell>
        <TableCell className="hidden md:table-cell">
          <div className="font-medium">{client.user.email || "-"}</div>
        </TableCell>
        <TableCell>
          <div className="font-medium">{client.companyName}</div>
        </TableCell>
        <TableCell className="hidden lg:table-cell">
          <div className="text-sm text-muted-foreground line-clamp-2">
            {client.address}
          </div>
        </TableCell>
        <TableCell className="hidden md:table-cell">
          <div className="font-medium">{client.vatNumber || "-"}</div>
        </TableCell>
        <TableCell>
          <div className="flex items-center gap-2">
            <Link href={`/list/clients/${client.id}`}>
              <Button variant="ghost" size="sm">
                <Eye className="h-4 w-4" />
              </Button>
            </Link>
            <ClientActions client={client} />
          </div>
        </TableCell>
      </TableRow>
    );
  };

  return <Table columns={columns} renderRow={renderRow} data={clients} />;
}

