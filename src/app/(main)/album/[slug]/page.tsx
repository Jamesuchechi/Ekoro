import React from "react";
import { notFound } from "next/navigation";
import { getSessionProfile } from "@/lib/auth-helpers";
import { AlbumService } from "@/services/AlbumService";
import AlbumDetailClient from "@/components/Album/AlbumDetailClient";

export const dynamic = "force-dynamic";

interface PageProps {
  params: {
    slug: string;
  };
}

/**
 * Generate dynamic SEO Metadata
 */
export async function generateMetadata({ params }: PageProps) {
  try {
    const album = await AlbumService.getAlbumBySlug(params.slug);

    if (!album) {
      return {
        title: "Album Not Found | Ekoro",
        description: "The requested album could not be found on Ekoro.",
      };
    }

    const artistName = album.artist.displayName || album.artist.username;
    return {
      title: `${album.title} by ${artistName} | Ekoro`,
      description: `Listen to and support ${artistName}'s album "${album.title}" on Ekoro. Direct fan-to-artist connection and lossless streams.`,
    };
  } catch (error) {
    return {
      title: "Ekoro Music",
    };
  }
}

export default async function AlbumPage({ params }: PageProps) {
  const { slug } = params;
  const currentUser = await getSessionProfile();

  // 1. Fetch Album details from DB
  const album = await AlbumService.getAlbumBySlug(slug);

  if (!album) {
    notFound();
  }

  // Serialize any Date/BigInt fields to prevent nextjs serialization warnings
  const serializedAlbum = {
    id: album.id,
    title: album.title,
    slug: album.slug,
    description: album.description,
    coverArtUrl: album.coverArtUrl,
    genre: album.genre,
    releaseDate: album.releaseDate ? album.releaseDate.toISOString() : null,
    albumType: album.albumType,
    artist: {
      id: album.artist.id,
      username: album.artist.username,
      displayName: album.artist.displayName,
      avatarUrl: album.artist.avatarUrl,
      bio: album.artist.bio,
    },
    albumTracks: album.albumTracks.map((at) => ({
      trackOrder: at.trackOrder,
      track: {
        id: at.track.id,
        title: at.track.title,
        slug: at.track.slug,
        description: at.track.description,
        coverArtUrl: at.track.coverArtUrl,
        durationMs: at.track.durationMs,
        genre: at.track.genre,
        mood: at.track.mood,
        bpm: at.track.bpm,
        isDownloadable: at.track.isDownloadable,
        downloadPrice: at.track.downloadPrice ? at.track.downloadPrice.toString() : null,
        playCount: at.track.playCount.toString(),
        downloadCount: at.track.downloadCount.toString(),
        artist: {
          id: at.track.artist.id,
          username: at.track.artist.username,
          displayName: at.track.artist.displayName,
          avatarUrl: at.track.artist.avatarUrl,
        },
      },
    })),
  };

  return (
    <AlbumDetailClient
      album={serializedAlbum}
      currentUser={currentUser}
    />
  );
}
