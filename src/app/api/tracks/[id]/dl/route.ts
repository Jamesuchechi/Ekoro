import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionProfile } from "@/lib/auth-helpers";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

// Init admin Supabase client to create signed URLs
const supabaseAdmin = createSupabaseClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * GET /api/tracks/[id]/dl
 * Enforces download permissions and returns a signed Supabase Storage URL.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    // 1. Fetch the track
    const track = await prisma.track.findUnique({
      where: { id },
    });

    if (!track) {
      return NextResponse.json({ error: "Track not found" }, { status: 404 });
    }

    // 2. Validate if downloadable
    if (!track.isDownloadable) {
      return NextResponse.json(
        { error: "This track is not configured for downloads." },
        { status: 400 }
      );
    }

    if (!track.key) {
      return NextResponse.json(
        { error: "Raw audio asset key is missing." },
        { status: 500 }
      );
    }

    // 3. Authenticate caller (required unless free)
    const profile = await getSessionProfile();

    // 4. Validate download permissions based on downloadType
    if (track.downloadType === "premium_only") {
      if (!profile) {
        return NextResponse.json(
          { error: "Authentication required to download premium tracks." },
          { status: 401 }
        );
      }
      
      const premiumPlans = ["pro", "artist_pro", "admin"];
      if (!premiumPlans.includes(profile.plan)) {
        return NextResponse.json(
          { error: "Pro subscription plan required to download this track." },
          { status: 403 }
        );
      }
    } else if (track.downloadType === "paid") {
      if (!profile) {
        return NextResponse.json(
          { error: "Authentication required to download paid tracks." },
          { status: 401 }
        );
      }

      // Owner/artist of the track doesn't need to purchase it
      if (track.artistId !== profile.id && profile.role !== "admin") {
        // Check for completed purchase record
        const purchase = await prisma.purchase.findFirst({
          where: {
            userId: profile.id,
            trackId: id,
          },
        });

        if (!purchase) {
          return NextResponse.json(
            { error: "Payment required. You must purchase this track before downloading." },
            { status: 402 }
          );
        }
      }
    }

    // 5. Generate signed URL for raw audio in private 'tracks' bucket (valid for 15 minutes)
    const { data, error: signedUrlError } = await supabaseAdmin.storage
      .from("tracks")
      .createSignedUrl(track.key, 900); // 15 minutes in seconds

    if (signedUrlError || !data?.signedUrl) {
      throw new Error(`Failed to generate signed download link: ${signedUrlError?.message || "No URL"}`);
    }

    // 6. Record download count in database
    await prisma.track.update({
      where: { id },
      data: {
        downloadCount: {
          increment: 1,
        },
      },
    });

    return NextResponse.json({
      downloadUrl: data.signedUrl,
      expiresIn: 900,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to process download request" },
      { status: 500 }
    );
  }
}
