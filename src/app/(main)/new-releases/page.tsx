import React from "react";
import { prisma } from "@/lib/prisma";
import { Track } from "@/types";
import NewReleasesClient from "./NewReleasesClient";

export const dynamic = "force-dynamic";

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

export default async function NewReleasesPage() {
  const rawNewTracks = await prisma.track.findMany({
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
      createdAt: "desc",
    },
    take: 40,
  });

  const newTracks = rawNewTracks.map((t: any, i: number) => mapPrismaTrackToTrack(t, i));

  return <NewReleasesClient newTracks={newTracks} />;
}
