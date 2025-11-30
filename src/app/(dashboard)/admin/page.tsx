import { requireRole } from "@/lib/rbac";
import { redirect } from "next/navigation";
import { StatsCard } from "@/components/dashboard/stats-card";
import { Users, Truck, Package, DollarSign } from "lucide-react";

export default async function AdminPage() {
  // Server-side role check - defense in depth
  try {
    await requireRole("admin");
  } catch (error) {
    redirect("/onboarding");
  }

  // TODO: Fetch real stats from database
  const stats = {
    totalUsers: 0,
    activeVehicles: 0,
    pendingShipments: 0,
    monthlyRevenue: 0,
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-1">Welcome back! Here's what's happening today.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total Users"
          value={stats.totalUsers}
          icon={Users}
          description="All registered users"
        />
        <StatsCard
          title="Active Vehicles"
          value={stats.activeVehicles}
          icon={Truck}
          description="Currently in service"
        />
        <StatsCard
          title="Pending Shipments"
          value={stats.pendingShipments}
          icon={Package}
          description="Awaiting assignment"
        />
        <StatsCard
          title="Monthly Revenue"
          value={`$${stats.monthlyRevenue.toLocaleString("en-US")}`}
          icon={DollarSign}
          description="This month"
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-lg border bg-white p-6">
          <h2 className="text-lg font-semibold mb-4">Recent Activity</h2>
          <p className="text-sm text-gray-500">No recent activity</p>
        </div>
        <div className="rounded-lg border bg-white p-6">
          <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
          <p className="text-sm text-gray-500">Quick actions will appear here</p>
        </div>
      </div>
    </div>
  );
}
