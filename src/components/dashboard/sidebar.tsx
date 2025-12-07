"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  Users,
  Truck,
  Route,
  Package,
  DollarSign,
  FileText,
  Settings,
  LayoutDashboard,
  UserCheck,
  Building2,
  AlertCircle,
  Bell,
} from "lucide-react";
import { useUser } from "@clerk/nextjs";

type NavigationItem = {
  name: string;
  href: string | ((role: string | undefined) => string);
  icon: React.ComponentType<{ className?: string }>;
  visible: ("admin" | "driver" | "client")[];
};

const navigation: NavigationItem[] = [
  { name: "Dashboard", href: (role) => role ? `/${role}` : "/", icon: LayoutDashboard, visible: ["admin", "driver", "client"] },
  { name: "Users", href: "/list/users", icon: Users, visible: ["admin"] },
  { name: "Drivers", href: "/list/drivers", icon: UserCheck, visible: ["admin"] },
  { name: "Clients", href: "/list/clients", icon: Building2, visible: ["admin"] },
  { name: "Vehicles", href: "/list/vehicles", icon: Truck, visible: ["admin"] },
  { name: "Trips", href: "/list/trips", icon: Route, visible: ["admin", "driver", "client"] },
  { name: "Shipments", href: "/list/shipments", icon: Package, visible: ["admin", "driver", "client"] },
  { name: "Issues", href: "/list/issues", icon: AlertCircle, visible: ["admin"] },
  { name: "Expenses", href: "/list/expenses", icon: DollarSign, visible: ["admin", "driver"] },
  { name: "Notifications", href: "/notifications", icon: Bell, visible: ["admin", "driver", "client"] },
  { name: "Reports", href: "/admin/reports", icon: FileText, visible: ["admin", "driver", "client"] },
  { name: "Settings", href: "/admin/settings", icon: Settings, visible: ["admin", "driver", "client"] },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user, isLoaded } = useUser();
  
  // Normalize role to lowercase (Clerk stores it as lowercase in metadata)
  const role = typeof user?.publicMetadata?.role === "string" 
    ? user.publicMetadata.role.toLowerCase() as "admin" | "driver" | "client"
    : undefined;

  // Get role-specific title
  const getTitle = () => {
    if (!isLoaded) return "TMS";
    switch (role) {
      case "admin":
        return "TMS Admin";
      case "driver":
        return "TMS Driver";
      case "client":
        return "TMS Client";
      default:
        return "TMS";
    }
  };

  // Get dashboard href based on role
  const getDashboardHref = () => {
    if (!role) return "/";
    return `/${role}`;
  };

  // Filter navigation items based on role
  const visibleItems = navigation.filter((item) => {
    if (!role) return false;
    return item.visible.includes(role);
  });

  return (
    <div className="flex h-full w-64 flex-col border-r bg-white">
      <div className="flex h-16 items-center border-b px-6">
        <Link href={getDashboardHref()}>
          <h1 className="text-xl font-semibold">{getTitle()}</h1>
        </Link>
      </div>
      <nav className="flex-1 space-y-1 px-3 py-4">
        {isLoaded && visibleItems.map((item) => {
          // Handle dynamic href (function) or static href (string)
          const href = typeof item.href === "function" ? item.href(role) : item.href;
          const isActive = pathname === href || pathname?.startsWith(href + "/");
          const Icon = item.icon;
          return (
            <Link
              key={item.name}
              href={href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-gray-900 text-white"
                  : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
              )}
            >
              <Icon className="h-5 w-5" />
              {item.name}
            </Link>
          );
        })}
        {!isLoaded && (
          <div className="space-y-1">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-10 rounded-lg bg-gray-100 animate-pulse" />
            ))}
          </div>
        )}
      </nav>
    </div>
  );
}

