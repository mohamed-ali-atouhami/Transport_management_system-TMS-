"use server";

import { clerkClient } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/rbac";
import { UserSchema } from "@/lib/FormValidationSchema";
import { auth } from "@clerk/nextjs/server";
import { sendTemporaryPasswordEmail } from "@/lib/email";

// ==================== Types ====================

type CurrentState = {
  success: boolean;
  error: boolean | string;
};

// ==================== Update User ====================

export async function updateUser(currentState: CurrentState, formData: UserSchema) {
  if (!formData || !formData.id) {
    console.error('Invalid form data received:', formData);
    return { success: false, error: 'User ID is required' };
  }

  try {
    await requireRole("admin");

    const { id: userId, ...updateData } = formData;
    const clerk = await clerkClient();
    const clerkUpdate: any = {};

    if (updateData.name) {
      const nameParts = updateData.name.split(" ");
      clerkUpdate.firstName = nameParts[0] || updateData.name;
      clerkUpdate.lastName = nameParts.slice(1).join(" ") || "";
    }

    // Only update Clerk email if a valid email is provided (not empty/null)
    if (updateData.email && updateData.email.trim() !== "") {
      clerkUpdate.emailAddress = [updateData.email.trim()];
    }

    if (updateData.username !== undefined) {
      if (updateData.username?.trim() === "") {
        clerkUpdate.username = null;
      } else {
        clerkUpdate.username = updateData.username?.trim();
      }
    }

    if (updateData.role) {
      clerkUpdate.publicMetadata = {
        role: updateData.role.toLowerCase(),
      };
    }

    if (Object.keys(clerkUpdate).length > 0) {
      await clerk.users.updateUser(userId, clerkUpdate);
    }

    // Get updated username from Clerk if it was updated
    let updatedUsername: string | null = null;
    if (updateData.username !== undefined) {
      try {
        const clerkUser = await clerk.users.getUser(userId);
        updatedUsername = clerkUser.username || null;
      } catch (error) {
        console.error("Error fetching updated username:", error);
      }
    }

    // Get current user to check role change
    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    const oldRole = currentUser?.role;
    const newRole = updateData.role;

    // If role is changing, delete the old profile
    if (newRole && oldRole && newRole !== oldRole) {
      // Delete old driver profile if changing FROM driver
      if (oldRole === "DRIVER") {
        await prisma.driverProfile.deleteMany({
          where: { userId },
        });
      }
      // Delete old client profile if changing FROM client
      if (oldRole === "CLIENT") {
        await prisma.clientProfile.deleteMany({
          where: { userId },
        });
      }
    }

    const prismaUpdate: any = {};

    if (updateData.name) prismaUpdate.name = updateData.name;
    // Handle email: if empty string, set to null; if provided, use it
    if (updateData.email !== undefined) {
      prismaUpdate.email = updateData.email && updateData.email.trim() !== "" 
        ? updateData.email.trim() 
        : null;
    }
    if (updateData.phone !== undefined) prismaUpdate.phone = updateData.phone || null;
    if (updateData.role) prismaUpdate.role = updateData.role;
    if (updateData.username !== undefined) prismaUpdate.username = updatedUsername;
    if (updateData.image !== undefined) prismaUpdate.image = updateData.image || null;

    if (Object.keys(prismaUpdate).length > 0) {
      await prisma.user.update({
        where: { id: userId },
        data: prismaUpdate,
      });
    }

    // Create/update new profile based on new role
    if (newRole === "DRIVER" && (updateData.licenseNumber || updateData.experienceYears !== undefined)) {
      const driverProfile = await prisma.driverProfile.findUnique({
        where: { userId },
      });

      if (driverProfile) {
        await prisma.driverProfile.update({
          where: { userId },
          data: {
            ...(updateData.licenseNumber && { licenseNumber: updateData.licenseNumber }),
            ...(updateData.experienceYears !== undefined && { experienceYears: updateData.experienceYears }),
          },
        });
      } else if (updateData.licenseNumber) {
        await prisma.driverProfile.create({
          data: {
            userId,
            licenseNumber: updateData.licenseNumber,
            experienceYears: updateData.experienceYears || 0,
            status: "ACTIVE",
          },
        });
      }
    }

    if (newRole === "CLIENT" && (updateData.companyName || updateData.address)) {
      const clientProfile = await prisma.clientProfile.findUnique({
        where: { userId },
      });

      if (clientProfile) {
        await prisma.clientProfile.update({
          where: { userId },
          data: {
            ...(updateData.companyName && { companyName: updateData.companyName }),
            ...(updateData.address && { address: updateData.address }),
            ...(updateData.vatNumber !== undefined && { vatNumber: updateData.vatNumber || null }),
          },
        });
      } else if (updateData.companyName && updateData.address) {
        await prisma.clientProfile.create({
          data: {
            userId,
            companyName: updateData.companyName,
            address: updateData.address,
            vatNumber: updateData.vatNumber || null,
          },
        });
      }
    }

    return {
      success: true,
      error: false,
    };
  } catch (error: any) {
    console.error("Error updating user:", error);
    return {
      success: false,
      error: error.message || "Failed to update user",
    };
  }
}

