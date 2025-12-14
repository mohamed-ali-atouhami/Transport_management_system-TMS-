import { requireRole } from "@/lib/rbac";
import { redirect } from "next/navigation";
import { StatsCard } from "@/components/dashboard/stats-card";
import { Users, Truck, Package, DollarSign, AlertCircle, Route, Plus, FileText } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";

export default async function AdminPage() {
  // Server-side role check - defense in depth
  try {
    await requireRole("admin");
  } catch (error) {
    redirect("/onboarding");
  }

  // Get current date for filtering
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

  // Fetch real stats from database
  const [
    totalUsers,
    activeVehicles,
    pendingShipments,
    monthlyRevenue,
    lastMonthRevenue,
    recentTrips,
    recentShipments,
    openIssues,
    upcomingTrips,
  ] = await Promise.all([
    // Total users
    prisma.user.count({ where: { isActive: true } }),
    // Active vehicles
    prisma.vehicle.count({ where: { status: "ACTIVE" } }),
    // Pending shipments
    prisma.shipment.count({ where: { status: "PENDING" } }),
    // Monthly revenue (from completed trips this month)
    prisma.trip.aggregate({
      where: {
        status: "COMPLETED",
        dateEnd: { gte: startOfMonth },
      },
      _sum: {
        totalCost: true,
      },
    }),
    // Last month revenue for comparison
    prisma.trip.aggregate({
      where: {
        status: "COMPLETED",
        dateEnd: { gte: startOfLastMonth, lt: startOfMonth },
      },
      _sum: {
        totalCost: true,
      },
    }),
    // Recent trips (last 5)
    prisma.trip.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      include: {
        driver: {
          include: {
            user: {
              select: { name: true },
            },
          },
        },
        vehicle: {
          select: { plateNumber: true },
        },
      },
    }),
    // Recent shipments (last 5)
    prisma.shipment.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      include: {
        client: {
          include: {
            user: {
              select: { name: true },
            },
          },
        },
      },
    }),
    // Open issues
    prisma.issue.count({
      where: {
        status: { in: ["OPEN", "IN_PROGRESS"] },
      },
    }),
    // Upcoming trips (next 5)
    prisma.trip.findMany({
      where: {
        status: "PLANNED",
        dateStart: { gte: now },
      },
      take: 5,
      orderBy: { dateStart: "asc" },
      include: {
        driver: {
          include: {
            user: {
              select: { name: true },
            },
          },
        },
        vehicle: {
          select: { plateNumber: true },
        },
      },
    }),
  ]);

  const revenue = Number(monthlyRevenue._sum.totalCost || 0);
  const lastRevenue = Number(lastMonthRevenue._sum.totalCost || 0);
  const revenueChange = lastRevenue > 0 ? ((revenue - lastRevenue) / lastRevenue) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="text-gray-600 mt-1">Welcome back! Here's what's happening today.</p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total Users"
          value={totalUsers}
          icon={Users}
          description="All registered users"
        />
        <StatsCard
          title="Active Vehicles"
          value={activeVehicles}
          icon={Truck}
          description="Currently in service"
        />
        <StatsCard
          title="Pending Shipments"
          value={pendingShipments}
          icon={Package}
          description="Awaiting assignment"
        />
        <StatsCard
          title="Monthly Revenue"
          value={`$${revenue.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          icon={DollarSign}
          description="This month"
          trend={
            lastRevenue > 0
              ? {
                  value: Math.abs(revenueChange),
                  isPositive: revenueChange >= 0,
                }
              : undefined
          }
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column - Recent Activity & Overview */}
        <div className="lg:col-span-2 space-y-6">
          {/* Recent Trips */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Recent Trips</CardTitle>
                  <CardDescription>Latest trip activities</CardDescription>
                </div>
                <Link href="/list/trips">
                  <Button variant="outline" size="sm">
                    View All
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              {recentTrips.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">No trips yet</p>
              ) : (
                <div className="space-y-3">
                  {recentTrips.map((trip) => (
                    <Link
                      key={trip.id}
                      href={`/list/trips/${trip.id}`}
                      className="block p-3 rounded-lg border hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="text-sm font-medium truncate">
                              {trip.departure} → {trip.destination}
                            </p>
                            <Badge
                              variant={
                                trip.status === "COMPLETED"
                                  ? "default"
                                  : trip.status === "ONGOING"
                                  ? "secondary"
                                  : trip.status === "CANCELLED"
                                  ? "destructive"
                                  : "outline"
                              }
                              className="text-xs"
                            >
                              {trip.status}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <span>{trip.driver.user.name}</span>
                            <span>{trip.vehicle.plateNumber}</span>
                            <span>{format(new Date(trip.createdAt), "MMM dd, yyyy")}</span>
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Shipments */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Recent Shipments</CardTitle>
                  <CardDescription>Latest shipment requests</CardDescription>
                </div>
                <Link href="/list/shipments">
                  <Button variant="outline" size="sm">
                    View All
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              {recentShipments.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">No shipments yet</p>
              ) : (
                <div className="space-y-3">
                  {recentShipments.map((shipment) => (
                    <Link
                      key={shipment.id}
                      href={`/list/shipments/${shipment.id}`}
                      className="block p-3 rounded-lg border hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="text-sm font-medium truncate">{shipment.trackingNumber}</p>
                            <Badge
                              variant={
                                shipment.status === "DELIVERED"
                                  ? "default"
                                  : shipment.status === "IN_TRANSIT"
                                  ? "secondary"
                                  : shipment.status === "CANCELLED"
                                  ? "destructive"
                                  : "outline"
                              }
                              className="text-xs"
                            >
                              {shipment.status}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <span>{shipment.client.user.name}</span>
                            <span>
                              ${Number(shipment.price).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                            </span>
                            <span>{format(new Date(shipment.createdAt), "MMM dd, yyyy")}</span>
                          </div>
                          </div>
                        </div>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Quick Actions & Overview */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Common admin tasks</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <Link href="/list/trips?action=create">
                <Button variant="outline" className="w-full justify-start" size="sm">
                  <Plus className="mr-2 h-4 w-4" />
                  Create Trip
                </Button>
              </Link>
              <Link href="/list/shipments?action=create">
                <Button variant="outline" className="w-full justify-start" size="sm">
                  <Plus className="mr-2 h-4 w-4" />
                  Create Shipment
                </Button>
              </Link>
              <Link href="/list/users?action=invite">
                <Button variant="outline" className="w-full justify-start" size="sm">
                  <Plus className="mr-2 h-4 w-4" />
                  Invite User
                </Button>
              </Link>
              <Link href="/list/vehicles?action=create">
                <Button variant="outline" className="w-full justify-start" size="sm">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Vehicle
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Open Issues */}
          {openIssues > 0 && (
            <Card className="border-orange-200 bg-orange-50/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-orange-600" />
                  Open Issues
                </CardTitle>
                <CardDescription>Issues requiring attention</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-orange-600 mb-2">{openIssues}</div>
                <Link href="/list/issues">
                  <Button variant="outline" className="w-full" size="sm">
                    View Issues
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )}

          {/* Upcoming Trips */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Upcoming Trips</CardTitle>
                  <CardDescription>Next scheduled trips</CardDescription>
                </div>
                <Link href="/list/trips?status=PLANNED">
                  <Button variant="ghost" size="sm">
                    View All
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              {upcomingTrips.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">No upcoming trips</p>
              ) : (
                <div className="space-y-3">
                  {upcomingTrips.map((trip) => (
                    <Link
                      key={trip.id}
                      href={`/list/trips/${trip.id}`}
                      className="block p-3 rounded-lg border hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">
                            {trip.departure} → {trip.destination}
                          </p>
                          <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                            <span>{trip.driver.user.name}</span>
                            <span>•</span>
                            <span>{trip.vehicle.plateNumber}</span>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            {format(new Date(trip.dateStart), "MMM dd, yyyy 'at' HH:mm")}
                          </p>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
