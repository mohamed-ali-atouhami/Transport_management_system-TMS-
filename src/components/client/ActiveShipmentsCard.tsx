"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin, Package, Truck, Clock, ArrowRight } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";

type ActiveShipment = {
  id: string;
  trackingNumber: string;
  status: "PENDING" | "ASSIGNED" | "IN_TRANSIT";
  description: string;
  pickupAddress: string;
  deliveryAddress: string;
  priority: "LOW" | "NORMAL" | "HIGH" | "URGENT";
  pickupDate: Date | null;
  deliveryDate: Date | null;
  trip: {
    id: string;
    departure: string;
    destination: string;
    status: string;
    vehicle: {
      plateNumber: string;
    };
    driver: {
      user: {
        name: string;
      };
    } | null;
  } | null;
};

interface ActiveShipmentsCardProps {
  shipments: ActiveShipment[];
}

export default function ActiveShipmentsCard({ shipments }: ActiveShipmentsCardProps) {
  if (shipments.length === 0) {
    return (
      <Card className="border-blue-200 bg-gradient-to-br from-blue-50 to-white">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5 text-blue-600" />
            Active Shipments
          </CardTitle>
          <CardDescription>Your shipments in progress</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Package className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p className="text-sm">No active shipments at the moment</p>
            <p className="text-xs mt-1">Request a new shipment to get started</p>
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
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "URGENT":
        return "bg-red-100 text-red-800 border-red-200";
      case "HIGH":
        return "bg-orange-100 text-orange-800 border-orange-200";
      case "NORMAL":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "LOW":
        return "bg-gray-100 text-gray-800 border-gray-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  return (
    <Card className="border-blue-200 bg-gradient-to-br from-blue-50 to-white shadow-lg">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5 text-blue-600" />
              Active Shipments
            </CardTitle>
            <CardDescription>Your shipments in progress ({shipments.length})</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {shipments.map((shipment) => (
          <Link
            key={shipment.id}
            href={`/list/shipments/${shipment.id}`}
            className="block p-4 rounded-lg border bg-white hover:border-blue-300 hover:shadow-md transition-all group"
          >
            <div className="space-y-3">
              {/* Header */}
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge className={getStatusColor(shipment.status)}>
                      {shipment.status.replace("_", " ")}
                    </Badge>
                    <Badge variant="outline" className={getPriorityColor(shipment.priority)}>
                      {shipment.priority}
                    </Badge>
                    <span className="text-xs text-muted-foreground font-mono">
                      {shipment.trackingNumber}
                    </span>
                  </div>
                  <p className="text-sm font-medium text-gray-900 line-clamp-2">
                    {shipment.description}
                  </p>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-blue-600 transition-colors flex-shrink-0" />
              </div>

              {/* Route */}
              <div className="space-y-2">
                <div className="flex items-start gap-2 text-sm">
                  <MapPin className="h-3.5 w-3.5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <span className="text-gray-900 font-medium">Pickup:</span>
                    <span className="text-gray-600 ml-1 truncate block">{shipment.pickupAddress}</span>
                  </div>
                </div>
                <div className="flex items-center justify-center py-1">
                  <div className="h-4 w-0.5 bg-blue-300"></div>
                </div>
                <div className="flex items-start gap-2 text-sm">
                  <MapPin className="h-3.5 w-3.5 text-green-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <span className="text-gray-900 font-medium">Delivery:</span>
                    <span className="text-gray-600 ml-1 truncate block">{shipment.deliveryAddress}</span>
                  </div>
                </div>
              </div>

              {/* Trip Info (if assigned) */}
              {shipment.trip && (
                <div className="pt-2 border-t border-gray-200 space-y-1.5">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Truck className="h-3 w-3" />
                    <span>
                      Assigned to trip: {shipment.trip.departure} → {shipment.trip.destination}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>Vehicle: {shipment.trip.vehicle.plateNumber}</span>
                    {shipment.trip.driver?.user && (
                      <span>• Driver: {shipment.trip.driver.user.name}</span>
                    )}
                  </div>
                </div>
              )}

              {/* Dates */}
              <div className="flex items-center gap-4 text-xs text-muted-foreground pt-2 border-t border-gray-200">
                {shipment.pickupDate && (
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    <span>Pickup: {format(new Date(shipment.pickupDate), "MMM dd, yyyy")}</span>
                  </div>
                )}
                {shipment.deliveryDate && (
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    <span>Delivery: {format(new Date(shipment.deliveryDate), "MMM dd, yyyy")}</span>
                  </div>
                )}
              </div>
            </div>
          </Link>
        ))}
      </CardContent>
    </Card>
  );
}

