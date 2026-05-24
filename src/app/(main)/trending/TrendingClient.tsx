"use client";

import React from "react";
import { Play, Flame, Trophy, Music } from "lucide-react";
import { Track } from "@/types";
import { usePlayerStore } from "@/stores/playerStore";
import TrackRow from "@/components/Track/TrackRow";

interface TrendingClientProps {
  trendingTracks: Track[];
}

export default function TrendingClient({ trendingTracks }: TrendingClientProps) {
  const { setQueue } = usePlayerStore();

  const handlePlayChart = () => {
    if (trendingTracks.length > 0) {
      setQueue(trendingTracks, 0);
    }
  };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-8 animate-page">
      {/* Header Promo Area */}
      <div className="relative overflow-hidden bg-gradient-to-r from-amber-600/30 via-ekoro-gold/15 to-transparent border border-white/5 rounded-3xl p-8 md:p-12 flex flex-col md:flex-row items-center justify-between gap-8">
        <div className="absolute -left-16 -top-16 w-48 h-48 bg-ekoro-gold/15 rounded-full blur-3xl" />
        
        <div className="space-y-4 text-center md:text-left relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-ekoro-gold/10 border border-ekoro-gold/30 rounded-full text-ekoro-gold font-bold text-xs uppercase tracking-wider">
            <Trophy className="w-3.5 h-3.5" />
            <span>Ekoro Charts</span>
          </div>
          
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-white font-display">
            Trending Top 50
          </h1>
          <p className="text-sm md:text-base text-white/60 max-w-xl leading-relaxed">
            The most popular and played tracks across the Ekoro network right now, updated in real time.
          </p>
          
          <div className="pt-2">
            <button
              onClick={handlePlayChart}
              disabled={trendingTracks.length === 0}
              className="bg-ekoro-gold hover:bg-ekoro-gold/90 disabled:opacity-50 text-black text-sm font-bold py-3 px-8 rounded-full shadow-lg shadow-ekoro-gold/10 hover:shadow-ekoro-gold/20 hover:scale-102 active:scale-98 transition-all flex items-center justify-center gap-2 mx-auto md:mx-0"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>Play Full Chart</span>
            </button>
          </div>
        </div>

        {/* Big Graphic / Badge */}
        <div className="w-36 h-36 md:w-44 md:h-44 rounded-2xl bg-gradient-to-br from-ekoro-gold via-amber-500 to-red-600 flex items-center justify-center text-5xl md:text-6xl shadow-xl shadow-black/40 border border-white/10 relative z-10 select-none">
          🔥
        </div>
      </div>

      {/* Main Track List Container */}
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b border-white/5 pb-3">
          <div className="flex items-center gap-2">
            <Flame className="w-5 h-5 text-ekoro-gold" />
            <h3 className="font-bold text-lg text-white">Top Tracks</h3>
          </div>
          <span className="text-xs text-white/40">{trendingTracks.length} tracks listed</span>
        </div>

        {trendingTracks.length > 0 ? (
          <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-4 divide-y divide-white/5 space-y-1">
            {trendingTracks.map((track, index) => (
              <div key={track.id} className={index > 0 ? "pt-2" : ""}>
                <TrackRow track={track} index={index} />
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-24 text-center space-y-4 bg-white/5 rounded-3xl border border-white/5">
            <Music className="w-12 h-12 text-white/20" />
            <div>
              <h3 className="text-lg font-semibold text-white/80">No tracks trending yet</h3>
              <p className="text-sm text-white/40 max-w-xs mt-1">
                Listen to tracks and check back later as the platform activity updates!
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
