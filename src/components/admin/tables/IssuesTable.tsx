"use client";

import { TableRow, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { IssueActions } from "@/components/admin/tables/IssueActions";
import Table, { TableColumn } from "./Table";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Eye, AlertCircle } from "lucide-react";
import { format } from "date-fns";

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

type IssuesTableProps = {
  issues: Issue[];
  columns: TableColumn[];
};

const getStatusBadgeVariant = (status: string): "default" | "secondary" | "destructive" | "outline" => {
  switch (status) {
    case "OPEN":
      return "destructive";
    case "IN_PROGRESS":
      return "default";
    case "RESOLVED":
      return "secondary";
    case "CLOSED":
      return "outline";
    default:
      return "default";
  }
};

const getSeverityBadgeVariant = (severity: string): "default" | "secondary" | "destructive" | "outline" => {
  switch (severity) {
    case "URGENT":
      return "destructive";
    case "HIGH":
      return "destructive";
    case "NORMAL":
      return "default";
    case "LOW":
      return "secondary";
    default:
      return "default";
  }
};

const getTypeLabel = (type: string): string => {
  const labels: Record<string, string> = {
    VEHICLE_BREAKDOWN: "Vehicle Breakdown",
    ACCIDENT: "Accident",
    DELAY: "Delay",
    SHIPMENT_PROBLEM: "Shipment Problem",
    OTHER: "Other",
  };
  return labels[type] || type;
};

export function IssuesTable({ issues, columns }: IssuesTableProps) {
  return (
    <Table
      columns={columns}
      data={issues}
      renderRow={(issue: Issue) => (
        <TableRow key={issue.id}>
          <TableCell className="font-medium">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-orange-500" />
              <span className="truncate max-w-[200px]">{getTypeLabel(issue.type)}</span>
            </div>
          </TableCell>
          <TableCell>
            <Badge variant={getSeverityBadgeVariant(issue.severity)}>{issue.severity}</Badge>
          </TableCell>
          <TableCell>
            <Badge variant={getStatusBadgeVariant(issue.status)}>{issue.status}</Badge>
          </TableCell>
          <TableCell>
            <div className="max-w-[300px]">
              <p className="truncate text-sm">{issue.description}</p>
            </div>
          </TableCell>
          <TableCell>
            <Link href={`/list/trips/${issue.tripId}`} className="hover:underline">
              <div className="text-sm">
                <div className="font-medium">{issue.trip.departure}</div>
                <div className="text-muted-foreground">→ {issue.trip.destination}</div>
              </div>
            </Link>
          </TableCell>
          <TableCell>
            <div className="text-sm">
              <div className="font-medium">{issue.driver.user.name}</div>
              <div className="text-muted-foreground text-xs">{issue.driver.user.email}</div>
            </div>
          </TableCell>
          <TableCell className="text-sm text-muted-foreground">
            {format(new Date(issue.createdAt), "MMM dd, yyyy HH:mm")}
          </TableCell>
          <TableCell>
            <div className="flex items-center gap-2">
              <Link href={`/list/trips/${issue.tripId}`}>
                <Button variant="ghost" size="sm">
                  <Eye className="h-4 w-4" />
                </Button>
              </Link>
              <IssueActions issue={issue} />
            </div>
          </TableCell>
        </TableRow>
      )}
    />
  );
}

