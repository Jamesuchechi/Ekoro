"use server";

import { prisma } from "@/lib/prisma";
import { getSessionProfile } from "@/lib/auth-helpers";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { uploadToStorage, getPublicUrl } from "@/lib/storage-helpers";

const playlistSchema = z.object({
  title: z.string().min(1, "Title is required").max(100),
  description: z.string().max(300).optional().nullable(),
  isPublic: z.boolean().default(true),
  coverArtUrl: z.string().url().optional().nullable(),
});

/**
 * Server Action: Create a new playlist.
 */
export async function createPlaylist(data: {
  title: string;
  description?: string | null;
  isPublic?: boolean;
  coverArtUrl?: string | null;
}) {
  try {
    const profile = await getSessionProfile();
    if (!profile) throw new Error("UNAUTHENTICATED");

    const parsed = playlistSchema.parse({
      isPublic: true,
      ...data,
    });

    const playlist = await prisma.playlist.create({
      data: {
        userId: profile.id,
        title: parsed.title,
        description: parsed.description,
        isPublic: parsed.isPublic,
        coverArtUrl: parsed.coverArtUrl,
      },
    });

    revalidatePath("/dashboard/playlists");
    revalidatePath("/dashboard/library");
    return { success: true, data: playlist };
  } catch (error: any) {
    if (error.message === "UNAUTHENTICATED") {
      return { success: false, error: "Authentication required" };
    }
    return { success: false, error: error.message || "Failed to create playlist" };
  }
}

/**
 * Server Action: Update playlist details (title, description, isPublic, coverArtUrl).
 */
export async function updatePlaylist(
  playlistId: string,
  data: {
    title?: string;
    description?: string | null;
    isPublic?: boolean;
    coverArtUrl?: string | null;
  }
) {
  try {
    const profile = await getSessionProfile();
    if (!profile) throw new Error("UNAUTHENTICATED");

    const playlist = await prisma.playlist.findUnique({
      where: { id: playlistId },
    });
    if (!playlist) throw new Error("Playlist not found");
    if (playlist.userId !== profile.id) throw new Error("UNAUTHORIZED");

    const updated = await prisma.playlist.update({
      where: { id: playlistId },
      data: {
        title: data.title,
        description: data.description,
        isPublic: data.isPublic,
        coverArtUrl: data.coverArtUrl,
      },
    });

    revalidatePath("/dashboard/playlists");
    revalidatePath(`/dashboard/playlists/${playlistId}`);
    return { success: true, data: updated };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to update playlist" };
  }
}

/**
 * Server Action: Update playlist details via FormData (handles cover image file uploads).
 */
export async function updatePlaylistWithFile(playlistId: string, formData: FormData) {
  try {
    const profile = await getSessionProfile();
    if (!profile) throw new Error("UNAUTHENTICATED");

    const playlist = await prisma.playlist.findUnique({
      where: { id: playlistId },
    });
    if (!playlist) throw new Error("Playlist not found");
    if (playlist.userId !== profile.id) throw new Error("UNAUTHORIZED");

    const title = formData.get("title") as string;
    const description = formData.get("description") as string;
    const isPublic = formData.get("isPublic") === "true";
    const file = formData.get("cover") as File | null;

    let coverArtUrl = playlist.coverArtUrl;

    if (file && file.size > 0) {
      const buffer = Buffer.from(await file.arrayBuffer());
      const ext = file.name.split(".").pop() || "jpg";
      const key = `playlists/${playlistId}/${Date.now()}.${ext}`;
      
      await uploadToStorage("covers", key, buffer, file.type);
      coverArtUrl = getPublicUrl("covers", key);
    }

    const updated = await prisma.playlist.update({
      where: { id: playlistId },
      data: {
        title: title || playlist.title,
        description: description !== undefined ? description : playlist.description,
        isPublic: isPublic !== undefined ? isPublic : playlist.isPublic,
        coverArtUrl,
      },
    });

    revalidatePath("/dashboard/playlists");
    revalidatePath(`/dashboard/playlists/${playlistId}`);
    return { success: true, data: updated };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to update playlist details" };
  }
}

/**
 * Server Action: Delete a playlist.
 */
export async function deletePlaylist(playlistId: string) {
  try {
    const profile = await getSessionProfile();
    if (!profile) throw new Error("UNAUTHENTICATED");

    const playlist = await prisma.playlist.findUnique({
      where: { id: playlistId },
    });
    if (!playlist) throw new Error("Playlist not found");
    if (playlist.userId !== profile.id) throw new Error("UNAUTHORIZED");

    await prisma.playlist.delete({
      where: { id: playlistId },
    });

    revalidatePath("/dashboard/playlists");
    revalidatePath("/dashboard/library");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to delete playlist" };
  }
}

/**
 * Server Action: Add a track to a playlist.
 */
