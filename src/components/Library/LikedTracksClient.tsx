"use client";

import React, { useState } from "react";
import { Heart, Music, Play, Pause } from "lucide-react";
import TrackRow from "@/components/Track/TrackRow";
import { usePlayerStore } from "@/stores/playerStore";

interface LikedTracksClientProps {
  initialTracks: any[];
  totalCount: number;
}

export default function LikedTracksClient({
  initialTracks,
  totalCount,
}: LikedTracksClientProps) {
  const { currentTrack, isPlaying, setTrack, togglePlay } = usePlayerStore();
  const [tracks, setTracks] = useState(initialTracks);

  // Helper to map DB Track to frontend Player Store Track type
  const mapToFrontendTrack = (t: any) => {
    const artistName = t.artist?.displayName || t.artist?.username || "Unknown Artist";
    const coverUrl = t.coverArtUrl
      ? t.coverArtUrl.startsWith("http") || t.coverArtUrl.startsWith("/")
        ? t.coverArtUrl
        : `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/tracks/${t.coverArtUrl}`
      : "/images/default-cover.jpg";

    const totSec = Math.floor((t.durationMs || 0) / 1000);
    const mins = Math.floor(totSec / 60);
    const secs = totSec % 60;
    const durStr = `${mins}:${secs.toString().padStart(2, "0")}`;

    const playCountNum = parseInt(t.playCount || "0", 10);
    let playsStr = `${playCountNum}`;
    if (playCountNum >= 1000000) playsStr = `${(playCountNum / 1000000).toFixed(1)}M`;
    else if (playCountNum >= 1000) playsStr = `${(playCountNum / 1000).toFixed(1)}K`;

    return {
      id: t.id,
      title: t.title,
      artist: artistName,
      duration: durStr,
      cover: coverUrl,
      plays: playsStr,
      genre: t.genre || "Alternative",
      color: "from-blue-600 to-indigo-900",
      emoji: "🔥",
    };
  };

  const frontendTracks = tracks.map(mapToFrontendTrack);

  const handlePlayAll = () => {
    if (frontendTracks.length > 0) {
      const isCurrentInList = frontendTracks.some((t) => t.id === currentTrack?.id);
      if (isCurrentInList) {
        togglePlay();
      } else {
        setTrack(frontendTracks[0]);
      }
    }
  };

  const isAnyPlaying = frontendTracks.some((t) => t.id === currentTrack?.id) && isPlaying;

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-8 animate-page relative">
      {/* Decorative Red Glow for Liked Section */}
      <div className="absolute -top-24 -left-24 w-80 h-80 rounded-full bg-red-500/5 blur-3xl pointer-events-none z-0" />

      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-6 relative z-10">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Heart size={24} className="text-red-500 fill-current" />
            <h1 className="text-2xl font-bold tracking-tight text-white">Liked Tracks</h1>
          </div>
          <p className="text-xs text-ek-text-secondary">
            Your personal collection of favorite tracks, synced across your devices.
          </p>
        </div>
        
        {frontendTracks.length > 0 && (
          <button
            onClick={handlePlayAll}
            className="flex items-center justify-center gap-2 px-5 py-2.5 bg-ek-gold hover:bg-ek-gold/90 text-ek-void rounded-xl text-xs font-bold transition-all active:scale-[0.97] shadow-lg shadow-ek-gold/10"
          >
            {isAnyPlaying ? <Pause size={14} fill="currentColor" /> : <Play size={14} fill="currentColor" />}
            <span>{isAnyPlaying ? "Pause Selection" : "Play All Favorites"}</span>
          </button>
        )}
      </div>

      {/* Content */}
      <div className="relative z-10">
        {frontendTracks.length === 0 ? (
          <div className="bg-white/5 border border-white/10 rounded-2xl p-16 text-center text-ek-text-secondary text-sm space-y-4 max-w-xl mx-auto mt-8">
            <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center mx-auto text-red-500">
              <Heart size={22} />
            </div>
            <div className="space-y-1">
              <p className="font-semibold text-white">No liked tracks yet</p>
              <p className="text-xs">Songs you like will appear here for easy listening.</p>
            </div>
          </div>
        ) : (
          <div className="bg-ekoro-dark-paper border border-white/5 rounded-2xl p-4 md:p-6 space-y-2">
            <div className="text-4xs font-mono uppercase tracking-wider text-white/30 px-2 pb-2 border-b border-white/5 flex items-center justify-between">
              <span>Track Details</span>
              <span className="mr-24">Stats</span>
            </div>
            <div className="space-y-1 pt-2">
              {frontendTracks.map((track, index) => (
                <TrackRow key={track.id} track={track} index={index} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
