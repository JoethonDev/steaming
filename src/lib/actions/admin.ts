"use server";

import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { sessionService } from "@/lib/services/session";
import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";

/**
 * Delete a user (admin only)
 */
export async function deleteUser(userId: string) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any)?.role !== "ADMIN") {
    throw new Error("Unauthorized");
  }

  try {
    // Don't allow deleting yourself
    if ((session.user as any)?.id === userId) {
      throw new Error("Cannot delete your own account");
    }

    // Delete user and cascade related data
    await db.$transaction([
      db.recentEpisode.deleteMany({
        where: { userId }
      }),
      db.recentSeries.deleteMany({
        where: { userId }
      }),
      db.user.delete({
        where: { id: userId }
      })
    ]);

    // Invalidate user's session immediately
    sessionService.broadcastUserChange(userId, 'delete');
    
    // Revalidate admin pages
    revalidatePath('/admin/users');

    return { success: true, message: "User deleted successfully" };
  } catch (error: any) {
    console.error("Delete user error:", error);
    throw new Error(error.message || "Failed to delete user");
  }
}

/**
 * Toggle user role between USER and ADMIN
 */
export async function toggleUserRole(userId: string) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any)?.role !== "ADMIN") {
    throw new Error("Unauthorized");
  }

  try {
    // Don't allow changing your own role
    if ((session.user as any)?.id === userId) {
      throw new Error("Cannot change your own role");
    }

    // Get current user
    const user = await db.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      throw new Error("User not found");
    }

    // Toggle role
    const newRole = user.role === "ADMIN" ? "USER" : "ADMIN";
    
    await db.user.update({
      where: { id: userId },
      data: { role: newRole }
    });

    // Invalidate user's session immediately to reflect role change
    sessionService.broadcastUserChange(userId, 'role');
    
    // Revalidate admin pages
    revalidatePath('/admin/users');

    return { 
      success: true, 
      message: `User role changed to ${newRole}`,
      newRole,
      needsSessionRefresh: true // Flag for client to refresh session
    };
  } catch (error: any) {
    console.error("Toggle role error:", error);
    throw new Error(error.message || "Failed to toggle user role");
  }
}

/**
 * Create a new user (admin only)
 */
export async function createUser(email: string, password: string, role: "USER" | "ADMIN" = "USER") {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any)?.role !== "ADMIN") {
    throw new Error("Unauthorized");
  }

  try {
    // Check if user already exists
    const existingUser = await db.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      throw new Error("User already exists");
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = await db.user.create({
      data: {
        email,
        password: hashedPassword,
        role,
      },
      select: {
        id: true,
        email: true,
        role: true,
        createdAt: true,
      }
    });

    // Broadcast user creation (for admin dashboard updates)
    sessionService.broadcastUserChange(user.id, 'create');
    
    // Revalidate admin pages
    revalidatePath('/admin/users');

    return { 
      success: true, 
      message: "User created successfully",
      user 
    };
  } catch (error: any) {
    console.error("Create user error:", error);
    throw new Error(error.message || "Failed to create user");
  }
}

/**
 * Edit user details (admin only)
 */
export async function editUser(
  userId: string, 
  updates: {
    email?: string;
    password?: string;
    role?: "USER" | "ADMIN";
  }
) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any)?.role !== "ADMIN") {
    throw new Error("Unauthorized");
  }

  try {
    // Get current user to check what's changing
    const currentUser = await db.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, role: true }
    });

    if (!currentUser) {
      throw new Error("User not found");
    }

    // Don't allow changing your own role
    if ((session.user as any)?.id === userId && updates.role && updates.role !== currentUser.role) {
      throw new Error("Cannot change your own role");
    }

    // Check if email is being changed and if it already exists
    if (updates.email && updates.email !== currentUser.email) {
      const existingUser = await db.user.findUnique({
        where: { email: updates.email },
        select: { id: true }
      });
      
      if (existingUser && existingUser.id !== userId) {
        throw new Error("Email already exists");
      }
    }

    // Prepare update data
    const updateData: any = {};
    if (updates.email) updateData.email = updates.email;
    if (updates.role) updateData.role = updates.role;
    if (updates.password) {
      updateData.password = await bcrypt.hash(updates.password, 10);
    }

    // Update user
    const updatedUser = await db.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        email: true,
        role: true,
        updatedAt: true
      }
    });

    // Determine what changed for session invalidation
    const changedFields = [];
    if (updates.email && updates.email !== currentUser.email) changedFields.push('email');
    if (updates.role && updates.role !== currentUser.role) changedFields.push('role');
    if (updates.password) changedFields.push('password');

    // Invalidate user's session if critical data changed
    if (changedFields.length > 0) {
      sessionService.broadcastUserChange(userId, changedFields.includes('password') ? 'password' : 'role');
    }
    
    // Revalidate admin pages
    revalidatePath('/admin/users');

    return { 
      success: true, 
      message: `User updated successfully (${changedFields.join(', ')})`,
      user: updatedUser,
      needsSessionRefresh: changedFields.includes('role') || changedFields.includes('email'),
      isCurrentUser: (session.user as any)?.id === userId
    };
  } catch (error: any) {
    console.error("Edit user error:", error);
    throw new Error(error.message || "Failed to edit user");
  }
}

/**
 * Reset user password (admin only)
 */
export async function resetUserPassword(userId: string, newPassword: string) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any)?.role !== "ADMIN") {
    throw new Error("Unauthorized");
  }

  try {
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await db.user.update({
      where: { id: userId },
      data: { password: hashedPassword }
    });

    // Invalidate user's session to force re-login with new password
    sessionService.broadcastUserChange(userId, 'password');
    
    // Revalidate admin pages
    revalidatePath('/admin/users');

    return { 
      success: true, 
      message: "Password reset successfully",
      needsSessionRefresh: true
    };
  } catch (error: any) {
    console.error("Reset password error:", error);
    throw new Error(error.message || "Failed to reset password");
  }
}