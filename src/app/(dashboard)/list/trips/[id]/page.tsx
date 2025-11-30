import { requireAnyRole } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Edit,
  Trash2,
  MapPin,
  Calendar,
  Clock,
  Route,
  User,
  Truck,
  Package,
  DollarSign,
  FileText,
  MoreVertical,
  ExternalLink,
} from "lucide-react";
import { format } from "date-fns";
import FormModal from "@/components/admin/forms/FormModal";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import TripStatusActions from "@/components/driver/TripStatusActions";
import IssueReportForm from "@/components/driver/IssueReportForm";

interface Props {
  params: Promise<{ id: string }>;
}

function getStatusColor(status: string) {
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

function formatCurrency(amount: number | string) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(Number(amount));
}

function formatDuration(minutes: number | null) {
  if (!minutes) return "N/A";
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours > 0) {
    return `${hours}h ${mins}m`;
  }
  return `${mins}m`;
}

export default async function TripDetailPage({ params }: Props) {
  await requireAnyRole(["admin", "driver", "client"]);

  const { userId } = await auth();
  if (!userId) {
    redirect("/onboarding");
  }

  const { id } = await params;

  // Fetch trip with all related data
  const trip = await prisma.trip.findUnique({
    where: { id },
    include: {
      driver: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
            },
          },
        },
      },
      vehicle: {
        select: {
          id: true,
          plateNumber: true,
          brand: true,
          model: true,
          type: true,
          mileage: true,
          status: true,
        },
      },
      shipments: {
        include: {
          client: {
            include: {
              user: {
                select: {
                  name: true,
                },
              },
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      },
      expenses: {
        orderBy: {
          date: "desc",
        },
      },
      _count: {
        select: {
          shipments: true,
          expenses: true,
        },
      },
    },
  });

  if (!trip) {
    notFound();
  }

  // Check if user has access (driver can only see their own trips, client can see trips with their shipments)
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });

  if (user?.role === "DRIVER") {
    const driverProfile = await prisma.driverProfile.findUnique({
      where: { userId },
    });
    if (driverProfile?.id !== trip.driverId) {
      redirect("/driver");
    }
  } else if (user?.role === "CLIENT") {
    const clientProfile = await prisma.clientProfile.findUnique({
      where: { userId },
    });
    if (clientProfile && !trip.shipments.some((s) => s.clientId === clientProfile.id)) {
      redirect("/client");
    }
  }

  const isAdmin = user?.role === "ADMIN";
  const isDriver = user?.role === "DRIVER";
  const totalExpenses = trip.expenses.reduce((sum, exp) => sum + Number(exp.amount), 0);

  // Prepare related data for forms
  const drivers = isAdmin
    ? await prisma.driverProfile.findMany({
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      })
    : [];
  const vehicles = isAdmin
    ? await prisma.vehicle.findMany({
        select: {
          id: true,
          plateNumber: true,
          brand: true,
          model: true,
          type: true,
        },
      })
    : [];

  const driversData = drivers.map((d) => ({
    id: d.id,
    name: d.user.name,
    email: d.user.email || "",
    licenseNumber: d.licenseNumber,
  }));

  const vehiclesData = vehicles.map((v) => ({
    id: v.id,
    label: `${v.plateNumber} - ${v.brand} ${v.model} (${v.type})`,
    plateNumber: v.plateNumber,
    brand: v.brand,
    model: v.model,
    type: v.type,
  }));

  const tripData = {
    id: trip.id,
    driverId: trip.driverId,
    vehicleId: trip.vehicleId,
    departure: trip.departure,
    destination: trip.destination,
    dateStart: trip.dateStart,
    dateEnd: trip.dateEnd,
    estimatedDuration: trip.estimatedDuration,
    actualDuration: trip.actualDuration,
    distance: trip.distance ? Number(trip.distance) : null,
    totalCost: Number(trip.totalCost),
    notes: trip.notes,
    status: trip.status,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/list/trips">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Trips
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">Trip Details</h1>
            <p className="text-gray-500 mt-1">Trip ID: {trip.id.slice(0, 8)}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isAdmin && (
            <>
              <FormModal
                table="trips"
                type="edit"
                data={tripData}
                id={trip.id}
                relatedData={{
                  drivers: driversData,
                  vehicles: vehiclesData,
                }}
              />
              <FormModal table="trips" type="delete" id={trip.id} />
            </>
          )}
          {isDriver && (
            <TripStatusActions tripId={trip.id} currentStatus={trip.status} />
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link href={`/list/expenses?tripId=${trip.id}`}>
                  <DollarSign className="mr-2 h-4 w-4" />
                  View All Expenses
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href={`/list/shipments?tripId=${trip.id}`}>
                  <Package className="mr-2 h-4 w-4" />
                  View All Shipments
                </Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content - Left Side (2/3 width) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Route Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Route className="h-5 w-5" />
                Route Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <MapPin className="h-4 w-4 text-red-500" />
                    Departure
                  </div>
                  <p className="text-lg font-semibold">{trip.departure}</p>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <MapPin className="h-4 w-4 text-green-500" />
                    Destination
                  </div>
                  <p className="text-lg font-semibold">{trip.destination}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Schedule */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Schedule
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Start Date</p>
                  <p className="font-medium">
                    {format(new Date(trip.dateStart), "PPP p")}
                  </p>
                </div>
                {trip.dateEnd && (
                  <div>
                    <p className="text-sm text-gray-600 mb-1">End Date</p>
                    <p className="font-medium">
                      {format(new Date(trip.dateEnd), "PPP p")}
                    </p>
                  </div>
                )}
                {trip.estimatedDuration && (
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Estimated Duration</p>
                    <p className="font-medium">{formatDuration(trip.estimatedDuration)}</p>
                  </div>
                )}
                {trip.actualDuration && (
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Actual Duration</p>
                    <p className="font-medium">{formatDuration(trip.actualDuration)}</p>
                  </div>
                )}
                {trip.distance && (
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Distance</p>
                    <p className="font-medium">{Number(trip.distance).toLocaleString()} km</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Driver & Vehicle */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Driver
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <p className="font-semibold text-lg">{trip.driver.user.name}</p>
                    <p className="text-sm text-gray-600">{trip.driver.user.email}</p>
                    {trip.driver.user.phone && (
                      <p className="text-sm text-gray-600">{trip.driver.user.phone}</p>
                    )}
                  </div>
                  <Separator />
                  <div>
                    <p className="text-sm text-gray-600">License Number</p>
                    <p className="font-medium">{trip.driver.licenseNumber}</p>
                  </div>
                  {isAdmin && (
                    <Link href={`/list/drivers/${trip.driver.id}`}>
                      <Button variant="outline" size="sm" className="w-full">
                        View Driver Profile
                        <ExternalLink className="ml-2 h-4 w-4" />
                      </Button>
                    </Link>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Truck className="h-5 w-5" />
                  Vehicle
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <p className="font-semibold text-lg">
                      {trip.vehicle.brand} {trip.vehicle.model}
                    </p>
                    <p className="text-sm text-gray-600">{trip.vehicle.type}</p>
                  </div>
                  <Separator />
                  <div>
                    <p className="text-sm text-gray-600">Plate Number</p>
                    <p className="font-medium">{trip.vehicle.plateNumber}</p>
                  </div>
                  {trip.vehicle.mileage && (
                    <div>
                      <p className="text-sm text-gray-600">Mileage</p>
                      <p className="font-medium">
                        {Number(trip.vehicle.mileage).toLocaleString()} km
                      </p>
                    </div>
                  )}
                  {isAdmin && (
                    <Link href={`/list/vehicles/${trip.vehicle.id}`}>
                      <Button variant="outline" size="sm" className="w-full">
                        View Vehicle Details
                        <ExternalLink className="ml-2 h-4 w-4" />
                      </Button>
                    </Link>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Assigned Shipments */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Assigned Shipments ({trip.shipments.length})
                </CardTitle>
                {isAdmin && (
                  <Link href={`/list/shipments?tripId=${trip.id}`}>
                    <Button variant="outline" size="sm">
                      View All
                    </Button>
                  </Link>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {trip.shipments.length === 0 ? (
                <p className="text-gray-500 text-center py-4">No shipments assigned to this trip</p>
              ) : (
                <div className="space-y-3">
                  {trip.shipments.map((shipment) => (
                    <div
                      key={shipment.id}
                      className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Package className="h-4 w-4 text-gray-400" />
                            <span className="font-semibold">{shipment.trackingNumber}</span>
                            <Badge
                              variant="outline"
                              className={`text-xs ${getStatusColor(shipment.status)}`}
                            >
                              {shipment.status.replace("_", " ")}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600 mb-1">{shipment.description}</p>
                          <p className="text-xs text-gray-500">
                            Client: {shipment.client.user.name}
                          </p>
                          <p className="text-xs text-gray-500">
                            {shipment.pickupAddress} → {shipment.deliveryAddress}
                          </p>
                        </div>
                        <Link href={`/list/shipments/${shipment.id}`}>
                          <Button variant="ghost" size="sm">
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Expenses */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Expenses ({trip.expenses.length})
                </CardTitle>
                {isAdmin && (
                  <Link href={`/list/expenses?tripId=${trip.id}`}>
                    <Button variant="outline" size="sm">
                      View All
                    </Button>
                  </Link>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {trip.expenses.length === 0 ? (
                <p className="text-gray-500 text-center py-4">No expenses recorded for this trip</p>
              ) : (
                <div className="space-y-3">
                  {trip.expenses.map((expense) => (
                    <div
                      key={expense.id}
                      className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <DollarSign className="h-4 w-4 text-gray-400" />
                            <span className="font-semibold">{expense.type}</span>
                          </div>
                          <p className="text-lg font-bold">{formatCurrency(Number(expense.amount))}</p>
                          <p className="text-xs text-gray-500">
                            {format(new Date(expense.date), "PPP")}
                          </p>
                          {expense.note && (
                            <p className="text-sm text-gray-600 mt-1">{expense.note}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Notes */}
          {trip.notes && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Notes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 whitespace-pre-wrap">{trip.notes}</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar - Right Side (1/3 width) */}
        <div className="space-y-6">
          {/* Quick Stats */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Stats</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-gray-600 mb-1">Status</p>
                <Badge className={getStatusColor(trip.status)}>{trip.status}</Badge>
              </div>
              <Separator />
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Cost</p>
                <p className="text-2xl font-bold">{formatCurrency(Number(trip.totalCost))}</p>
              </div>
              <Separator />
              <div>
                <p className="text-sm text-gray-600 mb-1">Shipments</p>
                <p className="text-xl font-semibold">{trip._count.shipments} assigned</p>
              </div>
              <Separator />
              <div>
                <p className="text-sm text-gray-600 mb-1">Expenses</p>
                <p className="text-xl font-semibold">{formatCurrency(totalExpenses)}</p>
              </div>
              <Separator />
              <div>
                <p className="text-sm text-gray-600 mb-1">Created</p>
                <p className="text-sm font-medium">
                  {format(new Date(trip.createdAt), "PPP")}
                </p>
              </div>
              <Separator />
              <div>
                <p className="text-sm text-gray-600 mb-1">Last Updated</p>
                <p className="text-sm font-medium">
                  {format(new Date(trip.updatedAt), "PPP p")}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Quick Links */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Links</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {isAdmin && (
                <>
                  <Link href={`/list/drivers/${trip.driver.id}`}>
                    <Button variant="outline" className="w-full justify-start" size="sm">
                      <User className="mr-2 h-4 w-4" />
                      View Driver Profile
                    </Button>
                  </Link>
                  <Link href={`/list/vehicles/${trip.vehicle.id}`}>
                    <Button variant="outline" className="w-full justify-start" size="sm">
                      <Truck className="mr-2 h-4 w-4" />
                      View Vehicle Details
                    </Button>
                  </Link>
                </>
              )}
              <Link href={`/list/expenses?tripId=${trip.id}`}>
                <Button variant="outline" className="w-full justify-start" size="sm">
                  <DollarSign className="mr-2 h-4 w-4" />
                  All Trip Expenses
                </Button>
              </Link>
              <Link href={`/list/shipments?tripId=${trip.id}`}>
                <Button variant="outline" className="w-full justify-start" size="sm">
                  <Package className="mr-2 h-4 w-4" />
                  All Assigned Shipments
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Issue Reporting - For Drivers */}
          {isDriver && (
            <IssueReportForm
              trip={{
                id: trip.id,
                vehicle: {
                  plateNumber: trip.vehicle.plateNumber,
                },
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
}

