import React from "react";
import { redirect } from "next/navigation";
import { getSessionProfile } from "@/lib/auth-helpers";
import { getUserLikedTracks } from "@/app/actions/likes";
import LikedTracksClient from "@/components/Library/LikedTracksClient";

export const dynamic = "force-dynamic";

export default async function LikedTracksPage() {
  const currentUser = await getSessionProfile();

  if (!currentUser) {
    redirect("/login");
  }

  // Fetch first page of liked tracks
  const { tracks, total } = await getUserLikedTracks(1, 50);

  // Serialize any BigInt or Date types
  const serializedTracks = tracks.map((track) => ({
    id: track.id,
    title: track.title,
    slug: track.slug,
    description: track.description,
    coverArtUrl: track.coverArtUrl,
    durationMs: track.durationMs,
    genre: track.genre,
    mood: track.mood,
    bpm: track.bpm,
    releaseDate: track.releaseDate ? track.releaseDate.toISOString() : null,
    isDownloadable: track.isDownloadable,
    downloadPrice: track.downloadPrice ? track.downloadPrice.toString() : null,
    playCount: track.playCount.toString(),
    downloadCount: track.downloadCount.toString(),
    artist: {
      id: track.artist.id,
      username: track.artist.username,
      displayName: track.artist.displayName,
      avatarUrl: track.artist.avatarUrl,
    },
  }));

  return (
    <LikedTracksClient
      initialTracks={serializedTracks}
      totalCount={total}
    />
  );
}