// ==================== Delete User ====================

export async function deleteUser(formData: FormData) {
  const id = formData.get("id") as string;
  
  if (!id) {
    console.error("No user ID provided");
    return false;
  }

  try {
    await requireRole("admin");

    const user = await prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      console.error("User not found");
      return false;
    }

    // Delete from Prisma first
    await prisma.user.delete({
      where: { id },
    });

    // Delete from Clerk
    const clerk = await clerkClient();
    try {
      await clerk.users.deleteUser(id);
    } catch (clerkError) {
      console.error("Error deleting user from Clerk:", clerkError);
      // Continue even if Clerk deletion fails
    }

    return true;
  } catch (error: any) {
    console.error("Error deleting user:", error);
    return false;
  }
}

// ==================== Deactivate User ====================

export async function deactivateUser(formData: FormData) {
  const id = formData.get("id") as string;
  
  if (!id) {
    console.error("No user ID provided");
    return false;
  }

  try {
    await requireRole("admin");

    await prisma.user.update({
      where: { id },
      data: { isActive: false },
    });

    return true;
  } catch (error: any) {
    console.error("Error deactivating user:", error);
    return false;
  }
}

// ==================== Activate User ====================

export async function activateUser(formData: FormData) {
  const id = formData.get("id") as string;
  
  if (!id) {
    console.error("No user ID provided");
    return false;
  }

  try {
    await requireRole("admin");

    await prisma.user.update({
      where: { id },
      data: { isActive: true },
    });

    return true;
  } catch (error: any) {
    console.error("Error activating user:", error);
    return false;
  }
}

// ==================== Invite User ====================

type UserRole = "ADMIN" | "DRIVER" | "CLIENT";

type InviteUserInput = {
  name: string;
  email?: string; // Optional - only needed if sending email
  username: string; // Required - used for sign-in
  role: UserRole;
  phone?: string;
  licenseNumber?: string;
  experienceYears?: number;
  companyName?: string;
  address?: string;
  vatNumber?: string;
};

export async function inviteUser(input: InviteUserInput) {
  try {
    const { userId } = await auth();
    if (!userId) {
      throw new Error("Unauthorized");
    }

    // Validate username is provided
    if (!input.username || input.username.trim().length === 0) {
      throw new Error("Username is required");
    }

    // Use default password if email is not provided, otherwise generate temporary password
    const password = input.email ? generateTemporaryPassword() : "randpass@1234";
    const clerk = await clerkClient();

    // Build user creation data
    const userData: any = {
      username: input.username.trim(),
      firstName: input.name.split(" ")[0] || input.name,
      lastName: input.name.split(" ").slice(1).join(" ") || "",
      password: password,
      publicMetadata: {
        role: input.role.toLowerCase(),
        requiresPasswordChange: true,
      },
      skipPasswordChecks: false,
      skipPasswordRequirement: false,
    };

    // Only add email if provided
    if (input.email && input.email.trim().length > 0) {
      userData.emailAddress = [input.email.trim()];
    }

    const clerkUser = await clerk.users.createUser(userData);

    const prismaRole = input.role as UserRole;

    const dbUser = await prisma.user.create({
      data: {
        id: clerkUser.id,
        name: input.name,
        email: input.email || null,
        username: clerkUser.username || null,
        password: "clerk_managed",
        role: prismaRole,
        phone: input.phone || null,
        isActive: true,
      } as any,
    });

    if (input.role === "DRIVER" && input.licenseNumber) {
      await prisma.driverProfile.create({
        data: {
          userId: dbUser.id,
          licenseNumber: input.licenseNumber,
          experienceYears: input.experienceYears || 0,
          status: "ACTIVE",
        },
      });
    } else if (input.role === "CLIENT" && input.companyName && input.address) {
      await prisma.clientProfile.create({
        data: {
          userId: dbUser.id,
          companyName: input.companyName,
          address: input.address,
          vatNumber: input.vatNumber || null,
        },
      });
    }

    // Only send email if email is provided
    if (input.email && input.email.trim().length > 0) {
      await sendTemporaryPasswordEmail(input.email, input.name, password);
      return {
        success: true,
        message: `User ${input.name} has been invited successfully. They will receive an email with their temporary password.`,
        userId: clerkUser.id,
      };
    } else {
      return {
        success: true,
        message: `User ${input.name} has been created successfully. Default password: password1234. They will be required to change it on first login.`,
        userId: clerkUser.id,
      };
    }
  } catch (error: unknown) {
    let message = "Failed to invite user. Please try again.";
    try {
      if (typeof error === "string") {
        message = error;
      } else if (error && typeof error === "object") {
        const anyErr = error as any;
        if (Array.isArray(anyErr?.errors) && anyErr.errors.length > 0) {
          message = anyErr.errors
            .map((e: any) => e?.message || e?.long_message || e?.code || "Unknown validation error")
            .join("; ");
        } else if (anyErr?.message) {
          message = String(anyErr.message);
        } else {
          message = JSON.stringify(anyErr, Object.getOwnPropertyNames(anyErr));
        }
      }
    } catch {
      // noop
    }
    console.error("Error inviting user:", error);
    return {
      success: false,
      message,
    };
  }
}

