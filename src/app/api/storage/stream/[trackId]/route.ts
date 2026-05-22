import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth-helpers";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { withApiRoute, ApiError } from "@/lib/api-helpers";

export const GET = withApiRoute(
  async (request: Request, { params }: { params: { trackId: string } }) => {
    const { trackId } = params;
    const { searchParams } = new URL(request.url);
    const format = searchParams.get("format") || "original"; // 'original', 'mp3', or 'hls'

    if (!trackId) {
      throw new ApiError(400, "BAD_REQUEST", "Track ID is required");
    }

    // 1. Fetch track details
    const track = await prisma.track.findUnique({
      where: { id: trackId },
    });

    if (!track) {
      throw new ApiError(404, "TRACK_NOT_FOUND", "Track not found");
    }

    // 2. Fetch authenticated user
    const user = await getSessionUser();
    const isArtist = user && user.id === track.artistId;

    // 3. Perform authorization checks
    if (track.status !== "published" && !isArtist) {
      throw new ApiError(403, "FORBIDDEN", "This track is not accessible");
    }

    // Verify purchase if it is a premium/paid track
    if (track.downloadType === "paid" && track.downloadPrice && Number(track.downloadPrice) > 0) {
      if (!isArtist) {
        if (!user) {
          throw new ApiError(401, "UNAUTHORIZED", "Authentication required to stream premium tracks");
        }

        const purchase = await prisma.purchase.findFirst({
          where: {
            userId: user.id,
            trackId: track.id,
          },
        });

        if (!purchase) {
          throw new ApiError(403, "PAYMENT_REQUIRED", "Purchase required to stream this track");
        }
      }
    }

    // 4. Resolve the target file path in storage
    let storagePath = "";
    if (format === "hls") {
      storagePath = track.hlsPlaylistUrl || "";
    } else {
      const audioFilesObj = track.audioFiles as Record<string, string> | null;
      storagePath = audioFilesObj?.[format] || audioFilesObj?.original || audioFilesObj?.mp3 || "";
    }

    if (!storagePath) {
      throw new ApiError(404, "AUDIO_FILE_NOT_FOUND", "Audio file asset not found for this track");
    }

    // Extract relative path from absolute public URL if stored as full URL
    if (storagePath.includes("/audio/")) {
      const parts = storagePath.split("/audio/");
      if (parts.length > 1) {
        storagePath = parts[1];
      }
    }

    // 5. Generate signed URL from Supabase Storage 'audio' bucket
    const supabase = createClient();
    const { data, error } = await supabase.storage
      .from("audio")
      .createSignedUrl(storagePath, 7200); // 2 hours validity

    if (error) {
      throw new ApiError(
        500,
        "STORAGE_ERROR",
        `Failed to generate stream URL: ${error.message}`
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        streamUrl: data.signedUrl,
      },
    });
  }
);
