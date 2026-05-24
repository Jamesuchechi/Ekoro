import React from "react";
import { prisma } from "@/lib/prisma";
import { SearchService } from "@/services/SearchService";
import ExploreClient from "./ExploreClient";
import { Track } from "@/types";

interface PageProps {
  searchParams: {
    q?: string;
    genre?: string;
  };
}

function mapPrismaTrackToTrack(t: any, index: number): Track {
  const artistName = t.artist?.displayName || t.artist?.username || "Unknown Artist";
  
  const playsNum = Number(t.playCount || 0);
  let playsStr = `${playsNum}`;
  if (playsNum >= 1000000) playsStr = `${(playsNum / 1000000).toFixed(1)}M`;
  else if (playsNum >= 1000) playsStr = `${(playsNum / 1000).toFixed(1)}K`;

  const totalSeconds = Math.floor((t.durationMs || 0) / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  const durationStr = `${minutes}:${seconds.toString().padStart(2, "0")}`;

  let coverUrl = "";
  if (t.coverArtUrl) {
    if (t.coverArtUrl.startsWith("http") || t.coverArtUrl.startsWith("/")) {
      coverUrl = t.coverArtUrl;
    } else {
      coverUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/covers/${t.coverArtUrl}`;
    }
  }

  const COLORS = [
    "from-blue-600 to-indigo-900",
    "from-amber-600 to-orange-900",
    "from-emerald-600 to-teal-900",
    "from-purple-600 to-fuchsia-900",
    "from-rose-600 to-red-900",
    "from-cyan-600 to-sky-900",
  ];
  const EMOJIS = ["🔥", "⚡", "🌟", "🎸", "🌊", "✨"];

  return {
    id: t.id,
    title: t.title,
    artist: artistName,
    duration: durationStr,
    cover: coverUrl || "/images/default-album.png",
    plays: playsStr,
    genre: t.genre || "Alternative",
    color: COLORS[index % COLORS.length],
    emoji: EMOJIS[index % EMOJIS.length],
  };
}

export default async function ExplorePage({ searchParams }: PageProps) {
  const query = searchParams.q || "";
  const genre = searchParams.genre || "";

  let searchResults = null;
  let genreTracks: Track[] = [];
  let trendingTracks: Track[] = [];

  // Case 1: Search Query Present
  if (query) {
    const rawResults = await SearchService.search(query);
    
    // Map tracks results to match the frontend Track interface
    const mappedTracks = rawResults.tracks.map((t: any, index: number) => ({
      id: t.id,
      title: t.title,
      artist: t.artist,
      duration: t.duration,
      cover: t.cover,
      plays: t.plays || "0",
    }));

    searchResults = {
      artists: rawResults.artists,
      albums: rawResults.albums,
      tracks: mappedTracks,
      playlists: rawResults.playlists,
    };
  }
  // Case 2: Genre Filter Present
  else if (genre) {
    const rawGenreTracks = await prisma.track.findMany({
      where: {
        status: "published",
        genre: {
          equals: genre,
          mode: "insensitive",
        },
      },
      include: {
        artist: {
          select: {
            id: true,
            username: true,
            displayName: true,
          },
        },
      },
      orderBy: {
        playCount: "desc",
      },
    });

    genreTracks = rawGenreTracks.map((t: any, i: number) => mapPrismaTrackToTrack(t, i));
  }
  // Case 3: Default Explore State
  else {
    const rawTrendingTracks = await prisma.track.findMany({
      where: {
        status: "published",
      },
      include: {
        artist: {
          select: {
            id: true,
            username: true,
            displayName: true,
          },
        },
      },
      orderBy: {
        playCount: "desc",
      },
      take: 8,
    });

    trendingTracks = rawTrendingTracks.map((t: any, i: number) => mapPrismaTrackToTrack(t, i));
  }

  return (
    <ExploreClient
      initialQuery={query}
      selectedGenre={genre}
      searchResults={searchResults}
      genreTracks={genreTracks}
      trendingTracks={trendingTracks}
    />
  );
}
