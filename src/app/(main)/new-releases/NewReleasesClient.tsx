"use client";

import React from "react";
import { Play, Sparkles, Music } from "lucide-react";
import { Track } from "@/types";
import { usePlayerStore } from "@/stores/playerStore";
import TrackCard from "@/components/Track/TrackCard";

interface NewReleasesClientProps {
  newTracks: Track[];
}

export default function NewReleasesClient({ newTracks }: NewReleasesClientProps) {
  const { setQueue } = usePlayerStore();

  const handlePlayAll = () => {
    if (newTracks.length > 0) {
      setQueue(newTracks, 0);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8 animate-page">
      {/* Header Promo Area */}
      <div className="relative overflow-hidden bg-gradient-to-r from-emerald-600/35 via-teal-900/10 to-transparent border border-white/5 rounded-3xl p-8 md:p-12 flex flex-col md:flex-row items-center justify-between gap-8">
        <div className="absolute -left-16 -top-16 w-48 h-48 bg-teal-500/15 rounded-full blur-3xl" />
        
        <div className="space-y-4 text-center md:text-left relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/10 border border-emerald-500/30 rounded-full text-emerald-400 font-bold text-xs uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Fresh Music</span>
          </div>
          
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-white font-display">
            New Releases
          </h1>
          <p className="text-sm md:text-base text-white/60 max-w-xl leading-relaxed">
            Listen to the latest and freshest sounds published by independent artists across the globe.
          </p>
          
          <div className="pt-2">
            <button
              onClick={handlePlayAll}
              disabled={newTracks.length === 0}
              className="bg-ekoro-gold hover:bg-ekoro-gold/90 disabled:opacity-50 text-black text-sm font-bold py-3 px-8 rounded-full shadow-lg shadow-ekoro-gold/10 hover:shadow-ekoro-gold/20 hover:scale-102 active:scale-98 transition-all flex items-center justify-center gap-2 mx-auto md:mx-0"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>Play All New Releases</span>
            </button>
          </div>
        </div>

        {/* Big Graphic / Badge */}
        <div className="w-36 h-36 md:w-44 md:h-44 rounded-2xl bg-gradient-to-br from-emerald-500 via-teal-500 to-indigo-600 flex items-center justify-center text-5xl md:text-6xl shadow-xl shadow-black/40 border border-white/10 relative z-10 select-none">
          ✨
        </div>
      </div>

      {/* Main Track Grid Container */}
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b border-white/5 pb-3">
          <h3 className="font-bold text-lg text-white">Latest Tracks</h3>
          <span className="text-xs text-white/40">{newTracks.length} tracks published</span>
        </div>

        {newTracks.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {newTracks.map((track) => (
              <TrackCard key={track.id} track={track} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-24 text-center space-y-4 bg-white/5 rounded-3xl border border-white/5">
            <Music className="w-12 h-12 text-white/20" />
            <div>
              <h3 className="text-lg font-semibold text-white/80">No new releases yet</h3>
              <p className="text-sm text-white/40 max-w-xs mt-1">
                New tracks will appear here once they are uploaded and processed successfully.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
