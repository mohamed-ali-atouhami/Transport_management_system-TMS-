import { auth } from "@clerk/nextjs/server";

/**
 * Normalized role values - always lowercase
 */
export type UserRole = "admin" | "driver" | "client";

/**
 * Get the current user's role from session
 * Returns undefined if not authenticated or no role set
 */
export async function getCurrentUserRole(): Promise<UserRole | undefined> {
  const { sessionClaims } = await auth();
  const role = (sessionClaims?.metadata as { role?: string })?.role;
  return typeof role === "string" ? (role.toLowerCase() as UserRole) : undefined;
}

/**
 * Check if current user has the required role
 */
export async function hasRole(requiredRole: UserRole): Promise<boolean> {
  const userRole = await getCurrentUserRole();
  return userRole === requiredRole;
}

/**
 * Check if current user has any of the required roles
 */
export async function hasAnyRole(requiredRoles: UserRole[]): Promise<boolean> {
  const userRole = await getCurrentUserRole();
  return userRole !== undefined && requiredRoles.includes(userRole);
}

/**
 * Get the dashboard path for a role
 */
export function getRoleDashboardPath(role: UserRole): string {
  return `/${role}`;
}

/**
 * Require a specific role - throws if user doesn't have it
 * Use in server components and API routes
 */
export async function requireRole(requiredRole: UserRole): Promise<UserRole> {
  const userRole = await getCurrentUserRole();
  
  if (!userRole) {
    throw new Error("Unauthorized: No role assigned");
  }
  
  if (userRole !== requiredRole) {
    throw new Error(`Unauthorized: Requires ${requiredRole} role, but user has ${userRole}`);
  }
  
  return userRole;
}

/**
 * Require any of the specified roles - throws if user doesn't have one
 */
export async function requireAnyRole(requiredRoles: UserRole[]): Promise<UserRole> {
  const userRole = await getCurrentUserRole();
  
  if (!userRole) {
    throw new Error("Unauthorized: No role assigned");
  }
  
  if (!requiredRoles.includes(userRole)) {
    throw new Error(`Unauthorized: Requires one of [${requiredRoles.join(", ")}], but user has ${userRole}`);
  }
  
  return userRole;
}

