import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionProfile } from "@/lib/auth-helpers";

/**
 * GET /api/users/me/library
 * Fetches the logged-in user's music library collection.
 */
export async function GET() {
  try {
    const profile = await getSessionProfile();
    if (!profile) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    // 1. Fetch user's liked tracks
    const likes = await prisma.like.findMany({
      where: { userId: profile.id },
      include: {
        track: {
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
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // 2. Fetch user's created playlists
    const playlists = await prisma.playlist.findMany({
      where: { userId: profile.id },
      include: {
        _count: {
          select: {
            playlistTracks: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // 3. Fetch user's purchased tracks
    const purchases = await prisma.purchase.findMany({
      where: { userId: profile.id },
      include: {
        track: {
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
        },
      },
      orderBy: { purchasedAt: "desc" },
    });

    // Format BigInt fields to String for JSON safety
    const formattedLikes = likes.map((like) => ({
      ...like,
      track: {
        ...like.track,
        playCount: like.track.playCount.toString(),
        downloadCount: like.track.downloadCount.toString(),
      },
    }));

    const formattedPurchases = purchases.map((purchase) => ({
      ...purchase,
      track: {
        ...purchase.track,
        playCount: purchase.track.playCount.toString(),
        downloadCount: purchase.track.downloadCount.toString(),
      },
    }));

    return NextResponse.json({
      success: true,
      library: {
        likes: formattedLikes,
        playlists,
        purchases: formattedPurchases,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to retrieve user library" },
      { status: 500 }
    );
  }
}
