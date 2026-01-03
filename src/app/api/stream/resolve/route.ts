import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

/**
 * Secure Brightcove Resolver
 * Handshakes with Brightcove Edge API on the server to protect tokens.
 */
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { assetId } = await req.json();
    if (!assetId)
      return NextResponse.json({ error: "Asset ID required" }, { status: 400 });

    const accountId = "6057955906001";
    // This Policy Key (pk) is now hidden from the browser
    const policyKey =
      "BCpkADawqM0ulfr-fTtpl4YejzzO3z_76a_ZRKgvLDjHckfm-KQwPTJRIv8pznKIST7BMwBUYIVW-hySTUB5PQ8altdPHr9UcaQnGrs_ePsEEYoyoGhi3ezBsr3YRpLv9xqjzcBJBxVr_6Sh";

    const brightcoveUrl = `https://edge.api.brightcove.com/playback/v1/accounts/${accountId}/videos/ref%3A${assetId}`;

    const response = await fetch(brightcoveUrl, {
      headers: {
        accept: `application/json;pk=${policyKey}`,
        origin: "https://www.watchit.com",
      },
    });

    if (!response.ok) throw new Error(`Brightcove failed: ${response.status}`);

    const data = await response.json();
    const hlsSource = data.sources?.find(
      (s: any) => s.type === "application/x-mpegURL"
    );

    if (!hlsSource) throw new Error("No HLS manifest found");

    return NextResponse.json({
      url: hlsSource.src,
      description: data.description,
      poster: data.poster,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
