import { NextResponse } from "next/server";
import { watchitService } from "@/lib/services/watchit";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const keyword = searchParams.get("keyword");
  if (!keyword || keyword.trim().length < 1) {
    return NextResponse.json({ error: "Missing or invalid keyword" }, { status: 400 });
  }
  try {
    const data = await watchitService.searchSeries(keyword.trim());
    return NextResponse.json({ results: data.results || [] });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Search failed" }, { status: 500 });
  }
}
