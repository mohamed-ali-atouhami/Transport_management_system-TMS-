import { requireRole } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Truck,
  Calendar,
  Gauge,
  Package,
  Wrench,
  DollarSign,
  Route,
  CheckCircle,
  Clock,
  XCircle,
  ExternalLink,
  MoreVertical,
  Weight,
  Box,
} from "lucide-react";
import { format } from "date-fns";
import FormModal from "@/components/admin/forms/FormModal";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

interface Props {
  params: Promise<{ id: string }>;
}

function getStatusColor(status: string) {
  switch (status) {
    case "ACTIVE":
      return "bg-green-100 text-green-800 border-green-200";
    case "IN_MAINTENANCE":
      return "bg-yellow-100 text-yellow-800 border-yellow-200";
    case "INACTIVE":
      return "bg-gray-100 text-gray-800 border-gray-200";
    default:
      return "bg-gray-100 text-gray-800 border-gray-200";
  }
}

function getTripStatusColor(status: string) {
  switch (status) {
    case "PLANNED":
      return "bg-blue-100 text-blue-800 border-blue-200";
    case "ONGOING":
      return "bg-yellow-100 text-yellow-800 border-yellow-200";
    case "COMPLETED":
      return "bg-green-100 text-green-800 border-green-200";
    case "CANCELLED":
      return "bg-red-100 text-red-800 border-red-200";
    default:
      return "bg-gray-100 text-gray-800 border-gray-200";
  }
}

function getMaintenanceTypeColor(type: string) {
  switch (type) {
    case "SERVICE":
      return "bg-blue-100 text-blue-800 border-blue-200";
    case "REPAIR":
      return "bg-red-100 text-red-800 border-red-200";
    case "INSPECTION":
      return "bg-green-100 text-green-800 border-green-200";
    default:
      return "bg-gray-100 text-gray-800 border-gray-200";
  }
}

function formatCurrency(amount: number | string) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(Number(amount));
}

