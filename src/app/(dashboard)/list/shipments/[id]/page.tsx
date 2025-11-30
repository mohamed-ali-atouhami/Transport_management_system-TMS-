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
  Package,
  MapPin,
  Calendar,
  DollarSign,
  Weight,
  Box,
  AlertCircle,
  User,
  Truck,
  Route,
  ExternalLink,
  MoreVertical,
  Clock,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { format } from "date-fns";
import FormModal from "@/components/admin/forms/FormModal";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";

interface Props {
  params: Promise<{ id: string }>;
}

function getStatusColor(status: string) {
  switch (status) {
    case "PENDING":
      return "bg-gray-100 text-gray-800 border-gray-200";
    case "ASSIGNED":
      return "bg-blue-100 text-blue-800 border-blue-200";
    case "IN_TRANSIT":
      return "bg-yellow-100 text-yellow-800 border-yellow-200";
    case "DELIVERED":
      return "bg-green-100 text-green-800 border-green-200";
    case "CANCELLED":
      return "bg-red-100 text-red-800 border-red-200";
    default:
      return "bg-gray-100 text-gray-800 border-gray-200";
  }
}

function getPriorityColor(priority: string) {
  switch (priority) {
    case "LOW":
      return "bg-gray-100 text-gray-800 border-gray-200";
    case "NORMAL":
      return "bg-blue-100 text-blue-800 border-blue-200";
    case "HIGH":
      return "bg-orange-100 text-orange-800 border-orange-200";
    case "URGENT":
      return "bg-red-100 text-red-800 border-red-200";
    default:
      return "bg-gray-100 text-gray-800 border-gray-200";
  }
}

function getStatusIcon(status: string) {
  switch (status) {
    case "PENDING":
      return Clock;
    case "ASSIGNED":
      return Package;
    case "IN_TRANSIT":
      return Truck;
    case "DELIVERED":
      return CheckCircle;
    case "CANCELLED":
      return XCircle;
    default:
      return Package;
  }
}

function formatCurrency(amount: number | string) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(Number(amount));
}

