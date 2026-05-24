"use server";

import { prisma } from "@/lib/prisma";
import { getSessionProfile } from "@/lib/auth-helpers";
import { revalidatePath } from "next/cache";

/**
 * Like a track (insert into public.likes).
 */
export async function likeTrack(trackId: string) {
  try {
    const profile = await getSessionProfile();
    if (!profile) return { success: false, error: "Not authenticated" };

    await prisma.like.upsert({
      where: { userId_trackId: { userId: profile.id, trackId } },
      create: { userId: profile.id, trackId },
      update: {},
    });

    revalidatePath("/library/liked");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to like track" };
  }
}

/**
 * Unlike a track (delete from public.likes).
 */
export async function unlikeTrack(trackId: string) {
  try {
    const profile = await getSessionProfile();
    if (!profile) return { success: false, error: "Not authenticated" };

    await prisma.like.delete({
      where: { userId_trackId: { userId: profile.id, trackId } },
    });

    revalidatePath("/library/liked");
    return { success: true };
  } catch (error: any) {
    // Ignore "record not found" errors — already unliked
    if (error.code === "P2025") return { success: true };
    return { success: false, error: error.message || "Failed to unlike track" };
  }
}

/**
 * Get the set of track IDs liked by the current user.
 */
export async function getUserLikedTrackIds(): Promise<string[]> {
  try {
    const profile = await getSessionProfile();
    if (!profile) return [];

    const likes = await prisma.like.findMany({
      where: { userId: profile.id },
      select: { trackId: true },
    });

    return likes.map((l) => l.trackId);
  } catch {
    return [];
  }
}

/**
 * Get paginated liked tracks with full track data.
 */
export async function getUserLikedTracks(page: number = 1, limit: number = 20) {
  try {
    const profile = await getSessionProfile();
    if (!profile) return { tracks: [], total: 0, totalPages: 0, page };

    const skip = (page - 1) * limit;
    const [likes, total] = await Promise.all([
      prisma.like.findMany({
        where: { userId: profile.id },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
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
              _count: {
                select: { likes: true },
              },
            },
          },
        },
      }),
      prisma.like.count({ where: { userId: profile.id } }),
    ]);

    return {
      tracks: likes.map((l) => l.track),
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  } catch {
    return { tracks: [], total: 0, totalPages: 0, page };
  }
}

/**
 * Get the likes count for a specific track.
 */
export async function getTrackLikeCount(trackId: string): Promise<number> {
  try {
    return await prisma.like.count({ where: { trackId } });
  } catch {
    return 0;
  }
}
