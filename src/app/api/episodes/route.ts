import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { watchitService } from "@/lib/services/watchit";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const seriesId = searchParams.get("seriesId");
    const seasonId = searchParams.get("seasonId");

    if (!seriesId || !seasonId) {
      return NextResponse.json(
        { error: "seriesId and seasonId are required" },
        { status: 400 }
      );
    }

    const episodes = await watchitService.fetchEpisodes(seriesId, seasonId);

    return NextResponse.json(episodes);
  } catch (error: any) {
    console.error("Episodes API Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch episodes" },
      { status: 500 }
    );
  }
}