export async function addTrackToPlaylist(playlistId: string, trackId: string) {
  try {
    const profile = await getSessionProfile();
    if (!profile) throw new Error("UNAUTHENTICATED");

    const playlist = await prisma.playlist.findUnique({
      where: { id: playlistId },
    });
    if (!playlist) throw new Error("Playlist not found");
    if (playlist.userId !== profile.id) throw new Error("UNAUTHORIZED");

    // Check if track is already in the playlist
    const existing = await prisma.playlistTrack.findUnique({
      where: {
        playlistId_trackId: {
          playlistId,
          trackId,
        },
      },
    });
    if (existing) {
      return { success: false, error: "Track is already in this playlist" };
    }

    // Get the next track order value (append to the end)
    const lastTrack = await prisma.playlistTrack.findFirst({
      where: { playlistId },
      orderBy: { trackOrder: "desc" },
    });
    const order = lastTrack ? lastTrack.trackOrder + 1 : 0;

    const newTrack = await prisma.playlistTrack.create({
      data: {
        playlistId,
        trackId,
        trackOrder: order,
      },
    });

    revalidatePath(`/dashboard/playlists/${playlistId}`);
    return { success: true, data: newTrack };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to add track to playlist" };
  }
}

/**
 * Server Action: Remove a track from a playlist.
 */
export async function removeTrackFromPlaylist(playlistId: string, trackId: string) {
  try {
    const profile = await getSessionProfile();
    if (!profile) throw new Error("UNAUTHENTICATED");

    const playlist = await prisma.playlist.findUnique({
      where: { id: playlistId },
    });
    if (!playlist) throw new Error("Playlist not found");
    if (playlist.userId !== profile.id) throw new Error("UNAUTHORIZED");

    await prisma.playlistTrack.delete({
      where: {
        playlistId_trackId: {
          playlistId,
          trackId,
        },
      },
    });

    revalidatePath(`/dashboard/playlists/${playlistId}`);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to remove track from playlist" };
  }
}

/**
 * Server Action: Reorder tracks in a playlist.
 */
export async function reorderTracksInPlaylist(playlistId: string, trackIds: string[]) {
  try {
    const profile = await getSessionProfile();
    if (!profile) throw new Error("UNAUTHENTICATED");

    const playlist = await prisma.playlist.findUnique({
      where: { id: playlistId },
    });
    if (!playlist) throw new Error("Playlist not found");
    if (playlist.userId !== profile.id) throw new Error("UNAUTHORIZED");

    // Perform positional updates inside a database transaction
    await prisma.$transaction(
      trackIds.map((trackId, index) =>
        prisma.playlistTrack.update({
          where: {
            playlistId_trackId: {
              playlistId,
              trackId,
            },
          },
          data: {
            trackOrder: index,
          },
        })
      )
    );

    revalidatePath(`/dashboard/playlists/${playlistId}`);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to reorder playlist tracks" };
  }
}

/**
 * Server Action: Follow a public playlist.
 */
export async function followPlaylist(playlistId: string) {
  try {
    const profile = await getSessionProfile();
    if (!profile) throw new Error("UNAUTHENTICATED");

    const playlist = await prisma.playlist.findUnique({
      where: { id: playlistId },
    });
    if (!playlist) throw new Error("Playlist not found");
    
    // Users can follow other users' public playlists, or their own
    if (!playlist.isPublic && playlist.userId !== profile.id) {
      throw new Error("UNAUTHORIZED");
    }

    const existing = await prisma.playlistFollow.findUnique({
      where: {
        playlistId_userId: {
          playlistId,
          userId: profile.id,
        },
      },
    });
    if (existing) {
      return { success: true, message: "Already following playlist" };
    }

    await prisma.playlistFollow.create({
      data: {
        playlistId,
        userId: profile.id,
      },
    });

    revalidatePath(`/dashboard/playlists/${playlistId}`);
    revalidatePath("/dashboard/library");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to follow playlist" };
  }
}

/**
 * Server Action: Unfollow a public playlist.
 */
export async function unfollowPlaylist(playlistId: string) {
  try {
    const profile = await getSessionProfile();
    if (!profile) throw new Error("UNAUTHENTICATED");

    await prisma.playlistFollow.delete({
      where: {
        playlistId_userId: {
          playlistId,
          userId: profile.id,
        },
      },
    });

    revalidatePath(`/dashboard/playlists/${playlistId}`);
    revalidatePath("/dashboard/library");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to unfollow playlist" };
  }
}

/**
 * Server Action: Retrieve playlists created by the current user (used by dropdowns).
 */
export async function getUserPlaylistsAction() {
  try {
    const profile = await getSessionProfile();
    if (!profile) return { success: false, error: "Not authenticated" };
    
    const playlists = await prisma.playlist.findMany({
      where: { userId: profile.id },
      select: { id: true, title: true, isPublic: true },
      orderBy: { createdAt: "desc" },
    });
    
    return { success: true, data: playlists };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to load playlists" };
  }
}
