import { requireRole } from "@/lib/rbac";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import ClientStatsCards from "@/components/client/ClientStatsCards";
import ActiveShipmentsCard from "@/components/client/ActiveShipmentsCard";
import RecentShipmentsCard from "@/components/client/RecentShipmentsCard";
import RecentNotifications from "@/components/driver/RecentNotifications";
import { Package, MapPin } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import ShipmentRequestDialog from "@/components/client/ShipmentRequestDialog";

export default async function ClientPage() {
  // Server-side role check - defense in depth
  try {
    await requireRole("client");
  } catch (error) {
    redirect("/onboarding");
  }

  const { userId } = await auth();
  if (!userId) {
    redirect("/onboarding");
  }

  // Get client profile
  const clientProfile = await prisma.clientProfile.findUnique({
    where: { userId },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
        },
      },
    },
  });

  if (!clientProfile) {
    return <div>Client profile not found. Please contact administrator.</div>;
  }

  // Get current date for filtering
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  // Fetch client's shipments with related data
  const [
    totalShipments,
    activeShipments,
    deliveredShipments,
    shipmentsThisMonth,
    activeShipmentsList,
    recentShipments,
  ] = await Promise.all([
    // Counts for stats
    prisma.shipment.count({ where: { clientId: clientProfile.id } }),
    prisma.shipment.count({
      where: {
        clientId: clientProfile.id,
        status: { in: ["PENDING", "ASSIGNED", "IN_TRANSIT"] },
      },
    }),
    prisma.shipment.count({
      where: { clientId: clientProfile.id, status: "DELIVERED" },
    }),
    prisma.shipment.count({
      where: {
        clientId: clientProfile.id,
        createdAt: { gte: startOfMonth },
      },
    }),
    // Active shipments (PENDING, ASSIGNED, IN_TRANSIT)
    prisma.shipment.findMany({
      where: {
        clientId: clientProfile.id,
        status: { in: ["PENDING", "ASSIGNED", "IN_TRANSIT"] },
      },
      include: {
        trip: {
          select: {
            id: true,
            departure: true,
            destination: true,
            status: true,
            vehicle: {
              select: {
                plateNumber: true,
              },
            },
            driver: {
              select: {
                user: {
                  select: {
                    name: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 5,
    }),
    // Recent shipments (all statuses, ordered by creation date)
    prisma.shipment.findMany({
      where: { clientId: clientProfile.id },
      select: {
        id: true,
        trackingNumber: true,
        status: true,
        description: true,
        pickupAddress: true,
        deliveryAddress: true,
        createdAt: true,
        deliveryDate: true,
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 10,
    }),
  ]);

  // Fetch real notifications
  const notificationsData = await prisma.notification.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 5,
  });

  const notifications = notificationsData.map((n) => ({
    id: n.id,
    title: n.title,
    message: n.message,
    createdAt: n.createdAt,
    read: n.status === "READ",
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome back, {clientProfile.user.name?.split(" ")[0] || "Client"}!
          </h1>
          <p className="text-gray-600 mt-1">Here's your dashboard overview</p>
        </div>
        <div className="flex gap-2">
          <ShipmentRequestDialog />
          <Link href="/list/shipments">
            <Button variant="outline">
              <Package className="mr-2 h-4 w-4" />
              All Shipments
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <ClientStatsCards
        totalShipments={totalShipments}
        activeShipments={activeShipments}
        deliveredShipments={deliveredShipments}
        shipmentsThisMonth={shipmentsThisMonth}
      />

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column - Active Shipments */}
        <div className="lg:col-span-2 space-y-6">
          <ActiveShipmentsCard
            shipments={activeShipmentsList.map((shipment) => ({
              id: shipment.id,
              trackingNumber: shipment.trackingNumber,
              status: shipment.status as "PENDING" | "ASSIGNED" | "IN_TRANSIT",
              description: shipment.description,
              pickupAddress: shipment.pickupAddress,
              deliveryAddress: shipment.deliveryAddress,
              priority: shipment.priority,
              pickupDate: shipment.pickupDate,
              deliveryDate: shipment.deliveryDate,
              trip: shipment.trip
                ? {
                    id: shipment.trip.id,
                    departure: shipment.trip.departure,
                    destination: shipment.trip.destination,
                    status: shipment.trip.status,
                    vehicle: {
                      plateNumber: shipment.trip.vehicle.plateNumber,
                    },
                    driver: shipment.trip.driver
                      ? {
                          user: {
                            name: shipment.trip.driver.user.name,
                          },
                        }
                      : null,
                  }
                : null,
            }))}
          />
        </div>

        {/* Right Column - Recent Shipments & Notifications */}
        <div className="space-y-6">
          <RecentShipmentsCard shipments={recentShipments} />
          <RecentNotifications notifications={notifications} />
        </div>
      </div>

      {/* Quick Actions */}
      <div className="rounded-lg border bg-white p-6">
        <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <ShipmentRequestDialog variant="outline" />
          <Link href="/list/shipments">
            <Button variant="outline" className="w-full justify-start">
              <Package className="mr-2 h-4 w-4" />
              View All Shipments
            </Button>
          </Link>
          <Link href={`/list/clients/${clientProfile.id}`}>
            <Button variant="outline" className="w-full justify-start">
              <MapPin className="mr-2 h-4 w-4" />
              My Profile
            </Button>
          </Link>
          <Link href="/notifications">
            <Button variant="outline" className="w-full justify-start">
              <Package className="mr-2 h-4 w-4" />
              Notifications
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
