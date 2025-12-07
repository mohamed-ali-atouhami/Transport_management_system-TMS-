/**
 * Backfill Script: Sync existing Clerk users to Prisma database
 * 
 * This script fetches all users from Clerk and creates them in Prisma
 * if they don't already exist. Useful for syncing users created before
 * the webhook was set up.
 * 
 * Usage:
 *   npx tsx scripts/backfill-clerk-users.ts
 * 
 * Or add to package.json:
 *   "backfill:users": "tsx scripts/backfill-clerk-users.ts"
 */

import { createClerkClient } from "@clerk/backend";
import { PrismaClient } from "@prisma/client";

// Check for required environment variable
if (!process.env.CLERK_SECRET_KEY) {
  console.error("❌ Error: CLERK_SECRET_KEY environment variable is required");
  console.error("   Make sure your .env file has CLERK_SECRET_KEY set");
  process.exit(1);
}

// Initialize Clerk client
const clerk = createClerkClient({
  secretKey: process.env.CLERK_SECRET_KEY,
});

const prisma = new PrismaClient();

type UserRole = "ADMIN" | "DRIVER" | "CLIENT";

async function main() {
  console.log("🚀 Starting Clerk users backfill...\n");

  try {
    // Fetch all users from Clerk (paginated)
    let allUsers: any[] = [];
    let offset = 0;
    const limit = 100; // Clerk's max page size

    console.log("📥 Fetching users from Clerk...");

    while (true) {
      const response = await clerk.users.getUserList({
        limit,
        offset,
      });

      if (!response.data || response.data.length === 0) {
        break;
      }

      allUsers = allUsers.concat(response.data);
      console.log(`   Fetched ${allUsers.length} users so far...`);

      // Check if there are more pages
      if (response.data.length < limit) {
        break;
      }

      offset += limit;
    }

    console.log(`✅ Total users in Clerk: ${allUsers.length}\n`);

    // Process each user
    let created = 0;
    let skipped = 0;
    let errors = 0;

    for (const clerkUser of allUsers) {
      try {
        const userId = clerkUser.id;

        // Check if user already exists in Prisma
        const existing = await prisma.user.findUnique({
          where: { id: userId },
        });

        if (existing) {
          console.log(`⏭️  Skipping ${userId} (already exists)`);
          skipped++;
          continue;
        }

        // Extract user data from Clerk
        const email = clerkUser.emailAddresses?.[0]?.emailAddress || null;
        const firstName = clerkUser.firstName || "";
        const lastName = clerkUser.lastName || "";
        const fullName = [firstName, lastName].filter(Boolean).join(" ") || clerkUser.username || "User";
        const username = clerkUser.username || null;
        const phone = clerkUser.phoneNumbers?.[0]?.phoneNumber || null;

        // Get role from publicMetadata (default to CLIENT if not set)
        const roleMetadata = clerkUser.publicMetadata?.role;
        let role: UserRole = "CLIENT";

        if (roleMetadata) {
          const normalizedRole = String(roleMetadata).toUpperCase();
          if (["ADMIN", "DRIVER", "CLIENT"].includes(normalizedRole)) {
            role = normalizedRole as UserRole;
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

        console.log(`✅ Created: ${fullName} (${email || "no email"}) - Role: ${role}`);
        created++;
      } catch (error: any) {
        console.error(`❌ Error processing user ${clerkUser.id}:`, error.message);
        errors++;
      }
    }

    // Summary
    console.log("\n" + "=".repeat(50));
    console.log("📊 Backfill Summary:");
    console.log(`   ✅ Created: ${created}`);
    console.log(`   ⏭️  Skipped: ${skipped}`);
    console.log(`   ❌ Errors: ${errors}`);
    console.log(`   📦 Total: ${allUsers.length}`);
    console.log("=".repeat(50));

    if (errors > 0) {
      console.log("\n⚠️  Some users failed to sync. Check the errors above.");
    } else {
      console.log("\n🎉 All users synced successfully!");
    }
  } catch (error: any) {
    console.error("\n❌ Fatal error during backfill:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
main()
  .then(() => {
    console.log("\n✨ Backfill completed!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n💥 Unhandled error:", error);
    process.exit(1);
  });

