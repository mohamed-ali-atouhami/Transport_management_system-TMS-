"use client";

import { TableRow, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { UserActions } from "@/components/admin/tables/UserActions";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import Table, { TableColumn } from "./Table";

type User = {
  id: string;
  name: string;
  email: string;
  username?: string | null;
  role: "ADMIN" | "DRIVER" | "CLIENT";
  phone: string | null;
  image: string | null;
  isActive: boolean;
  createdAt: Date;
  driverProfile: any;
  clientProfile: any;
};

type UsersTableProps = {
  users: User[];
  columns: TableColumn[];
};

const getRoleBadgeVariant = (role: string): "default" | "secondary" | "destructive" | "outline" => {
  switch (role) {
    case "ADMIN":
      return "default";
    case "DRIVER":
      return "secondary";
    case "CLIENT":
      return "outline";
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

export function UsersTable({ users, columns }: UsersTableProps) {
  const renderRow = (user: User) => {
    return (
      <TableRow key={user.id}>
        <TableCell>
          <div className="flex items-center gap-3">
            <Avatar>
              {user.image && (
                <AvatarImage src={user.image} alt={user.name} />
              )}
              <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
            </Avatar>
            <div>
              <div className="font-medium">{user.name}</div>
              {user.phone && (
                <div className="text-xs text-muted-foreground">{user.phone}</div>
              )}
            </div>
          </div>
        </TableCell>
        <TableCell className="hidden md:table-cell">
          <div className="font-medium">{user.email}</div>
        </TableCell>
        <TableCell className="hidden lg:table-cell">
          <div className="font-medium">{user.username || "-"}</div>
        </TableCell>
        <TableCell>
          <Badge variant={getRoleBadgeVariant(user.role)}>{user.role}</Badge>
        </TableCell>
        <TableCell>
          <Badge variant={user.isActive ? "default" : "secondary"}>
            {user.isActive ? "Active" : "Inactive"}
          </Badge>
        </TableCell>
        <TableCell>
          <UserActions user={user} />
        </TableCell>
      </TableRow>
    );
  };

  return <Table columns={columns} renderRow={renderRow} data={users} />;
}

