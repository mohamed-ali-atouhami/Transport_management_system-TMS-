import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { routeAccessMap } from "./lib/settings";

const matchers = Object.keys(routeAccessMap).map((route) => ({
  matcher: createRouteMatcher([route]),
  allowedRoles: routeAccessMap[route],
}));

const FALLBACK_FOR_MISSING_ROLE = "/onboarding";

export default clerkMiddleware(async (auth, request) => {
  const { sessionClaims, userId } = await auth();
  const role = (sessionClaims?.metadata as { role?: string })?.role;
  const normalizedRole = typeof role === "string" ? role.toLowerCase() : undefined;

  for (const { matcher, allowedRoles } of matchers) {
    if (!matcher(request)) {
      continue;
    }

    if (!userId) {
      return NextResponse.redirect(new URL("/", request.url));
    }

    if (!normalizedRole) {
      return NextResponse.redirect(new URL(FALLBACK_FOR_MISSING_ROLE, request.url));
    }

    if (!allowedRoles.includes(normalizedRole)) {
      return NextResponse.redirect(new URL(`/${normalizedRole}`, request.url));
    }
  }
});


export const config = {
    matcher: [
      // Skip Next.js internals and all static files, unless found in search params
      '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
      // Always run for API routes
      '/(api|trpc)(.*)',
    ],
  };