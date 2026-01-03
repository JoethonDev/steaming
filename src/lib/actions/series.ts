"use server";

import { db } from "@/lib/db";
import { watchitService } from "@/lib/services/watchit";
import { historyService } from "@/lib/services/history";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import type { UserHistoryResponse } from "@/types";

/**
 * Orchestrates fetching metadata from Watchit and syncing with local DB Catalog
 */
export async function analyzeSeries(seriesId: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user) throw new Error("Unauthorized");

  try {
    // 1. Fetch from Watchit API (Securely via server)
    const metadata = await watchitService.fetchSeriesMetadata(seriesId);

    // 2. Upsert into Global Catalog
    const series = await db.series.upsert({
      where: { id: seriesId },
      update: {
        name: metadata.name,
        description: metadata.description,
        posterUrl: metadata.poster_url || metadata.image_url,
      },
      create: {
        id: seriesId,
        name: metadata.name,
        description: metadata.description,
        posterUrl: metadata.poster_url || metadata.image_url,
      },
    });

    // 3. Add to User History (FIFO)
    await historyService.trackSeries((session.user as any).id, series.id);

    return series;
  } catch (error: any) {
    console.error("Analysis Error:", error);
    throw new Error(error.message || "Failed to analyze series");
  }
}

/**
 * Tracks an episode viewing in the DB
 */
export async function trackEpisodeView(episode: {
  episodeId: string;
  assetId: string;
  name: string;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return;

  await historyService.trackEpisode((session.user as any).id, episode);
}

/**
 * Gets user's viewing history including recent series and episodes
 */
export async function getUserHistory(): Promise<UserHistoryResponse> {
  const session = await getServerSession(authOptions);
  if (!session?.user) throw new Error("Unauthorized");

  try {
    const userId = (session.user as any).id;

    // Fetch recent series
    const recentSeries = await db.recentSeries.findMany({
      where: { userId },
      include: {
        series: true,
      },
      orderBy: { viewedAt: "desc" },
      take: 10,
    });

    // Fetch recent episodes
    const recentEpisodes = await db.recentEpisode.findMany({
      where: { userId },
      orderBy: { viewedAt: "desc" },
      take: 20,
    });

    return {
      recentSeries: recentSeries.map((item) => ({
        id: item.series.id,
        name: item.series.name,
        description: item.series.description,
        posterUrl: item.series.posterUrl,
        viewedAt: item.viewedAt,
      })),
      recentEpisodes: recentEpisodes.map((item) => ({
        id: item.episodeId,
        assetId: item.assetId,
        name: item.name,
        viewedAt: item.viewedAt,
      })),
      totalSeries: recentSeries.length,
      totalEpisodes: recentEpisodes.length,
    };
  } catch (error: any) {
    console.error("Get History Error:", error);
    throw new Error("Failed to fetch user history");
  }
}
