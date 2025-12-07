"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import type { NotificationStatus, NotificationType } from "@prisma/client";

/**
 * Create a new notification for a user
 */
export async function createNotification(data: {
  userId: string;
  title: string;
  message: string;
  type?: NotificationType;
  link?: string;
}) {
  try {
    const notification = await prisma.notification.create({
      data: {
        userId: data.userId,
        title: data.title,
        message: data.message,
        type: data.type || "GENERAL",
        link: data.link || null,
        status: "UNREAD",
      },
    });

    return {
      success: true,
      data: notification,
    };
  } catch (error: any) {
    console.error("Error creating notification:", error);
    return {
      success: false,
      error: error.message || "Failed to create notification",
    };
  }
}

/**
 * Get notifications for the current user with filters
 */
export async function getNotifications(filters?: {
  status?: NotificationStatus;
  type?: NotificationType;
  page?: number;
  limit?: number;
}) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return {
        success: false,
        error: "Unauthorized",
        data: [],
        total: 0,
      };
    }

    const page = filters?.page || 1;
    const limit = filters?.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = {
      userId,
    };

    if (filters?.status) {
      where.status = filters.status;
    }

    if (filters?.type) {
      where.type = filters.type;
    }

    const [notifications, total] = await Promise.all([
      prisma.notification.findMany({
        where,
        orderBy: {
          createdAt: "desc",
        },
        skip,
        take: limit,
      }),
      prisma.notification.count({ where }),
    ]);

    return {
      success: true,
      data: notifications,
      total,
      page,
      limit,
    };
  } catch (error: any) {
    console.error("Error fetching notifications:", error);
    return {
      success: false,
      error: error.message || "Failed to fetch notifications",
      data: [],
      total: 0,
    };
  }
}

/**
 * Get unread notification count for the current user
 */
export async function getUnreadCount() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return {
        success: false,
        error: "Unauthorized",
        count: 0,
      };
    }

    const count = await prisma.notification.count({
      where: {
        userId,
        status: "UNREAD",
      },
    });

    return {
      success: true,
      count,
    };
  } catch (error: any) {
    console.error("Error fetching unread count:", error);
    return {
      success: false,
      error: error.message || "Failed to fetch unread count",
      count: 0,
    };
  }
}

/**
 * Mark a notification as read
 */
export async function markAsRead(notificationId: string) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return {
        success: false,
        error: "Unauthorized",
      };
    }

    // Verify the notification belongs to the current user
    const notification = await prisma.notification.findUnique({
      where: { id: notificationId },
    });

    if (!notification) {
      return {
        success: false,
        error: "Notification not found",
      };
    }

    if (notification.userId !== userId) {
      return {
        success: false,
        error: "Unauthorized",
      };
    }

    await prisma.notification.update({
      where: { id: notificationId },
      data: {
        status: "READ",
        readAt: new Date(),
      },
    });

    return {
      success: true,
    };
  } catch (error: any) {
    console.error("Error marking notification as read:", error);
    return {
      success: false,
      error: error.message || "Failed to mark notification as read",
    };
  }
}

/**
 * Mark all notifications as read for the current user
 */
export async function markAllAsRead() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return {
        success: false,
        error: "Unauthorized",
      };
    }

    await prisma.notification.updateMany({
      where: {
        userId,
        status: "UNREAD",
      },
      data: {
        status: "READ",
        readAt: new Date(),
      },
    });

    return {
      success: true,
    };
  } catch (error: any) {
    console.error("Error marking all notifications as read:", error);
    return {
      success: false,
      error: error.message || "Failed to mark all notifications as read",
    };
  }
}

/**
 * Delete a notification
 */
export async function deleteNotification(notificationId: string) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return {
        success: false,
        error: "Unauthorized",
      };
    }

    // Verify the notification belongs to the current user
    const notification = await prisma.notification.findUnique({
      where: { id: notificationId },
    });

    if (!notification) {
      return {
        success: false,
        error: "Notification not found",
      };
    }

    if (notification.userId !== userId) {
      return {
        success: false,
        error: "Unauthorized",
      };
    }

    await prisma.notification.delete({
      where: { id: notificationId },
    });

    return {
      success: true,
    };
  } catch (error: any) {
    console.error("Error deleting notification:", error);
    return {
      success: false,
      error: error.message || "Failed to delete notification",
    };
  }
}

/**
 * Get a single notification by ID
 */
export async function getNotificationById(notificationId: string) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return {
        success: false,
        error: "Unauthorized",
      };
    }

    const notification = await prisma.notification.findUnique({
      where: { id: notificationId },
    });

    if (!notification) {
      return {
        success: false,
        error: "Notification not found",
      };
    }

    if (notification.userId !== userId) {
      return {
        success: false,
        error: "Unauthorized",
      };
    }

    return {
      success: true,
      data: notification,
    };
  } catch (error: any) {
    console.error("Error fetching notification:", error);
    return {
      success: false,
      error: error.message || "Failed to fetch notification",
    };
  }
}

