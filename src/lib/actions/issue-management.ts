"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { requireRole } from "@/lib/rbac";
import type { IssueStatus } from "@prisma/client";
import { createNotification } from "@/lib/actions/notification-management";

/**
 * Get all issues (admin only)
 */
export async function getAllIssues(filters?: {
  status?: IssueStatus;
  severity?: string;
  type?: string;
  search?: string;
}) {
  try {
    await requireRole("admin");

    const where: any = {};

    if (filters?.status) {
      where.status = filters.status;
    }

    if (filters?.severity) {
      where.severity = filters.severity;
    }

    if (filters?.type) {
      where.type = filters.type;
    }

    if (filters?.search) {
      where.OR = [
        { description: { contains: filters.search, mode: "insensitive" } },
        {
          trip: {
            OR: [
              { departure: { contains: filters.search, mode: "insensitive" } },
              { destination: { contains: filters.search, mode: "insensitive" } },
            ],
          },
        },
        {
          driver: {
            user: {
              OR: [
                { name: { contains: filters.search, mode: "insensitive" } },
                { email: { contains: filters.search, mode: "insensitive" } },
              ],
            },
          },
        },
      ];
    }

    const issues = await prisma.issue.findMany({
      where,
      include: {
        trip: {
          select: {
            id: true,
            departure: true,
            destination: true,
            status: true,
            dateStart: true,
          },
        },
        driver: {
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
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return {
      success: true,
      data: issues,
    };
  } catch (error: any) {
    console.error("Error fetching issues:", error);
    return {
      success: false,
      error: error.message || "Failed to fetch issues",
      data: [],
    };
  }
}

/**
 * Update issue status (admin only)
 */
export async function updateIssueStatus(issueId: string, status: IssueStatus, resolution?: string) {
  try {
    await requireRole("admin");

    const updateData: any = {
      status,
    };

    if (status === "RESOLVED" || status === "CLOSED") {
      updateData.resolvedAt = new Date();
      if (resolution) {
        updateData.resolution = resolution;
      }
    } else {
      updateData.resolvedAt = null;
      updateData.resolution = null;
    }

    // Get issue before update to check if status is changing to resolved
    const issue = await prisma.issue.findUnique({
      where: { id: issueId },
      include: {
        driver: {
          include: {
            user: {
              select: { id: true },
            },
          },
        },
        trip: {
          select: { id: true },
        },
      },
    });

    await prisma.issue.update({
      where: { id: issueId },
      data: updateData,
    });

    // Notify driver if issue is resolved
    if (issue && (status === "RESOLVED" || status === "CLOSED")) {
      await createNotification({
        userId: issue.driver.user.id,
        title: "Issue Resolved",
        message: "Your reported issue has been resolved",
        type: "SYSTEM",
        link: `/list/trips/${issue.trip.id}`,
      });
    }

    return {
      success: true,
    };
  } catch (error: any) {
    console.error("Error updating issue status:", error);
    return {
      success: false,
      error: error.message || "Failed to update issue status",
    };
  }
}

/**
 * Get issue by ID
 */
export async function getIssueById(issueId: string) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return {
        success: false,
        error: "Unauthorized",
      };
    }

    const issue = await prisma.issue.findUnique({
      where: { id: issueId },
      include: {
        trip: {
          select: {
            id: true,
            departure: true,
            destination: true,
            status: true,
            dateStart: true,
            dateEnd: true,
          },
        },
        driver: {
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
        },
      },
    });

    if (!issue) {
      return {
        success: false,
        error: "Issue not found",
      };
    }

    return {
      success: true,
      data: issue,
    };
  } catch (error: any) {
    console.error("Error fetching issue:", error);
    return {
      success: false,
      error: error.message || "Failed to fetch issue",
    };
  }
}

