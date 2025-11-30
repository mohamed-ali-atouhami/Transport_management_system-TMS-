"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Package, Clock, CheckCircle2, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";

interface ClientStatsCardsProps {
  totalShipments: number;
  activeShipments: number;
  deliveredShipments: number;
  shipmentsThisMonth: number;
}

export default function ClientStatsCards({
  totalShipments,
  activeShipments,
  deliveredShipments,
  shipmentsThisMonth,
}: ClientStatsCardsProps) {
  const stats = [
    {
      title: "Total Shipments",
      value: totalShipments,
      description: "All time",
      icon: Package,
      color: "blue",
      gradient: "from-blue-500 to-blue-600",
      bgGradient: "from-blue-50 to-white",
      borderColor: "border-blue-200",
    },
    {
      title: "Active Shipments",
      value: activeShipments,
      description: "In progress",
      icon: Clock,
      color: "orange",
      gradient: "from-orange-500 to-orange-600",
      bgGradient: "from-orange-50 to-white",
      borderColor: "border-orange-200",
    },
    {
      title: "Delivered",
      value: deliveredShipments,
      description: "Successfully completed",
      icon: CheckCircle2,
      color: "green",
      gradient: "from-green-500 to-green-600",
      bgGradient: "from-green-50 to-white",
      borderColor: "border-green-200",
    },
    {
      title: "This Month",
      value: shipmentsThisMonth,
      description: "Shipments in current month",
      icon: TrendingUp,
      color: "purple",
      gradient: "from-purple-500 to-purple-600",
      bgGradient: "from-purple-50 to-white",
      borderColor: "border-purple-200",
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => {
        const Icon = stat.icon;
        return (
          <Card
            key={stat.title}
            className={cn(
              "border-2 transition-all hover:shadow-lg",
              stat.borderColor,
              `bg-gradient-to-br ${stat.bgGradient}`
            )}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-700">{stat.title}</CardTitle>
              <div className={cn("p-2 rounded-lg bg-white/80", `bg-gradient-to-br ${stat.gradient}`)}>
                <Icon className={cn("h-4 w-4 text-white")} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
              <CardDescription className="text-xs mt-1">{stat.description}</CardDescription>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

