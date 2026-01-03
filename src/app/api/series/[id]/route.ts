import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { watchitService } from "@/lib/services/watchit";
import { db } from "@/lib/db";
import { extractBestImageUrl } from "@/lib/utils/image";

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id: seriesId } = await params;

    // Fetch fresh metadata from Watchit first
    const freshData = await watchitService.fetchSeriesMetadata(seriesId);
    
    // Extract best image URL from fresh data
    const imageUrl = extractBestImageUrl(freshData.content_images) || freshData.poster_url || null;

    // Check if series exists in database
    let series = await db.series.findUnique({
      where: { id: seriesId },
    });

    if (!series) {
      // Create new series with image URL
      series = await db.series.create({
        data: {
          id: seriesId,
          name: freshData.name || "Unknown Series",
          description: freshData.description || null,
          posterUrl: imageUrl,
        },
      });
    } else {
      // Update existing series with fresh image URL
      series = await db.series.update({
        where: { id: seriesId },
        data: {
          name: freshData.name || series.name,
          description: freshData.description || series.description,
          posterUrl: imageUrl,
        },
      });
    }

    return NextResponse.json({
      series: {
        ...series,
        ...freshData, // Merge fresh data for seasons etc.
      },
    });
  } catch (error: any) {
    console.error("Series API Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch series" },
      { status: 500 }
    );
  }
}