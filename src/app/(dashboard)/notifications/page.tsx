"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
} from "@/lib/actions/notification-management";
import { Bell, Check, CheckCheck, Trash2, ExternalLink } from "lucide-react";
import { formatDistanceToNow, format, isToday, isYesterday, isThisWeek } from "date-fns";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

type NotificationStatus = "UNREAD" | "READ";
type NotificationType = "SYSTEM" | "TRIP_UPDATE" | "SHIPMENT" | "PAYMENT" | "GENERAL";

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<NotificationStatus | "ALL">("ALL");
  const [typeFilter, setTypeFilter] = useState<NotificationType | "ALL">("ALL");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const router = useRouter();

  const fetchNotifications = async () => {
    setLoading(true);
    const filters: any = {
      page,
      limit: 50,
    };

    if (statusFilter !== "ALL") {
      filters.status = statusFilter;
    }

    if (typeFilter !== "ALL") {
      filters.type = typeFilter;
    }

    const result = await getNotifications(filters);
    if (result.success) {
      setNotifications(result.data || []);
      setTotal(result.total || 0);
    } else {
      toast.error(result.error || "Failed to load notifications");
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchNotifications();
  }, [statusFilter, typeFilter, page]);

  const handleMarkAsRead = async (notificationId: string) => {
    const result = await markAsRead(notificationId);
    if (result.success) {
      setNotifications((prev) =>
        prev.map((n) =>
          n.id === notificationId ? { ...n, status: "READ" as NotificationStatus, readAt: new Date() } : n
        )
      );
      toast.success("Notification marked as read");
    } else {
      toast.error(result.error || "Failed to mark notification as read");
    }
  };

  const handleMarkAllAsRead = async () => {
    const result = await markAllAsRead();
    if (result.success) {
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, status: "READ" as NotificationStatus, readAt: new Date() }))
      );
      toast.success("All notifications marked as read");
      fetchNotifications();
    } else {
      toast.error(result.error || "Failed to mark all as read");
    }
  };

  const handleDelete = async (notificationId: string) => {
    const result = await deleteNotification(notificationId);
    if (result.success) {
      setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
      setTotal((prev) => prev - 1);
      toast.success("Notification deleted");
    } else {
      toast.error(result.error || "Failed to delete notification");
    }
  };

  const handleNotificationClick = (notification: any) => {
    if (notification.status === "UNREAD") {
      handleMarkAsRead(notification.id);
    }
    if (notification.link) {
      router.push(notification.link);
    }
  };

  const groupNotificationsByDate = (notifications: any[]) => {
    const groups: { [key: string]: any[] } = {
      today: [],
      yesterday: [],
      thisWeek: [],
      older: [],
    };

    notifications.forEach((notification) => {
      const date = new Date(notification.createdAt);
      if (isToday(date)) {
        groups.today.push(notification);
      } else if (isYesterday(date)) {
        groups.yesterday.push(notification);
      } else if (isThisWeek(date)) {
        groups.thisWeek.push(notification);
      } else {
        groups.older.push(notification);
      }
    });

    return groups;
  };

  const getTypeBadgeVariant = (type: NotificationType) => {
    switch (type) {
      case "SYSTEM":
        return "destructive";
      case "TRIP_UPDATE":
        return "default";
      case "SHIPMENT":
        return "secondary";
      case "PAYMENT":
        return "outline";
      default:
        return "outline";
    }
  };

  const groupedNotifications = groupNotificationsByDate(notifications);

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Notifications</h1>
          <p className="text-muted-foreground mt-1">
            Manage and view all your notifications
          </p>
        </div>
        <Button onClick={handleMarkAllAsRead} variant="outline">
          <CheckCheck className="mr-2 h-4 w-4" />
          Mark all as read
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="text-sm font-medium mb-2 block">Status</label>
              <Select
                value={statusFilter}
                onValueChange={(value) => {
                  setStatusFilter(value as NotificationStatus | "ALL");
                  setPage(1);
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Status</SelectItem>
                  <SelectItem value="UNREAD">Unread</SelectItem>
                  <SelectItem value="READ">Read</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1">
              <label className="text-sm font-medium mb-2 block">Type</label>
              <Select
                value={typeFilter}
                onValueChange={(value) => {
                  setTypeFilter(value as NotificationType | "ALL");
                  setPage(1);
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Types</SelectItem>
                  <SelectItem value="SYSTEM">System</SelectItem>
                  <SelectItem value="TRIP_UPDATE">Trip Update</SelectItem>
                  <SelectItem value="SHIPMENT">Shipment</SelectItem>
                  <SelectItem value="PAYMENT">Payment</SelectItem>
                  <SelectItem value="GENERAL">General</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notifications List */}
      {loading ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">Loading notifications...</p>
          </CardContent>
        </Card>
      ) : notifications.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Bell className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <p className="text-muted-foreground">No notifications found</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* Today */}
          {groupedNotifications.today.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold mb-3">Today</h2>
              <div className="space-y-2">
                {groupedNotifications.today.map((notification) => (
                  <NotificationItem
                    key={notification.id}
                    notification={notification}
                    onMarkAsRead={handleMarkAsRead}
                    onDelete={handleDelete}
                    onClick={handleNotificationClick}
                    getTypeBadgeVariant={getTypeBadgeVariant}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Yesterday */}
          {groupedNotifications.yesterday.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold mb-3">Yesterday</h2>
              <div className="space-y-2">
                {groupedNotifications.yesterday.map((notification) => (
                  <NotificationItem
                    key={notification.id}
                    notification={notification}
                    onMarkAsRead={handleMarkAsRead}
                    onDelete={handleDelete}
                    onClick={handleNotificationClick}
                    getTypeBadgeVariant={getTypeBadgeVariant}
                  />
                ))}
              </div>
            </div>
          )}

          {/* This Week */}
          {groupedNotifications.thisWeek.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold mb-3">This Week</h2>
              <div className="space-y-2">
                {groupedNotifications.thisWeek.map((notification) => (
                  <NotificationItem
                    key={notification.id}
                    notification={notification}
                    onMarkAsRead={handleMarkAsRead}
                    onDelete={handleDelete}
                    onClick={handleNotificationClick}
                    getTypeBadgeVariant={getTypeBadgeVariant}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Older */}
          {groupedNotifications.older.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold mb-3">Older</h2>
              <div className="space-y-2">
                {groupedNotifications.older.map((notification) => (
                  <NotificationItem
                    key={notification.id}
                    notification={notification}
                    onMarkAsRead={handleMarkAsRead}
                    onDelete={handleDelete}
                    onClick={handleNotificationClick}
                    getTypeBadgeVariant={getTypeBadgeVariant}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function NotificationItem({
  notification,
  onMarkAsRead,
  onDelete,
  onClick,
  getTypeBadgeVariant,
}: {
  notification: any;
  onMarkAsRead: (id: string) => void;
  onDelete: (id: string) => void;
  onClick: (notification: any) => void;
  getTypeBadgeVariant: (type: NotificationType) => "default" | "secondary" | "destructive" | "outline";
}) {
  return (
    <Card
      className={`cursor-pointer transition-all hover:shadow-md ${
        notification.status === "UNREAD" ? "border-l-4 border-l-blue-600 bg-blue-50/50" : ""
      }`}
      onClick={() => onClick(notification)}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="font-semibold">{notification.title}</h3>
              {notification.status === "UNREAD" && (
                <span className="h-2 w-2 rounded-full bg-blue-600 flex-shrink-0" />
              )}
              <Badge variant={getTypeBadgeVariant(notification.type)} className="text-xs">
                {notification.type.replace("_", " ")}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground mb-2">{notification.message}</p>
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span>
                {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
              </span>
              {notification.link && (
                <span className="flex items-center gap-1">
                  <ExternalLink className="h-3 w-3" />
                  Has link
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
            {notification.status === "UNREAD" && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onMarkAsRead(notification.id)}
                title="Mark as read"
              >
                <Check className="h-4 w-4" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDelete(notification.id)}
              title="Delete"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