export default async function ShipmentDetailPage({ params }: Props) {
  await requireAnyRole(["admin", "driver", "client"]);

  const { userId } = await auth();
  if (!userId) {
    redirect("/onboarding");
  }

  const { id } = await params;

  // Fetch shipment with all related data
  const shipment = await prisma.shipment.findUnique({
    where: { id },
    include: {
      client: {
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
      trip: {
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
          vehicle: {
            select: {
              id: true,
              plateNumber: true,
              brand: true,
              model: true,
            },
          },
        },
      },
    },
  });

  if (!shipment) {
    notFound();
  }

  // Check if user has access
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });

  if (user?.role === "CLIENT") {
    const clientProfile = await prisma.clientProfile.findUnique({
      where: { userId },
    });
    if (clientProfile?.id !== shipment.clientId) {
      redirect("/client");
    }
  } else if (user?.role === "DRIVER") {
    const driverProfile = await prisma.driverProfile.findUnique({
      where: { userId },
    });
    if (driverProfile && (!shipment.trip || shipment.trip.driverId !== driverProfile.id)) {
      redirect("/driver");
    }
  }

  const isAdmin = user?.role === "ADMIN";

  // Prepare related data for forms
  const clients = isAdmin
    ? await prisma.clientProfile.findMany({
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
  const trips = isAdmin
    ? await prisma.trip.findMany({
        where: {
          status: { in: ["PLANNED", "ONGOING"] },
        },
        select: {
          id: true,
          departure: true,
          destination: true,
          dateStart: true,
        },
        orderBy: { dateStart: "desc" },
      })
    : [];

  const clientsData = clients.map((c) => ({
    id: c.id,
    companyName: c.companyName,
    user: {
      name: c.user.name,
      email: c.user.email || "",
    },
  }));

  const tripsData = trips.map((t) => ({
    id: t.id,
    departure: t.departure,
    destination: t.destination,
    dateStart: t.dateStart,
  }));

  const shipmentData = {
    id: shipment.id,
    tripId: shipment.tripId,
    clientId: shipment.clientId,
    trackingNumber: shipment.trackingNumber,
    description: shipment.description,
    weight: shipment.weight ? Number(shipment.weight) : null,
    volume: shipment.volume ? Number(shipment.volume) : null,
    price: Number(shipment.price),
    pickupAddress: shipment.pickupAddress,
    deliveryAddress: shipment.deliveryAddress,
    priority: shipment.priority,
    status: shipment.status,
    pickupDate: shipment.pickupDate,
    deliveryDate: shipment.deliveryDate,
  };

  // Status timeline
  const statusTimeline = [
    {
      status: "PENDING",
      label: "Pending",
      date: shipment.createdAt,
      completed: ["PENDING", "ASSIGNED", "IN_TRANSIT", "DELIVERED"].includes(shipment.status),
    },
    {
      status: "ASSIGNED",
      label: "Assigned to Trip",
      date: shipment.trip ? shipment.trip.dateStart : null,
      completed: ["ASSIGNED", "IN_TRANSIT", "DELIVERED"].includes(shipment.status),
    },
    {
      status: "IN_TRANSIT",
      label: "In Transit",
      date: shipment.pickupDate,
      completed: ["IN_TRANSIT", "DELIVERED"].includes(shipment.status),
    },
    {
      status: "DELIVERED",
      label: "Delivered",
      date: shipment.deliveryDate,
      completed: shipment.status === "DELIVERED",
    },
  ];

  const StatusIcon = getStatusIcon(shipment.status);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/list/shipments">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Shipments
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">Shipment Details</h1>
            <p className="text-gray-500 mt-1">Tracking Number: {shipment.trackingNumber}</p>
          </div>
        </div>
        {isAdmin && (
          <div className="flex items-center gap-2">
            <FormModal
              table="shipments"
              type="edit"
              data={shipmentData}
              id={shipment.id}
              relatedData={{
                clients: clientsData,
                trips: tripsData,
              }}
            />
            <FormModal table="shipments" type="delete" id={shipment.id} />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {shipment.trip && (
                  <DropdownMenuItem asChild>
                    <Link href={`/list/trips/${shipment.trip.id}`}>
                      <Route className="mr-2 h-4 w-4" />
                      View Trip Details
                    </Link>
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem asChild>
                  <Link href={`/list/clients/${shipment.client.id}`}>
                    <User className="mr-2 h-4 w-4" />
                    View Client Details
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content - Left Side (2/3 width) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Tracking Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Tracking Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Tracking Number</p>
                  <p className="text-lg font-semibold">{shipment.trackingNumber}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Description</p>
                  <p className="text-lg font-medium">{shipment.description}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Status</p>
                  <Badge className={getStatusColor(shipment.status)}>
                    <StatusIcon className="mr-1 h-3 w-3" />
                    {shipment.status.replace("_", " ")}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Priority</p>
                  <Badge className={getPriorityColor(shipment.priority)}>
                    {shipment.priority}
                  </Badge>
                </div>
                {shipment.weight && (
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Weight</p>
                    <p className="font-medium">{Number(shipment.weight).toLocaleString()} kg</p>
                  </div>
                )}
                {shipment.volume && (
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Volume</p>
                    <p className="font-medium">{Number(shipment.volume).toLocaleString()} m³</p>
                  </div>
                )}
                <div>
                  <p className="text-sm text-gray-600 mb-1">Price</p>
                  <p className="text-xl font-bold">{formatCurrency(Number(shipment.price))}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Addresses */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Addresses
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <MapPin className="h-4 w-4 text-red-500" />
                    Pickup Address
                  </div>
                  <p className="font-medium">{shipment.pickupAddress}</p>
                  {shipment.pickupDate && (
                    <p className="text-xs text-gray-500">
                      Picked up: {format(new Date(shipment.pickupDate), "PPP p")}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <MapPin className="h-4 w-4 text-green-500" />
                    Delivery Address
                  </div>
                  <p className="font-medium">{shipment.deliveryAddress}</p>
                  {shipment.deliveryDate && (
                    <p className="text-xs text-gray-500">
                      Delivered: {format(new Date(shipment.deliveryDate), "PPP p")}
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Status Timeline */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Status Timeline
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {statusTimeline.map((item, index) => {
                  const Icon = getStatusIcon(item.status);
                  const isLast = index === statusTimeline.length - 1;
                  return (
                    <div key={item.status} className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <div
                          className={`w-10 h-10 rounded-full flex items-center justify-center border-2 ${
                            item.completed
                              ? "bg-green-500 text-white border-green-500"
                              : "bg-gray-100 text-gray-400 border-gray-300"
                          }`}
                        >
                          <Icon className="h-5 w-5" />
                        </div>
                        {!isLast && (
                          <div
                            className={`w-0.5 h-12 mt-2 ${
                              item.completed ? "bg-green-500" : "bg-gray-200"
                            }`}
                          />
                        )}
                      </div>
                      <div className="flex-1 pb-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-semibold">{item.label}</p>
                            {item.date && (
                              <p className="text-sm text-gray-500">
                                {format(new Date(item.date), "PPP p")}
                              </p>
                            )}
                            {!item.date && item.status !== "PENDING" && (
                              <p className="text-sm text-gray-400">Not yet</p>
                            )}
                          </div>
                          {item.completed && (
                            <CheckCircle className="h-5 w-5 text-green-500" />
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Assigned Trip */}
          {shipment.trip && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Route className="h-5 w-5" />
                  Assigned Trip
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Route</p>
                      <p className="font-medium">
                        {shipment.trip.departure} → {shipment.trip.destination}
                      </p>
                    </div>
                    {shipment.trip.driver && (
                      <div>
                        <p className="text-sm text-gray-600 mb-1">Driver</p>
                        <p className="font-medium">{shipment.trip.driver.user.name}</p>
                        <p className="text-xs text-gray-500">{shipment.trip.driver.user.email}</p>
                      </div>
                    )}
                    {shipment.trip.vehicle && (
                      <div>
                        <p className="text-sm text-gray-600 mb-1">Vehicle</p>
                        <p className="font-medium">
                          {shipment.trip.vehicle.brand} {shipment.trip.vehicle.model}
                        </p>
                        <p className="text-xs text-gray-500">{shipment.trip.vehicle.plateNumber}</p>
                      </div>
                    )}
                  </div>
                  {isAdmin && (
                    <Link href={`/list/trips/${shipment.trip.id}`}>
                      <Button variant="outline" className="w-full">
                        View Trip Details
                        <ExternalLink className="ml-2 h-4 w-4" />
                      </Button>
                    </Link>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Client Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Client Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Company Name</p>
                  <p className="font-semibold text-lg">{shipment.client.companyName}</p>
                </div>
                <Separator />
                <div>
                  <p className="text-sm text-gray-600 mb-1">Contact Person</p>
                  <p className="font-medium">{shipment.client.user.name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Email</p>
                  <p className="font-medium">{shipment.client.user.email}</p>
                </div>
                {shipment.client.user.phone && (
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Phone</p>
                    <p className="font-medium">{shipment.client.user.phone}</p>
                  </div>
                )}
                {isAdmin && (
                  <>
                    <Separator />
                    <Link href={`/list/clients/${shipment.client.id}`}>
                      <Button variant="outline" className="w-full">
                        View Client Profile
                        <ExternalLink className="ml-2 h-4 w-4" />
                      </Button>
                    </Link>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
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
                <Badge className={getStatusColor(shipment.status)}>
                  <StatusIcon className="mr-1 h-3 w-3" />
                  {shipment.status.replace("_", " ")}
                </Badge>
              </div>
              <Separator />
              <div>
                <p className="text-sm text-gray-600 mb-1">Priority</p>
                <Badge className={getPriorityColor(shipment.priority)}>
                  {shipment.priority}
                </Badge>
              </div>
              <Separator />
              <div>
                <p className="text-sm text-gray-600 mb-1">Price</p>
                <p className="text-2xl font-bold">{formatCurrency(Number(shipment.price))}</p>
              </div>
              <Separator />
              {shipment.weight && (
                <>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Weight</p>
                    <p className="text-xl font-semibold">{Number(shipment.weight).toLocaleString()} kg</p>
                  </div>
                  <Separator />
                </>
              )}
              {shipment.volume && (
                <>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Volume</p>
                    <p className="text-xl font-semibold">{Number(shipment.volume).toLocaleString()} m³</p>
                  </div>
                  <Separator />
                </>
              )}
              <div>
                <p className="text-sm text-gray-600 mb-1">Created</p>
                <p className="text-sm font-medium">
                  {format(new Date(shipment.createdAt), "PPP")}
                </p>
              </div>
              <Separator />
              <div>
                <p className="text-sm text-gray-600 mb-1">Last Updated</p>
                <p className="text-sm font-medium">
                  {format(new Date(shipment.updatedAt), "PPP p")}
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
              {shipment.trip && (
                <Link href={`/list/trips/${shipment.trip.id}`}>
                  <Button variant="outline" className="w-full justify-start" size="sm">
                    <Route className="mr-2 h-4 w-4" />
                    View Trip Details
                  </Button>
                </Link>
              )}
              <Link href={`/list/clients/${shipment.client.id}`}>
                <Button variant="outline" className="w-full justify-start" size="sm">
                  <User className="mr-2 h-4 w-4" />
                  View Client Profile
                </Button>
              </Link>
              {isAdmin && shipment.status === "PENDING" && (
                <Link href={`/list/shipments?status=PENDING`}>
                  <Button variant="outline" className="w-full justify-start" size="sm">
                    <Package className="mr-2 h-4 w-4" />
                    All Pending Shipments
                  </Button>
                </Link>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