// ==================== Assign User Role ====================

type AssignUserRoleInput = {
  identifier: string; // email or username
  role: UserRole;
  licenseNumber?: string;
  experienceYears?: number;
  companyName?: string;
  address?: string;
  vatNumber?: string;
};

export async function assignUserRole(input: AssignUserRoleInput) {
  try {
    const { userId: adminId } = await auth();
    if (!adminId) {
      throw new Error("Unauthorized");
    }

    const clerk = await clerkClient();

    const isEmail = input.identifier.includes("@");
    const userList = await clerk.users.getUserList(
      isEmail ? { emailAddress: [input.identifier] } : { username: [input.identifier] }
    );
    const target = userList?.data?.[0];
    if (!target) {
      return { success: false, message: "User not found in Clerk" };
    }

    const normalizedRole = input.role.toLowerCase();

    await clerk.users.updateUserMetadata(target.id, {
      publicMetadata: {
        role: normalizedRole,
      },
    });

    const existing = await prisma.user.findUnique({ where: { id: target.id } });
    const fullName = [target.firstName, target.lastName].filter(Boolean).join(" ") || target.username || "User";
    const email = target.emailAddresses?.[0]?.emailAddress || null;

    const oldRole = existing?.role;

    // If role is changing, delete the old profile
    if (existing && oldRole && input.role !== oldRole) {
      // Delete old driver profile if changing FROM driver
      if (oldRole === "DRIVER") {
        await prisma.driverProfile.deleteMany({
          where: { userId: target.id },
        });
      }
      // Delete old client profile if changing FROM client
      if (oldRole === "CLIENT") {
        await prisma.clientProfile.deleteMany({
          where: { userId: target.id },
        });
      }
    }

    if (!existing) {
      await prisma.user.create({
        data: {
          id: target.id,
          name: fullName,
          email: email ?? `${target.id}@placeholder.local`,
          username: target.username || null,
          password: "clerk_managed",
          role: input.role,
          phone: target.phoneNumbers?.[0]?.phoneNumber ?? null,
          isActive: true,
        } as any,
      });
    } else {
      await prisma.user.update({
        where: { id: target.id },
        data: { role: input.role, username: target.username || null } as any,
      });
    }

    if (input.role === "DRIVER" && input.licenseNumber) {
      const driverProfile = await prisma.driverProfile.findUnique({
        where: { userId: target.id },
      });

      if (driverProfile) {
        await prisma.driverProfile.update({
          where: { userId: target.id },
          data: {
            licenseNumber: input.licenseNumber,
            experienceYears: input.experienceYears || 0,
          },
        });
      } else {
        await prisma.driverProfile.create({
          data: {
            userId: target.id,
            licenseNumber: input.licenseNumber,
            experienceYears: input.experienceYears || 0,
            status: "ACTIVE",
          },
        });
      }
    }

    if (input.role === "CLIENT" && input.companyName && input.address) {
      const clientProfile = await prisma.clientProfile.findUnique({
        where: { userId: target.id },
      });

      if (clientProfile) {
        await prisma.clientProfile.update({
          where: { userId: target.id },
          data: {
            companyName: input.companyName,
            address: input.address,
            vatNumber: input.vatNumber || null,
          },
        });
      } else {
        await prisma.clientProfile.create({
          data: {
            userId: target.id,
            companyName: input.companyName,
            address: input.address,
            vatNumber: input.vatNumber || null,
          },
        });
      }
    }

    return {
      success: true,
      message: `Role ${input.role} assigned successfully to user.`,
    };
  } catch (error: any) {
    console.error("Error assigning role:", error);
    return {
      success: false,
      message: error.message || "Failed to assign role",
    };
  }
}

// ==================== Helper Functions ====================

function generateTemporaryPassword(): string {
  const length = 12;
  const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
  let password = "";

  password += "ABCDEFGHIJKLMNOPQRSTUVWXYZ"[Math.floor(Math.random() * 26)];
  password += "abcdefghijklmnopqrstuvwxyz"[Math.floor(Math.random() * 26)];
  password += "0123456789"[Math.floor(Math.random() * 10)];
  password += "!@#$%^&*"[Math.floor(Math.random() * 8)];

  for (let i = password.length; i < length; i++) {
    password += charset[Math.floor(Math.random() * charset.length)];
  }

  return password.split("").sort(() => Math.random() - 0.5).join("");
}

