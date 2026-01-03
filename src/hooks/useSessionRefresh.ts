/**
 * Custom hook for monitoring and refreshing stale sessions
 * Automatically detects when user data has been changed by admin
 * and refreshes the session accordingly
 */

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useCallback } from "react";

export function useSessionRefresh() {
  const { data: session, update: updateSession, status } = useSession();
  const router = useRouter();

  /**
   * Check if current session needs refresh
   */
  const checkSessionFreshness = useCallback(async () => {
    if (!session || status !== "authenticated") return;

    // Check if session has been marked as needing refresh
    if ((session as any)._needsRefresh) {
      try {
        // Force session update with fresh data
        await updateSession();
        console.log("Session refreshed due to admin changes");
      } catch (error) {
        console.error("Failed to refresh session:", error);
        // If refresh fails, user might have been deleted - redirect to login
        router.push("/login");
      }
    }
  }, [session, updateSession, router, status]);

  /**
   * Monitor session freshness
   */
  useEffect(() => {
    if (status === "authenticated" && session) {
      // Check immediately
      checkSessionFreshness();

      // Set up periodic checks (every 30 seconds)
      const interval = setInterval(checkSessionFreshness, 30000);
      
      return () => clearInterval(interval);
    }
  }, [checkSessionFreshness, session, status]);

  /**
   * Manual session refresh function
   */
  const refreshSession = useCallback(async () => {
    if (status === "authenticated") {
      try {
        await updateSession();
        return true;
      } catch (error) {
        console.error("Manual session refresh failed:", error);
        return false;
      }
    }
    return false;
  }, [updateSession, status]);

  /**
   * Check if user still exists and has valid permissions
   */
  const validateUser = useCallback(async () => {
    if (!session?.user) return false;

    try {
      const response = await fetch('/api/auth/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: (session.user as any).id })
      });
      
      if (!response.ok) {
        // User might have been deleted or suspended
        router.push("/login");
        return false;
      }
      
      return true;
    } catch (error) {
      console.error("User validation failed:", error);
      return false;
    }
  }, [session, router]);

  return {
    session,
    status,
    refreshSession,
    validateUser,
    needsRefresh: (session as any)?._needsRefresh || false
  };
}