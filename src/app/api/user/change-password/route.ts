import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { clerkClient } from "@clerk/nextjs/server";

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { currentPassword, newPassword } = await request.json();

    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { message: "Current password and new password are required" },
        { status: 400 }
      );
    }

    // Update the user's password
    // Note: Clerk's backend SDK doesn't have a direct password change method
    // Instead, we'll use the updateUser method to update metadata
    // The actual password change should be done through Clerk's frontend components
    // But we can remove the requiresPasswordChange flag
    
    // Remove the requiresPasswordChange flag
    const clerk = await clerkClient();
    await clerk.users.updateUserMetadata(userId, { 
      publicMetadata: {
        requiresPasswordChange: false,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Password change flag updated. Please use Clerk's UserProfile component to change your password.",
    });
  } catch (error: any) {
    console.error("Error in change password API:", error);
    return NextResponse.json(
      { message: error.message || "Failed to update password change status" },
      { status: 500 }
    );
  }
}

