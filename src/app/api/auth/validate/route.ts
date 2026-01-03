import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

/**
 * Validates if a user still exists and has valid permissions
 * Used by client-side session monitoring
 */
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { userId } = await req.json();
    
    if (!userId) {
      return NextResponse.json({ error: "User ID required" }, { status: 400 });
    }

    // Verify user still exists in database
    const user = await db.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        role: true,
        updatedAt: true
      }
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check if user data has changed since session creation
    const sessionUser = session.user as any;
    const hasChanges = 
      user.role !== sessionUser.role ||
      user.email !== sessionUser.email;

    return NextResponse.json({
      valid: true,
      user: {
        id: user.id,
        email: user.email,
        role: user.role
      },
      hasChanges,
      updatedAt: user.updatedAt
    });

  } catch (error: any) {
    console.error("Session validation error:", error);
    return NextResponse.json(
      { error: error.message || "Validation failed" },
      { status: 500 }
    );
  }
}