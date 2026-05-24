import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionProfile } from "@/lib/auth-helpers";

/**
 * GET /api/users/me/tracks
 * Fetches the logged-in artist's own uploaded tracks with all statuses.
 */
export async function GET() {
  try {
    const profile = await getSessionProfile();
    if (!profile) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    if (profile.role !== "artist" && profile.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized. Artist role required." }, { status: 403 });
    }

    const tracks = await prisma.track.findMany({
      where: { artistId: profile.id },
      orderBy: { createdAt: "desc" },
      include: {
        artist: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true,
          },
        },
      },
    });

    // Format BigInt fields to String for JSON safety
    const formattedTracks = tracks.map((track) => ({
      ...track,
      playCount: track.playCount.toString(),
      downloadCount: track.downloadCount.toString(),
    }));

    return NextResponse.json({
      success: true,
      tracks: formattedTracks,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to retrieve artist tracks" },
      { status: 500 }
    );
  }
}