export default async function VehicleDetailPage({ params }: Props) {
  await requireRole("admin");

  const { userId } = await auth();
  if (!userId) {
    redirect("/onboarding");
  }

  const { id } = await params;

  // Fetch vehicle with all related data
  const vehicle = await prisma.vehicle.findUnique({
    where: { id },
    include: {
      trips: {
        include: {
          driver: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
            },
          },
          _count: {
            select: {
              shipments: true,
            },
          },
        },
        orderBy: {
          dateStart: "desc",
        },
      },
      maintenances: {
        orderBy: {
          date: "desc",
        },
      },
      _count: {
        select: {
          trips: true,
          maintenances: true,
        },
      },
    },
  });

  if (!vehicle) {
    notFound();
  }

  // Calculate statistics
  const totalTrips = vehicle.trips.length;
  const activeTrips = vehicle.trips.filter(
    (trip) => trip.status === "PLANNED" || trip.status === "ONGOING"
  ).length;
  const completedTrips = vehicle.trips.filter(
    (trip) => trip.status === "COMPLETED"
  ).length;
  const cancelledTrips = vehicle.trips.filter(
    (trip) => trip.status === "CANCELLED"
  ).length;
  const totalMaintenanceCost = vehicle.maintenances.reduce(
    (sum, maintenance) => sum + Number(maintenance.cost),
    0
  );

  // Prepare vehicle data for forms
  const vehicleData = {
    id: vehicle.id,
    plateNumber: vehicle.plateNumber,
    type: vehicle.type,
    brand: vehicle.brand,
    model: vehicle.model,
    status: vehicle.status,
    image: vehicle.image,
    mileage: vehicle.mileage,
    purchaseDate: vehicle.purchaseDate,
    lastServiceDate: vehicle.lastServiceDate,
    capacityWeight: vehicle.capacityWeight ? Number(vehicle.capacityWeight) : null,
    capacityVolume: vehicle.capacityVolume ? Number(vehicle.capacityVolume) : null,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/list/vehicles">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Vehicles
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">Vehicle Details</h1>
            <p className="text-gray-500 mt-1">Vehicle ID: {vehicle.id.slice(0, 8)}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <FormModal
            table="vehicles"
            type="edit"
            data={vehicleData}
            id={vehicle.id}
          />
          <FormModal table="vehicles" type="delete" id={vehicle.id} />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link href={`/list/trips?vehicleId=${vehicle.id}`}>
                  <Route className="mr-2 h-4 w-4" />
                  View All Trips
                </Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="flex-1 p-4 flex flex-col gap-4 xl:flex-row">
        {/* Left Side - Main Content (2/3 width) */}
        <div className="w-full xl:w-2/3">
          {/* Top Section */}
          <div className="flex flex-col gap-4 lg:flex-row">
            {/* Left - Vehicle Profile Card */}
            <Card className="flex-1 lg:w-2/3">
              <CardContent className="p-6">
                {/* First Row: Image/Icon and Name */}
                <div className="flex items-center gap-4 mb-6 pb-6 border-b">
                  <div className="relative">
                    {vehicle.image ? (
                      <div className="w-32 h-32 border-4 border-blue-100 shadow-md rounded-lg overflow-hidden">
                        <img
                          src={vehicle.image}
                          alt={`${vehicle.brand} ${vehicle.model}`}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className="w-32 h-32 border-4 border-blue-100 shadow-md rounded-lg bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center">
                        <Truck className="w-16 h-16 text-white" />
                      </div>
                    )}
                    <div className="absolute -bottom-1 -right-1">
                      <Badge className={getStatusColor(vehicle.status)}>
                        {vehicle.status.replace("_", " ")}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex-1">
                    <h1 className="text-2xl font-bold text-gray-900">
                      {vehicle.brand} {vehicle.model}
                    </h1>
                    <p className="text-sm text-gray-500 mt-1">{vehicle.type}</p>
                    <p className="text-lg font-semibold text-gray-700 mt-2">{vehicle.plateNumber}</p>
                  </div>
                </div>

                {/* Second Row: Other Details */}
                <div className="space-y-1">
                  <div className="flex items-center gap-3 py-1">
                    <Gauge className="w-4 h-4 text-blue-600 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <span className="text-xs text-gray-500">Mileage: </span>
                      <span className="text-xs font-medium text-gray-900 pl-2">{vehicle.mileage.toLocaleString()} km</span>
                    </div>
                  </div>

                  {vehicle.purchaseDate && (
                    <div className="flex items-center gap-3 py-1">
                      <Calendar className="w-4 h-4 text-green-600 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <span className="text-xs text-gray-500">Purchase Date: </span>
                        <span className="text-xs font-medium text-gray-900 pl-2">{format(new Date(vehicle.purchaseDate), "MMM d, yyyy")}</span>
                      </div>
                    </div>
                  )}

                  {vehicle.lastServiceDate && (
                    <div className="flex items-center gap-3 py-1">
                      <Wrench className="w-4 h-4 text-orange-600 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <span className="text-xs text-gray-500">Last Service: </span>
                        <span className="text-xs font-medium text-gray-900 pl-2">{format(new Date(vehicle.lastServiceDate), "MMM d, yyyy")}</span>
                      </div>
                    </div>
                  )}

                  {vehicle.capacityWeight && (
                    <div className="flex items-center gap-3 py-1">
                      <Weight className="w-4 h-4 text-purple-600 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <span className="text-xs text-gray-500">Weight Capacity: </span>
                        <span className="text-xs font-medium text-gray-900 pl-2">{Number(vehicle.capacityWeight).toLocaleString()} kg</span>
                      </div>
                    </div>
                  )}

                  {vehicle.capacityVolume && (
                    <div className="flex items-center gap-3 py-1">
                      <Box className="w-4 h-4 text-indigo-600 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <span className="text-xs text-gray-500">Volume Capacity: </span>
                        <span className="text-xs font-medium text-gray-900 pl-2">{Number(vehicle.capacityVolume).toLocaleString()} m³</span>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Right - Stat Cards */}
            <div className="flex-1 flex gap-4 justify-between flex-wrap">
              {/* Total Trips Card */}
              <div className="bg-white rounded-md p-4 flex gap-4 w-full md:w-[48%] lg:w-[45%] xl:w-[47%]">
                <div className="flex items-center gap-2">
                  <Route className="w-6 h-6 text-blue-500" />
                  <div>
                    <h1 className="text-xl font-semibold">{totalTrips}</h1>
                    <span className="text-sm text-gray-400">Total Trips</span>
                  </div>
                </div>
              </div>

              {/* Active Trips Card */}
              <div className="bg-white rounded-md p-4 flex gap-4 w-full md:w-[48%] lg:w-[45%] xl:w-[47%]">
                <div className="flex items-center gap-2">
                  <Clock className="w-6 h-6 text-yellow-500" />
                  <div>
                    <h1 className="text-xl font-semibold">{activeTrips}</h1>
                    <span className="text-sm text-gray-400">Active Trips</span>
                  </div>
                </div>
              </div>

              {/* Completed Trips Card */}
              <div className="bg-white rounded-md p-4 flex gap-4 w-full md:w-[48%] lg:w-[45%] xl:w-[47%]">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-6 h-6 text-green-500" />
                  <div>
                    <h1 className="text-xl font-semibold">{completedTrips}</h1>
                    <span className="text-sm text-gray-400">Completed</span>
                  </div>
                </div>
              </div>

              {/* Maintenance Cost Card */}
              <div className="bg-white rounded-md p-4 flex gap-4 w-full md:w-[48%] lg:w-[45%] xl:w-[47%]">
                <div className="flex items-center gap-2">
                  <DollarSign className="w-6 h-6 text-green-500" />
                  <div>
                    <h1 className="text-xl font-semibold">{formatCurrency(totalMaintenanceCost)}</h1>
                    <span className="text-sm text-gray-400">Maintenance Cost</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Trips List */}
          <div className="mt-4 bg-white rounded-md p-4">
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-lg font-semibold">Vehicle&apos;s Trips</h1>
              <Link href={`/list/trips?vehicleId=${vehicle.id}`}>
                <Button variant="outline" size="sm">
                  View All Trips
                  <ExternalLink className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
            {vehicle.trips.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No trips assigned to this vehicle</p>
            ) : (
              <div className="space-y-3">
                {vehicle.trips.slice(0, 10).map((trip) => (
                  <div
                    key={trip.id}
                    className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Route className="h-4 w-4 text-gray-400" />
                          <span className="font-semibold">
                            {trip.departure} → {trip.destination}
                          </span>
                          <Badge
                            variant="outline"
                            className={`text-xs ${getTripStatusColor(trip.status)}`}
                          >
                            {trip.status}
                          </Badge>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600">
                          <div>
                            <span className="font-medium">Driver:</span> {trip.driver.user.name}
                          </div>
                          <div>
                            <span className="font-medium">Start:</span>{" "}
                            {format(new Date(trip.dateStart), "MMM d, yyyy")}
                          </div>
                          {trip.dateEnd && (
                            <div>
                              <span className="font-medium">End:</span>{" "}
                              {format(new Date(trip.dateEnd), "MMM d, yyyy")}
                            </div>
                          )}
                          <div>
                            <span className="font-medium">Shipments:</span> {trip._count.shipments}
                          </div>
                        </div>
                      </div>
                      <Link href={`/list/trips/${trip.id}`}>
                        <Button variant="ghost" size="sm">
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                ))}
                {vehicle.trips.length > 10 && (
                  <div className="text-center pt-2">
                    <Link href={`/list/trips?vehicleId=${vehicle.id}`}>
                      <Button variant="outline" size="sm">
                        View All {vehicle.trips.length} Trips
                      </Button>
                    </Link>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Maintenance History */}
          <div className="mt-4 bg-white rounded-md p-4">
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-lg font-semibold">Maintenance History</h1>
              <Badge variant="outline">{vehicle._count.maintenances} records</Badge>
            </div>
            {vehicle.maintenances.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No maintenance records for this vehicle</p>
            ) : (
              <div className="space-y-3">
                {vehicle.maintenances.slice(0, 10).map((maintenance) => (
                  <div
                    key={maintenance.id}
                    className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Wrench className="h-4 w-4 text-gray-400" />
                          <span className="font-semibold">{maintenance.type}</span>
                          <Badge
                            variant="outline"
                            className={`text-xs ${getMaintenanceTypeColor(maintenance.type)}`}
                          >
                            {maintenance.type}
                          </Badge>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm text-gray-600">
                          <div>
                            <span className="font-medium">Date:</span>{" "}
                            {format(new Date(maintenance.date), "MMM d, yyyy")}
                          </div>
                          <div>
                            <span className="font-medium">Cost:</span> {formatCurrency(maintenance.cost)}
                          </div>
                          {maintenance.description && (
                            <div className="md:col-span-3">
                              <span className="font-medium">Description:</span> {maintenance.description}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                {vehicle.maintenances.length > 10 && (
                  <div className="text-center pt-2">
                    <p className="text-sm text-gray-500">
                      Showing 10 of {vehicle.maintenances.length} maintenance records
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right Side - Sidebar (1/3 width) */}
        <div className="w-full xl:w-1/3 flex flex-col gap-4">
          {/* Shortcuts */}
          <Card>
            <CardHeader>
              <CardTitle>Shortcuts</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2 flex-wrap text-xs">
                <Link
                  className="p-3 rounded-md bg-blue-50 hover:bg-blue-100 transition-colors"
                  href={`/list/trips?vehicleId=${vehicle.id}`}
                >
                  <Route className="w-4 h-4 inline mr-1" />
                  All Trips
                </Link>
                <Link
                  className="p-3 rounded-md bg-yellow-50 hover:bg-yellow-100 transition-colors"
                  href={`/list/trips?vehicleId=${vehicle.id}&status=ONGOING`}
                >
                  <Clock className="w-4 h-4 inline mr-1" />
                  Active Trips
                </Link>
                <Link
                  className="p-3 rounded-md bg-green-50 hover:bg-green-100 transition-colors"
                  href={`/list/trips?vehicleId=${vehicle.id}&status=COMPLETED`}
                >
                  <CheckCircle className="w-4 h-4 inline mr-1" />
                  Completed Trips
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Stats</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-gray-600 mb-1">Status</p>
                <Badge className={getStatusColor(vehicle.status)}>
                  {vehicle.status.replace("_", " ")}
                </Badge>
              </div>
              <div className="border-t pt-4">
                <p className="text-sm text-gray-600 mb-1">Plate Number</p>
                <p className="font-medium">{vehicle.plateNumber}</p>
              </div>
              <div className="border-t pt-4">
                <p className="text-sm text-gray-600 mb-1">Mileage</p>
                <p className="font-medium">{vehicle.mileage.toLocaleString()} km</p>
              </div>
              <div className="border-t pt-4">
                <p className="text-sm text-gray-600 mb-1">Total Trips</p>
                <p className="font-medium">{totalTrips}</p>
              </div>
              <div className="border-t pt-4">
                <p className="text-sm text-gray-600 mb-1">Maintenance Records</p>
                <p className="font-medium">{vehicle._count.maintenances}</p>
              </div>
              <div className="border-t pt-4">
                <p className="text-sm text-gray-600 mb-1">Total Maintenance Cost</p>
                <p className="font-medium">{formatCurrency(totalMaintenanceCost)}</p>
              </div>
              <div className="border-t pt-4">
                <p className="text-sm text-gray-600 mb-1">Added to Fleet</p>
                <p className="font-medium">
                  {format(new Date(vehicle.createdAt), "MMM d, yyyy")}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

