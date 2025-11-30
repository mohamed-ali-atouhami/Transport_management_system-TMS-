"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Package, MapPin, ArrowRight, Clock } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";

type RecentShipment = {
  id: string;
  trackingNumber: string;
  status: "PENDING" | "ASSIGNED" | "IN_TRANSIT" | "DELIVERED" | "CANCELLED";
  description: string;
  pickupAddress: string;
  deliveryAddress: string;
  createdAt: Date;
  deliveryDate: Date | null;
};

interface RecentShipmentsCardProps {
  shipments: RecentShipment[];
}

export default function RecentShipmentsCard({ shipments }: RecentShipmentsCardProps) {
  if (shipments.length === 0) {
    return (
      <Card className="border-purple-200 bg-gradient-to-br from-purple-50 to-white">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5 text-purple-600" />
            Recent Shipments
          </CardTitle>
          <CardDescription>Your shipment history</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Package className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p className="text-sm">No shipments yet</p>
            <p className="text-xs mt-1">Request a shipment to get started</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PENDING":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "ASSIGNED":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "IN_TRANSIT":
        return "bg-orange-100 text-orange-800 border-orange-200";
      case "DELIVERED":
        return "bg-green-100 text-green-800 border-green-200";
      case "CANCELLED":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  return (
    <Card className="border-purple-200 bg-gradient-to-br from-purple-50 to-white">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5 text-purple-600" />
              Recent Shipments
            </CardTitle>
            <CardDescription>Your shipment history ({shipments.length})</CardDescription>
          </div>
          <Link href="/list/shipments">
            <Button variant="ghost" size="sm">
              View All
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {shipments.slice(0, 5).map((shipment) => (
            <Link
              key={shipment.id}
              href={`/list/shipments/${shipment.id}`}
              className="block p-4 rounded-lg border bg-white hover:border-purple-300 hover:shadow-md transition-all group"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="outline" className={getStatusColor(shipment.status)}>
                      {shipment.status.replace("_", " ")}
                    </Badge>
                    <span className="text-xs text-muted-foreground font-mono">
                      {shipment.trackingNumber}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(shipment.createdAt), "MMM dd, yyyy")}
                    </span>
                  </div>
                  <p className="text-sm font-medium text-gray-900 line-clamp-1 mb-1">
                    {shipment.description}
                  </p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <MapPin className="h-3 w-3" />
                    <span className="truncate">
                      {shipment.pickupAddress} → {shipment.deliveryAddress}
                    </span>
                  </div>
                  {shipment.deliveryDate && (
                    <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                      <Clock className="h-3 w-3" />
                      <span>Delivered: {format(new Date(shipment.deliveryDate), "MMM dd, yyyy")}</span>
                    </div>
                  )}
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-purple-600 transition-colors flex-shrink-0 mt-1" />
              </div>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

