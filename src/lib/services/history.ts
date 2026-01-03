import { db } from "@/lib/db";

/**
 * Handles FIFO (First-In-First-Out) logic for User History
 */
export const historyService = {
  /**
   * Updates recent series history (Max 5)
   */
  async trackSeries(userId: string, seriesId: string) {
    // 1. Check if already exists in history
    const existing = await db.recentSeries.findUnique({
      where: { userId_seriesId: { userId, seriesId } },
    });

    if (existing) {
      // Update timestamp to move to top
      return await db.recentSeries.update({
        where: { id: existing.id },
        data: { viewedAt: new Date() },
      });
    }

    // 2. Manage limit (Max 5)
    const count = await db.recentSeries.count({ where: { userId } });
    if (count >= 5) {
      const oldest = await db.recentSeries.findFirst({
        where: { userId },
        orderBy: { viewedAt: "asc" },
      });
      if (oldest) await db.recentSeries.delete({ where: { id: oldest.id } });
    }

    // 3. Create new entry
    return await db.recentSeries.create({
      data: { userId, seriesId },
    });
  },

  /**
   * Updates recent episode history (Max 10)
   */
  async trackEpisode(
    userId: string,
    episodeData: {
      episodeId: string;
      assetId: string;
      name: string;
    }
  ) {
    const { episodeId, assetId, name } = episodeData;

    const existing = await db.recentEpisode.findUnique({
      where: { userId_episodeId: { userId, episodeId } },
    });

    if (existing) {
      return await db.recentEpisode.update({
        where: { id: existing.id },
        data: { viewedAt: new Date() },
      });
    }

    const count = await db.recentEpisode.count({ where: { userId } });
    if (count >= 10) {
      const oldest = await db.recentEpisode.findFirst({
        where: { userId },
        orderBy: { viewedAt: "asc" },
      });
      if (oldest) await db.recentEpisode.delete({ where: { id: oldest.id } });
    }

    return await db.recentEpisode.create({
      data: { userId, episodeId, assetId, name },
    });
  },
};
