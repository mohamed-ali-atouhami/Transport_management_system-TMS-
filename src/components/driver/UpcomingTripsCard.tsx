"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, MapPin, Package, ArrowRight, Clock } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import type { Trip } from "@prisma/client";

type UpcomingTrip = Trip & {
  vehicle: {
    plateNumber: string;
    brand: string;
    model: string;
  };
  _count: {
    shipments: number;
  };
};

interface UpcomingTripsCardProps {
  trips: UpcomingTrip[];
}

export default function UpcomingTripsCard({ trips }: UpcomingTripsCardProps) {
  if (trips.length === 0) {
    return (
      <Card className="border-blue-200 bg-gradient-to-br from-blue-50 to-white">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-blue-600" />
            Upcoming Trips
          </CardTitle>
          <CardDescription>Your scheduled trips</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Calendar className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p className="text-sm">No upcoming trips scheduled</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-blue-200 bg-gradient-to-br from-blue-50 to-white">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-blue-600" />
              Upcoming Trips
            </CardTitle>
            <CardDescription>Your scheduled trips ({trips.length})</CardDescription>
          </div>
          <Link href="/list/trips">
            <Button variant="ghost" size="sm">
              View All
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {trips.slice(0, 5).map((trip) => (
            <Link
              key={trip.id}
              href={`/list/trips/${trip.id}`}
              className="block p-4 rounded-lg border bg-white hover:border-blue-300 hover:shadow-md transition-all group"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                      {trip.status.replace("_", " ")}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(trip.dateStart), "MMM dd, yyyy")}
                    </span>
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2 text-sm">
                      <MapPin className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                      <span className="truncate">
                        {trip.departure} → {trip.destination}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Package className="h-3 w-3" />
                        <span>{trip._count.shipments} shipments</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="font-medium">{trip.vehicle.plateNumber}</span>
                        <span className="text-muted-foreground">
                          {trip.vehicle.brand} {trip.vehicle.model}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-blue-600 transition-colors flex-shrink-0 mt-1" />
              </div>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

