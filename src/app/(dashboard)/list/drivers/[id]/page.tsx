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
  User,
  Mail,
  Phone,
  FileText,
  Route,
  Calendar,
  CheckCircle,
  Clock,
  XCircle,
  ExternalLink,
  Truck,
  Package,
  MoreVertical,
} from "lucide-react";
import { format } from "date-fns";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import EditDriverButton from "./EditDriverButton";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

interface Props {
  params: Promise<{ id: string }>;
}

function getStatusColor(status: string) {
  switch (status) {
    case "ACTIVE":
      return "bg-green-100 text-green-800 border-green-200";
    case "INACTIVE":
      return "bg-gray-100 text-gray-800 border-gray-200";
    case "SUSPENDED":
      return "bg-red-100 text-red-800 border-red-200";
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

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export default async function DriverDetailPage({ params }: Props) {
  await requireAnyRole(["admin", "driver"]);

  const { userId } = await auth();
  if (!userId) {
    redirect("/onboarding");
  }

  const { id } = await params;

  // Get user role
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });

  const isAdmin = user?.role === "ADMIN";
  const isDriver = user?.role === "DRIVER";

  // If driver, verify they're viewing their own profile
  if (isDriver) {
    const driverProfile = await prisma.driverProfile.findUnique({
      where: { userId },
      select: { id: true },
    });
    if (driverProfile?.id !== id) {
      redirect("/driver");
    }
  }

  // Fetch driver with all related data
  const driver = await prisma.driverProfile.findUnique({
    where: { id },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          image: true,
        },
      },
      trips: {
        include: {
          vehicle: {
            select: {
              id: true,
              plateNumber: true,
              brand: true,
              model: true,
            },
          },
          shipments: {
            select: {
              id: true,
              trackingNumber: true,
              status: true,
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
      _count: {
        select: {
          trips: true,
        },
      },
    },
  });

  if (!driver) {
    notFound();
  }

  // Calculate statistics
  const totalTrips = driver.trips.length;
  const activeTrips = driver.trips.filter(
    (trip) => trip.status === "PLANNED" || trip.status === "ONGOING"
  ).length;
  const completedTrips = driver.trips.filter(
    (trip) => trip.status === "COMPLETED"
  ).length;
  const cancelledTrips = driver.trips.filter(
    (trip) => trip.status === "CANCELLED"
  ).length;

  // Prepare driver data for forms
  const driverData = {
    id: driver.id,
    userId: driver.userId,
    licenseNumber: driver.licenseNumber,
    experienceYears: driver.experienceYears,
    status: driver.status,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/list/drivers">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Drivers
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">Driver Details</h1>
            <p className="text-gray-500 mt-1">Driver ID: {driver.id.slice(0, 8)}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <EditDriverButton driverData={driverData} />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link href={`/list/trips?driverId=${driver.id}`}>
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
          {/* Left - Driver Profile Card */}
          <Card className="flex-1 lg:w-2/3">
            <CardContent className="p-6">
              {/* First Row: Avatar and Name */}
              <div className="flex items-center gap-4 mb-6 pb-6 border-b">
                <div className="relative">
                  <Avatar className="w-32 h-32 border-4 border-blue-100 shadow-md">
                    {driver.user.image && (
                      <AvatarImage src={driver.user.image} alt={driver.user.name} />
                    )}
                    <AvatarFallback className="text-2xl bg-gradient-to-br from-blue-500 to-blue-700 text-white">
                      {getInitials(driver.user.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="absolute -bottom-1 -right-1">
                    <Badge className={getStatusColor(driver.status)}>
                      {driver.status}
                    </Badge>
                  </div>
                </div>
                <div className="flex-1">
                  <h1 className="text-2xl font-bold text-gray-900">
                    {driver.user.name}
                  </h1>
                  {/* <p className="text-sm text-gray-500 mt-1">Professional Driver</p> */}
                </div>
              </div>

              {/* Second Row: Other Details */}
              <div className="space-y-1">
                <div className="flex items-center gap-3 py-1">
                  <FileText className="w-4 h-4 text-blue-600 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <span className="text-xs text-gray-500">License Number: </span>
                    <span className="text-xs font-medium text-gray-900 pl-2">{driver.licenseNumber}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3 py-1">
                  <Calendar className="w-4 h-4 text-green-600 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <span className="text-xs text-gray-500">Experience: </span>
                    <span className="text-sm font-medium text-gray-900 pl-2">{driver.experienceYears} years</span>
                  </div>
                </div>

                <div className="flex items-center gap-3 py-1">
                  <Mail className="w-4 h-4 text-purple-600 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <span className="text-xs text-gray-500">Email: </span>
                    <span className="text-xs font-medium text-gray-900 break-words pl-2">{driver.user.email || "--"}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3 py-1">
                  <Phone className="w-4 h-4 text-orange-600 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <span className="text-xs text-gray-500">Phone: </span>
                    <span className="text-sm font-medium text-gray-900 pl-2">{driver.user.phone || "--"}</span>
                  </div>
                </div>
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

            {/* Cancelled Trips Card */}
            <div className="bg-white rounded-md p-4 flex gap-4 w-full md:w-[48%] lg:w-[45%] xl:w-[47%]">
              <div className="flex items-center gap-2">
                <XCircle className="w-6 h-6 text-red-500" />
                <div>
                  <h1 className="text-xl font-semibold">{cancelledTrips}</h1>
                  <span className="text-sm text-gray-400">Cancelled</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom - Trips List */}
        <div className="mt-4 bg-white rounded-md p-4">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-lg font-semibold">Driver&apos;s Trips</h1>
            <Link href={`/list/trips?driverId=${driver.id}`}>
              <Button variant="outline" size="sm">
                View All Trips
                <ExternalLink className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
          {driver.trips.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No trips assigned to this driver</p>
          ) : (
            <div className="space-y-3">
              {driver.trips.slice(0, 10).map((trip) => (
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
                          <span className="font-medium">Vehicle:</span>{" "}
                          {trip.vehicle.plateNumber}
                        </div>
                        <div>
                          <span className="font-medium">Shipments:</span>{" "}
                          {trip._count.shipments}
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
              {driver.trips.length > 10 && (
                <div className="text-center pt-2">
                  <Link href={`/list/trips?driverId=${driver.id}`}>
                    <Button variant="outline" size="sm">
                      View All {driver.trips.length} Trips
                    </Button>
                  </Link>
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
                href={`/list/trips?driverId=${driver.id}`}
              >
                <Route className="w-4 h-4 inline mr-1" />
                All Trips
              </Link>
              <Link
                className="p-3 rounded-md bg-yellow-50 hover:bg-yellow-100 transition-colors"
                href={`/list/trips?driverId=${driver.id}&status=ONGOING`}
              >
                <Clock className="w-4 h-4 inline mr-1" />
                Active Trips
              </Link>
              <Link
                className="p-3 rounded-md bg-green-50 hover:bg-green-100 transition-colors"
                href={`/list/trips?driverId=${driver.id}&status=COMPLETED`}
              >
                <CheckCircle className="w-4 h-4 inline mr-1" />
                Completed Trips
              </Link>
              <Link
                className="p-3 rounded-md bg-purple-50 hover:bg-purple-100 transition-colors"
                href={`/list/trips?driverId=${driver.id}`}
              >
                <Package className="w-4 h-4 inline mr-1" />
                Trips with Shipments
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
              <Badge className={getStatusColor(driver.status)}>
                {driver.status}
              </Badge>
            </div>
            <div className="border-t pt-4">
              <p className="text-sm text-gray-600 mb-1">License Number</p>
              <p className="font-medium">{driver.licenseNumber}</p>
            </div>
            <div className="border-t pt-4">
              <p className="text-sm text-gray-600 mb-1">Experience</p>
              <p className="font-medium">{driver.experienceYears} years</p>
            </div>
            <div className="border-t pt-4">
              <p className="text-sm text-gray-600 mb-1">Member Since</p>
              <p className="font-medium">
                {format(new Date(driver.createdAt), "MMM d, yyyy")}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
      </div>
    </div>
  );
}

