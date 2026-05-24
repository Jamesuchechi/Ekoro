"use server";

import { AlbumService } from "@/services/AlbumService";
import { requireRole } from "@/lib/auth-helpers";
import { UserRole, AlbumType } from "@prisma/client";
import { revalidatePath } from "next/cache";

/**
 * Server action to create a new album.
 */
export async function createAlbumAction(data: {
  title: string;
  description?: string;
  genre?: string;
  coverArtUrl?: string;
  releaseDate?: Date;
  albumType?: AlbumType;
}) {
  try {
    const profile = await requireRole([UserRole.artist]);

    const album = await AlbumService.createAlbum({
      artistId: profile.id,
      title: data.title,
      description: data.description,
      genre: data.genre,
      coverArtUrl: data.coverArtUrl,
      releaseDate: data.releaseDate,
      albumType: data.albumType,
    });

    revalidatePath(`/artist/${profile.username}`);
    return { success: true, album };
  } catch (error: any) {
    console.error("Failed to create album:", error);
    return { success: false, error: error.message || "Failed to create album" };
  }
}

/**
 * Server action to update an album's metadata.
 */
export async function updateAlbumAction(
  albumId: string,
  data: {
    title?: string;
    description?: string;
    genre?: string;
    coverArtUrl?: string;
    releaseDate?: Date;
    albumType?: AlbumType;
  }
) {
  try {
    const profile = await requireRole([UserRole.artist]);

    const album = await AlbumService.updateAlbum(albumId, profile.id, data);

    revalidatePath(`/album/${album.slug}`);
    revalidatePath(`/artist/${profile.username}`);
    return { success: true, album };
  } catch (error: any) {
    console.error("Failed to update album:", error);
    return { success: false, error: error.message || "Failed to update album" };
  }
}

/**
 * Server action to add a track to an album.
 */
export async function addTrackToAlbumAction(albumId: string, trackId: string) {
  try {
    const profile = await requireRole([UserRole.artist]);

    const albumTrack = await AlbumService.addTrackToAlbum(albumId, profile.id, trackId);

    // Fetch album details to know the slug for path revalidation
    const album = await AlbumService.getAlbumDetails(albumId);
    if (album) {
      revalidatePath(`/album/${album.slug}`);
    }

    return { success: true, albumTrack };
  } catch (error: any) {
    console.error("Failed to add track to album:", error);
    return { success: false, error: error.message || "Failed to add track to album" };
  }
}

/**
 * Server action to remove a track from an album.
 */
export async function removeTrackFromAlbumAction(albumId: string, trackId: string) {
  try {
    const profile = await requireRole([UserRole.artist]);

    await AlbumService.removeTrackFromAlbum(albumId, profile.id, trackId);

    const album = await AlbumService.getAlbumDetails(albumId);
    if (album) {
      revalidatePath(`/album/${album.slug}`);
    }

    return { success: true };
  } catch (error: any) {
    console.error("Failed to remove track from album:", error);
    return { success: false, error: error.message || "Failed to remove track from album" };
  }
}
