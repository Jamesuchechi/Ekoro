import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionProfile } from "@/lib/auth-helpers";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

const supabaseAdmin = createSupabaseClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * GET /api/tracks/[id]/stream
 * Restricts access to high-quality streaming (HLS) based on subscription tier.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    // 1. Fetch track details
    const track = await prisma.track.findUnique({
      where: { id },
    });

    if (!track) {
      return NextResponse.json({ error: "Track not found" }, { status: 404 });
    }

    if (track.status === "removed") {
      return NextResponse.json({ error: "Track has been removed" }, { status: 410 });
    }

    // 2. Fetch authenticated user profile
    const profile = await getSessionProfile();

    // Owner artist or admin can stream unconditionally
    const isOwnerOrAdmin = profile && (track.artistId === profile.id || profile.role === "admin");

    if (track.status !== "published" && !isOwnerOrAdmin) {
      return NextResponse.json({ error: "Track is not published" }, { status: 403 });
    }

    // 3. Quality tier validation
    const premiumPlans = ["pro", "artist_pro", "admin"];
    const hasPremiumAccess = isOwnerOrAdmin || (profile && premiumPlans.includes(profile.plan));

    if (!hasPremiumAccess) {
      // Free users get the standard 128kbps MP3 stream (public path)
      const { data } = supabaseAdmin.storage
        .from("streams")
        .getPublicUrl(`tracks/${id}/128k.mp3`);

      return NextResponse.json({
        type: "standard_128k",
        streamUrl: data.publicUrl,
        quality: "128kbps MP3",
        message: "Upgrade to Ekoro Pro to stream in lossless/adaptive HLS format.",
      });
    }

    // Premium/Pro users get the signed adaptive HLS playlist
    const { data: signedData, error: signError } = await supabaseAdmin.storage
      .from("streams")
      .createSignedUrl(`tracks/${id}/hls/playlist.m3u8`, 7200); // Valid for 2 hours

    if (signError || !signedData?.signedUrl) {
      throw new Error(`Failed to generate signed HLS playlist: ${signError?.message || "No URL"}`);
    }

    return NextResponse.json({
      type: "hls_adaptive",
      streamUrl: signedData.signedUrl,
      quality: "Lossless HLS Adaptive",
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to retrieve audio stream" },
      { status: 500 }
    );
  }
}
