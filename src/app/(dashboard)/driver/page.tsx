import { requireRole } from "@/lib/rbac";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import DriverStatsCards from "@/components/driver/DriverStatsCards";
import UpcomingTripsCard from "@/components/driver/UpcomingTripsCard";
import CurrentTripCard from "@/components/driver/CurrentTripCard";
import IssueReportForm from "@/components/driver/IssueReportForm";
import RecentNotifications from "@/components/driver/RecentNotifications";
import { Calendar, Package, MapPin } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function DriverPage() {
  // Server-side role check - defense in depth
  try {
    await requireRole("driver");
  } catch (error) {
    redirect("/onboarding");
  }

  const { userId } = await auth();
  if (!userId) {
    redirect("/onboarding");
  }

  // Get driver profile
  const driverProfile = await prisma.driverProfile.findUnique({
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

  if (!driverProfile) {
    return <div>Driver profile not found. Please contact administrator.</div>;
  }

  // Get current date for filtering
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  // Get today at midnight for date comparison (not time comparison)
  // This allows trips scheduled for today to be included
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);

  // Fetch driver's trips with related data
  const [
    allTrips,
    upcomingTrips,
    currentTrip,
    totalTrips,
    activeTrips,
    completedTrips,
    tripsThisMonth,
  ] = await Promise.all([
    // All trips for stats
    prisma.trip.findMany({
      where: { driverId: driverProfile.id },
      select: {
        id: true,
        status: true,
        dateStart: true,
      },
    }),
    // Upcoming trips (PLANNED, ordered by date)
    prisma.trip.findMany({
      where: {
        driverId: driverProfile.id,
        status: "PLANNED",
        dateStart: {
          gte: today,
        },
      },
      include: {
        vehicle: {
          select: {
            plateNumber: true,
            brand: true,
            model: true,
          },
        },
        _count: {
          select: {
            shipments: true,
          },
        },
      },
      orderBy: {
        dateStart: "asc",
      },
      take: 5,
    }),
    // Current trip (ONGOING first, then next PLANNED if no ONGOING)
    (async () => {
      // First, try to find an ONGOING trip
      const ongoingTrip = await prisma.trip.findFirst({
        where: {
          driverId: driverProfile.id,
          status: "ONGOING",
        },
        include: {
          vehicle: {
            select: {
              plateNumber: true,
              brand: true,
              model: true,
            },
          },
          _count: {
            select: {
              shipments: true,
            },
          },
        },
      });

      // If no ONGOING trip, get the next PLANNED trip
      // Allow PLANNED trips that are today or in the future (not just strictly future)
      // This allows drivers to report issues for trips scheduled for today
      if (!ongoingTrip) {
        return await prisma.trip.findFirst({
          where: {
            driverId: driverProfile.id,
            status: "PLANNED",
            // Allow trips that start today or in the future
            // Compare dates (not times) by checking if dateStart is >= today at midnight
            dateStart: {
              gte: today,
            },
          },
          include: {
            vehicle: {
              select: {
                plateNumber: true,
                brand: true,
                model: true,
              },
            },
            _count: {
              select: {
                shipments: true,
              },
            },
          },
          orderBy: {
            dateStart: "asc",
          },
        });
      }

      return ongoingTrip;
    })(),
    // Counts for stats
    prisma.trip.count({
      where: { driverId: driverProfile.id },
    }),
    prisma.trip.count({
      where: {
        driverId: driverProfile.id,
        status: {
          in: ["PLANNED", "ONGOING"],
        },
      },
    }),
    prisma.trip.count({
      where: {
        driverId: driverProfile.id,
        status: "COMPLETED",
      },
    }),
    prisma.trip.count({
      where: {
        driverId: driverProfile.id,
        dateStart: {
          gte: startOfMonth,
        },
      },
    }),
  ]);

  // Mock notifications (will be replaced with real notifications later)
  const notifications: Array<{
    id: string;
    title: string;
    message: string;
    createdAt: Date;
    read: boolean;
  }> = [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome back, {driverProfile.user.name?.split(" ")[0] || "Driver"}!
          </h1>
          <p className="text-gray-600 mt-1">Here's your dashboard overview</p>
        </div>
        <div className="flex gap-2">
          <Link href="/list/trips">
            <Button variant="outline">
              <Calendar className="mr-2 h-4 w-4" />
              All Trips
            </Button>
          </Link>
          <Link href="/list/shipments">
            <Button variant="outline">
              <Package className="mr-2 h-4 w-4" />
              Shipments
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <DriverStatsCards
        totalTrips={totalTrips}
        activeTrips={activeTrips}
        completedTrips={completedTrips}
        tripsThisMonth={tripsThisMonth}
      />

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column - Current Trip & Issue Reporting */}
        <div className="lg:col-span-2 space-y-6">
          <CurrentTripCard
            trip={
              currentTrip
                ? {
                    id: currentTrip.id,
                    status: currentTrip.status,
                    departure: currentTrip.departure,
                    destination: currentTrip.destination,
                    dateStart: currentTrip.dateStart,
                    dateEnd: currentTrip.dateEnd,
                    vehicle: currentTrip.vehicle,
                    _count: currentTrip._count,
                  }
                : null
            }
          />
          <IssueReportForm
            trip={
              currentTrip
                ? {
                    id: currentTrip.id,
                    vehicle: {
                      plateNumber: currentTrip.vehicle.plateNumber,
                    },
                  }
                : null
            }
          />
        </div>

        {/* Right Column - Upcoming Trips & Notifications */}
        <div className="space-y-6">
          <UpcomingTripsCard
            trips={
              currentTrip && currentTrip.status === "PLANNED"
                ? upcomingTrips.filter((trip) => trip.id !== currentTrip.id)
                : upcomingTrips
            }
          />
          <RecentNotifications notifications={notifications} />
        </div>
      </div>

      {/* Quick Actions */}
      <div className="rounded-lg border bg-white p-6">
        <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Link href="/list/trips">
            <Button variant="outline" className="w-full justify-start">
              <Calendar className="mr-2 h-4 w-4" />
              View All Trips
            </Button>
          </Link>
          <Link href="/list/shipments">
            <Button variant="outline" className="w-full justify-start">
              <Package className="mr-2 h-4 w-4" />
              View Shipments
            </Button>
          </Link>
          <Link href={`/list/drivers/${driverProfile.id}`}>
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
