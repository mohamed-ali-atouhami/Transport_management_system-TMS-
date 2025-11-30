import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { generateUploadSignature } from "@/lib/cloudinary";

/**
 * GET /api/upload/signature
 * Generate a signed upload signature for authenticated users
 * This allows secure client-side uploads to Cloudinary
 */
export async function GET(request: NextRequest) {
  try {
    // Verify user is authenticated
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const folder = searchParams.get("folder") || undefined;
    const publicId = searchParams.get("publicId") || undefined;

    // Generate timestamp (required for signed uploads)
    const timestamp = Math.round(new Date().getTime() / 1000);

    // Generate signature and get API key
    const { signature, apiKey } = generateUploadSignature({
      folder,
      publicId,
      timestamp,
    });

    // Return signature, api_key, and timestamp to client
    // Note: api_key is safe to expose (it's not a secret)
    return NextResponse.json({
      signature,
      api_key: apiKey,
      timestamp,
      folder: folder || "transport-management",
    });
  } catch (error: any) {
    console.error("Error generating upload signature:", error);
    return NextResponse.json(
      { error: error.message || "Failed to generate upload signature" },
      { status: 500 }
    );
  }
}

