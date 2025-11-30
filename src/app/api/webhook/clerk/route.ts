import { NextRequest, NextResponse } from "next/server";
import { Webhook } from "svix";
import { clerkClient } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

type ClerkEvent = {
  type: string;
  data: any;
};

export async function POST(req: NextRequest) {
  const svixId = req.headers.get("svix-id");
  const svixTimestamp = req.headers.get("svix-timestamp");
  const svixSignature = req.headers.get("svix-signature");

  if (!svixId || !svixTimestamp || !svixSignature) {
    return NextResponse.json({ message: "Missing Svix headers" }, { status: 400 });
  }

  const webhookSecret = process.env.CLERK_WEBHOOK_SECRET;
  if (!webhookSecret) {
    return NextResponse.json({ message: "Webhook secret not configured" }, { status: 500 });
  }

  const payload = await req.text();

  try {
    const wh = new Webhook(webhookSecret);
    const evt = wh.verify(payload, {
      "svix-id": svixId,
      "svix-timestamp": svixTimestamp,
      "svix-signature": svixSignature,
    }) as ClerkEvent;

    // Handle events
    if (evt.type === "user.created") {
      await handleUserCreated(evt.data);
    } else if (evt.type === "user.updated") {
      await handleUserUpdated(evt.data);
    } else if (evt.type === "user.deleted") {
      await handleUserDeleted(evt.data);
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Clerk webhook verification failed:", err);
    return NextResponse.json({ message: "Invalid signature" }, { status: 400 });
  }
}

// ==================== Event Handlers ====================

/**
 * Handle user.created event - Sync new Clerk user to Prisma
 */
async function handleUserCreated(userData: any) {
  try {
    const userId: string | undefined = userData?.id;
    if (!userId) {
      console.error("user.created: Missing user ID");
      return;
    }

    // Check if user already exists (avoid duplicates)
    const existing = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (existing) {
      console.log(`user.created: User ${userId} already exists in Prisma, skipping`);
      return;
    }

    // Extract user data from Clerk webhook
    const email = userData.email_addresses?.[0]?.email_address || null;
    const firstName = userData.first_name || "";
    const lastName = userData.last_name || "";
    const fullName = [firstName, lastName].filter(Boolean).join(" ") || userData.username || "User";
    const username = userData.username || null;
    const phone = userData.phone_numbers?.[0]?.phone_number || null;
    
    // Get role from publicMetadata (default to CLIENT if not set)
    const roleMetadata = userData.public_metadata?.role;
    let role: "ADMIN" | "DRIVER" | "CLIENT" = "CLIENT";
    
    if (roleMetadata) {
      const normalizedRole = String(roleMetadata).toUpperCase();
      if (["ADMIN", "DRIVER", "CLIENT"].includes(normalizedRole)) {
        role = normalizedRole as "ADMIN" | "DRIVER" | "CLIENT";
      }
    }

    // Create user in Prisma
    await prisma.user.create({
      data: {
        id: userId,
        name: fullName,
        email: email || `${userId}@placeholder.local`,
        username: username,
        password: "clerk_managed",
        role: role,
        phone: phone,
        isActive: true,
      } as any, // Temporary: Prisma client needs regeneration after schema update
    });

    console.log(`user.created: Successfully synced user ${userId} to Prisma`);
  } catch (err) {
    // Don't fail the webhook; log and continue
    console.error("user.created: Error syncing user to Prisma:", err);
  }
}

/**
 * Handle user.updated event - Clear requiresPasswordChange flag when password is enabled
 */
async function handleUserUpdated(userData: any) {
  try {
    const userId: string | undefined = userData?.id;
    // Heuristic: if the user has password enabled, clear the requiresPasswordChange flag
    const passwordEnabled: boolean | undefined = userData?.password_enabled;

    if (userId && passwordEnabled) {
      const clerk = await clerkClient();
      await clerk.users.updateUserMetadata(userId, {
        publicMetadata: {
          requiresPasswordChange: false,
        },
      });
      console.log(`user.updated: Cleared requiresPasswordChange for user ${userId}`);
    }

    // Also sync role changes to Prisma if role was updated
    const roleMetadata = userData.public_metadata?.role;
    if (userId && roleMetadata) {
      const normalizedRole = String(roleMetadata).toUpperCase();
      if (["ADMIN", "DRIVER", "CLIENT"].includes(normalizedRole)) {
        const role = normalizedRole as "ADMIN" | "DRIVER" | "CLIENT";
        try {
          await prisma.user.update({
            where: { id: userId },
            data: { role: role } as any,
          });
          console.log(`user.updated: Updated role to ${role} for user ${userId}`);
        } catch (err) {
          // User might not exist in Prisma yet, that's okay
          console.log(`user.updated: User ${userId} not found in Prisma, skipping role update`);
        }
      }
    }
  } catch (err) {
    // Don't fail the webhook; log and continue
    console.error("user.updated: Error processing update:", err);
  }
}

/**
 * Handle user.deleted event - Deactivate user in Prisma (soft delete)
 */
async function handleUserDeleted(userData: any) {
  try {
    const userId: string | undefined = userData?.id;
    if (!userId) {
      console.error("user.deleted: Missing user ID");
      return;
    }

    // Soft delete: set isActive to false (preserves data integrity)
    const updated = await prisma.user.updateMany({
      where: { id: userId },
      data: { isActive: false },
    });

    if (updated.count > 0) {
      console.log(`user.deleted: Deactivated user ${userId} in Prisma`);
    } else {
      console.log(`user.deleted: User ${userId} not found in Prisma, skipping`);
    }
  } catch (err) {
    // Don't fail the webhook; log and continue
    console.error("user.deleted: Error deactivating user:", err);
  }
}


