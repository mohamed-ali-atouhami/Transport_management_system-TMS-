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
  Building2,
  MapPin,
  FileText,
  Package,
  Clock,
  CheckCircle,
  XCircle,
  DollarSign,
  ExternalLink,
  MoreVertical,
} from "lucide-react";
import { format } from "date-fns";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import EditClientButton from "./EditClientButton";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

interface Props {
  params: Promise<{ id: string }>;
}

function getStatusColor(status: string) {
  switch (status) {
    case "PENDING":
      return "bg-yellow-100 text-yellow-800 border-yellow-200";
    case "ASSIGNED":
      return "bg-blue-100 text-blue-800 border-blue-200";
    case "IN_TRANSIT":
      return "bg-purple-100 text-purple-800 border-purple-200";
    case "DELIVERED":
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

function formatCurrency(amount: number | string) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(Number(amount));
}

export default async function ClientDetailPage({ params }: Props) {
  await requireAnyRole(["admin", "client"]);

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
  const isClient = user?.role === "CLIENT";

  // If client, verify they're viewing their own profile
  if (isClient) {
    const clientProfile = await prisma.clientProfile.findUnique({
      where: { userId },
      select: { id: true },
    });
    if (clientProfile?.id !== id) {
      redirect("/client");
    }
  }

  // Fetch client with all related data
  const client = await prisma.clientProfile.findUnique({
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
      shipments: {
        include: {
          trip: {
            select: {
              id: true,
              departure: true,
              destination: true,
              dateStart: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      },
      _count: {
        select: {
          shipments: true,
        },
      },
    },
  });

  if (!client) {
    notFound();
  }

  // Calculate statistics
  const totalShipments = client.shipments.length;
  const activeShipments = client.shipments.filter(
    (shipment) => shipment.status === "PENDING" || shipment.status === "ASSIGNED" || shipment.status === "IN_TRANSIT"
  ).length;
  const deliveredShipments = client.shipments.filter(
    (shipment) => shipment.status === "DELIVERED"
  ).length;
  const cancelledShipments = client.shipments.filter(
    (shipment) => shipment.status === "CANCELLED"
  ).length;
  const totalRevenue = client.shipments.reduce((sum, shipment) => sum + Number(shipment.price), 0);

  // Prepare client data for forms
  const clientData = {
    id: client.id,
    userId: client.userId,
    companyName: client.companyName,
    address: client.address,
    vatNumber: client.vatNumber,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {isAdmin && (
            <Link href="/list/clients">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Clients
              </Button>
            </Link>
          )}
          {isClient && (
            <Link href="/client">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Dashboard
              </Button>
            </Link>
          )}
          <div>
            <h1 className="text-3xl font-bold">Client Details</h1>
            <p className="text-gray-500 mt-1">Client ID: {client.id.slice(0, 8)}</p>
          </div>
        </div>
        {isAdmin && (
          <div className="flex items-center gap-2">
            <EditClientButton clientData={clientData} />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                  <Link href={`/list/shipments?clientId=${client.id}`}>
                    <Package className="mr-2 h-4 w-4" />
                    View All Shipments
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
      </div>

      <div className="flex-1 p-4 flex flex-col gap-4 xl:flex-row">
        {/* Left Side - Main Content (2/3 width) */}
        <div className="w-full xl:w-2/3">
          {/* Top Section */}
          <div className="flex flex-col gap-4 lg:flex-row">
            {/* Left - Client Profile Card */}
            <Card className="flex-1 lg:w-2/3">
              <CardContent className="p-6">
                {/* First Row: Avatar and Name */}
                <div className="flex items-center gap-4 mb-6 pb-6 border-b">
                  <div className="relative">
                    <Avatar className="w-32 h-32 border-4 border-purple-100 shadow-md">
                      {client.user.image && (
                        <AvatarImage src={client.user.image} alt={client.user.name} />
                      )}
                      <AvatarFallback className="text-2xl bg-gradient-to-br from-purple-500 to-purple-700 text-white">
                        {getInitials(client.user.name)}
                      </AvatarFallback>
                    </Avatar>
                  </div>
                  <div className="flex-1">
                    <h1 className="text-2xl font-bold text-gray-900">
                      {client.user.name}
                    </h1>
                    <p className="text-sm text-gray-500 mt-1">{client.companyName}</p>
                  </div>
                </div>

                {/* Second Row: Other Details */}
                <div className="space-y-1">
                  <div className="flex items-center gap-3 py-1">
                    <Building2 className="w-4 h-4 text-purple-600 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <span className="text-xs text-gray-500">Company: </span>
                      <span className="text-xs font-medium text-gray-900 pl-2">{client.companyName}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 py-1">
                    <MapPin className="w-4 h-4 text-blue-600 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <span className="text-xs text-gray-500">Address: </span>
                      <span className="text-xs font-medium text-gray-900 break-words pl-2">{client.address}</span>
                    </div>
                  </div>

                  {client.vatNumber && (
                    <div className="flex items-center gap-3 py-1">
                      <FileText className="w-4 h-4 text-green-600 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <span className="text-xs text-gray-500">VAT Number: </span>
                        <span className="text-xs font-medium text-gray-900 pl-2">{client.vatNumber}</span>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-3 py-1">
                    <Mail className="w-4 h-4 text-purple-600 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <span className="text-xs text-gray-500">Email: </span>
                      <span className="text-xs font-medium text-gray-900 break-words pl-2">{client.user.email || "--"}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 py-1">
                    <Phone className="w-4 h-4 text-orange-600 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <span className="text-xs text-gray-500">Phone: </span>
                      <span className="text-sm font-medium text-gray-900 pl-2">{client.user.phone || "--"}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Right - Stat Cards */}
            <div className="flex-1 flex gap-4 justify-between flex-wrap">
              {/* Total Shipments Card */}
              <div className="bg-white rounded-md p-4 flex gap-4 w-full md:w-[48%] lg:w-[45%] xl:w-[47%]">
                <div className="flex items-center gap-2">
                  <Package className="w-6 h-6 text-blue-500" />
                  <div>
                    <h1 className="text-xl font-semibold">{totalShipments}</h1>
                    <span className="text-sm text-gray-400">Total Shipments</span>
                  </div>
                </div>
              </div>

              {/* Active Shipments Card */}
              <div className="bg-white rounded-md p-4 flex gap-4 w-full md:w-[48%] lg:w-[45%] xl:w-[47%]">
                <div className="flex items-center gap-2">
                  <Clock className="w-6 h-6 text-yellow-500" />
                  <div>
                    <h1 className="text-xl font-semibold">{activeShipments}</h1>
                    <span className="text-sm text-gray-400">Active Shipments</span>
                  </div>
                </div>
              </div>

              {/* Delivered Shipments Card */}
              <div className="bg-white rounded-md p-4 flex gap-4 w-full md:w-[48%] lg:w-[45%] xl:w-[47%]">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-6 h-6 text-green-500" />
                  <div>
                    <h1 className="text-xl font-semibold">{deliveredShipments}</h1>
                    <span className="text-sm text-gray-400">Delivered</span>
                  </div>
                </div>
              </div>

              {/* Total Revenue Card */}
              <div className="bg-white rounded-md p-4 flex gap-4 w-full md:w-[48%] lg:w-[45%] xl:w-[47%]">
                <div className="flex items-center gap-2">
                  <DollarSign className="w-6 h-6 text-green-500" />
                  <div>
                    <h1 className="text-xl font-semibold">{formatCurrency(totalRevenue)}</h1>
                    <span className="text-sm text-gray-400">Total Revenue</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom - Shipments List */}
          <div className="mt-4 bg-white rounded-md p-4">
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-lg font-semibold">Client&apos;s Shipments</h1>
              <Link href={`/list/shipments?clientId=${client.id}`}>
                <Button variant="outline" size="sm">
                  View All Shipments
                  <ExternalLink className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
            {client.shipments.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No shipments for this client</p>
            ) : (
              <div className="space-y-3">
                {client.shipments.slice(0, 10).map((shipment) => (
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
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600">
                          <div>
                            <span className="font-medium">Price:</span> {formatCurrency(Number(shipment.price))}
                          </div>
                          <div>
                            <span className="font-medium">Created:</span>{" "}
                            {format(new Date(shipment.createdAt), "MMM d, yyyy")}
                          </div>
                          {shipment.trip && (
                            <div>
                              <span className="font-medium">Trip:</span> {shipment.trip.departure} → {shipment.trip.destination}
                            </div>
                          )}
                          <div>
                            <span className="font-medium">Priority:</span> {shipment.priority}
                          </div>
                        </div>
                      </div>
                      <Link href={`/list/shipments/${shipment.id}`}>
                        <Button variant="ghost" size="sm">
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                ))}
                {client.shipments.length > 10 && (
                  <div className="text-center pt-2">
                    <Link href={`/list/shipments?clientId=${client.id}`}>
                      <Button variant="outline" size="sm">
                        View All {client.shipments.length} Shipments
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
                  href={`/list/shipments?clientId=${client.id}`}
                >
                  <Package className="w-4 h-4 inline mr-1" />
                  All Shipments
                </Link>
                <Link
                  className="p-3 rounded-md bg-yellow-50 hover:bg-yellow-100 transition-colors"
                  href={`/list/shipments?clientId=${client.id}&status=PENDING`}
                >
                  <Clock className="w-4 h-4 inline mr-1" />
                  Pending
                </Link>
                <Link
                  className="p-3 rounded-md bg-purple-50 hover:bg-purple-100 transition-colors"
                  href={`/list/shipments?clientId=${client.id}&status=IN_TRANSIT`}
                >
                  <Package className="w-4 h-4 inline mr-1" />
                  In Transit
                </Link>
                <Link
                  className="p-3 rounded-md bg-green-50 hover:bg-green-100 transition-colors"
                  href={`/list/shipments?clientId=${client.id}&status=DELIVERED`}
                >
                  <CheckCircle className="w-4 h-4 inline mr-1" />
                  Delivered
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
                <p className="text-sm text-gray-600 mb-1">Total Shipments</p>
                <p className="text-xl font-semibold">{totalShipments}</p>
              </div>
              <div className="border-t pt-4">
                <p className="text-sm text-gray-600 mb-1">Total Revenue</p>
                <p className="text-xl font-semibold">{formatCurrency(totalRevenue)}</p>
              </div>
              <div className="border-t pt-4">
                <p className="text-sm text-gray-600 mb-1">Company Name</p>
                <p className="font-medium">{client.companyName}</p>
              </div>
              {client.vatNumber && (
                <div className="border-t pt-4">
                  <p className="text-sm text-gray-600 mb-1">VAT Number</p>
                  <p className="font-medium">{client.vatNumber}</p>
                </div>
              )}
              <div className="border-t pt-4">
                <p className="text-sm text-gray-600 mb-1">Member Since</p>
                <p className="font-medium">
                  {format(new Date(client.createdAt), "MMM d, yyyy")}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

