/**
 * Session Invalidation Service
 * Manages immediate session refresh when user data changes
 */

interface UserSessionData {
  id: string;
  email: string;
  role: string;
  updatedAt: Date;
}

// In-memory store for tracking user updates (in production, use Redis or similar)
const userUpdates = new Map<string, Date>();

export const sessionService = {
  /**
   * Mark a user's session for invalidation
   */
  invalidateUserSession(userId: string) {
    userUpdates.set(userId, new Date());
  },

  /**
   * Check if user session needs refresh
   */
  shouldRefreshSession(userId: string, lastSessionUpdate?: Date): boolean {
    const userLastUpdate = userUpdates.get(userId);
    if (!userLastUpdate || !lastSessionUpdate) return false;
    
    return userLastUpdate > lastSessionUpdate;
  },

  /**
   * Clear user update tracking (after session refresh)
   */
  clearUserUpdate(userId: string) {
    userUpdates.delete(userId);
  },

  /**
   * Get all users that need session refresh
   */
  getUsersNeedingRefresh(): string[] {
    return Array.from(userUpdates.keys());
  },

  /**
   * Broadcast session invalidation (for real-time updates)
   * In production, this could use WebSockets, Server-Sent Events, or similar
   */
  broadcastUserChange(userId: string, changeType: 'role' | 'delete' | 'create' | 'password') {
    // Mark for invalidation
    this.invalidateUserSession(userId);
    
    // In a real app, you might broadcast this via WebSocket
    console.log(`Session invalidation triggered for user ${userId}: ${changeType}`);
  }
};