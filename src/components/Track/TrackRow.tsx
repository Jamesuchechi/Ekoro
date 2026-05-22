"use client";

import React from "react";
import { Heart } from "lucide-react";
import { Track } from "@/types";
import { usePlayerStore } from "@/stores/playerStore";

interface TrackRowProps {
  track: Track;
  index: number;
}

export default function TrackRow({ track, index }: TrackRowProps) {
  const { currentTrack, isPlaying, setTrack, togglePlay, likedTracks, toggleLikeTrack } =
    usePlayerStore();

  const isCurrentTrack = currentTrack?.id === track.id;
  const isLiked = likedTracks.includes(track.id);

  const handleRowClick = () => {
    if (isCurrentTrack) {
      togglePlay();
    } else {
      setTrack(track);
    }
  };

  const handleLikeClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleLikeTrack(track.id);
  };

  return (
    <div
      onClick={handleRowClick}
      className="flex items-center gap-4 p-2 hover:bg-white/5 rounded-lg cursor-pointer transition-colors group"
    >
      <span
        className={`text-sm font-bold min-w-5 text-center ${
          index < 2 ? "text-ekoro-gold" : "text-white/40"
        }`}
      >
        {index + 1}
      </span>
      <div
        className={`w-10 h-10 rounded-md bg-gradient-to-br ${track.color} flex items-center justify-center text-lg flex-shrink-0`}
      >
        {track.emoji}
      </div>
      <div className="flex-1 min-w-0">
        <h4 className="font-semibold text-sm truncate group-hover:text-ekoro-gold transition-colors">
          {track.title}
        </h4>
        <p className="text-xs text-white/50 truncate">{track.artist}</p>
      </div>
      <div className="text-right">
        <span className="text-xs font-semibold">{track.plays}</span>
        <p className="text-3xs text-ekoro-green font-bold flex items-center gap-0.5 justify-end mt-0.5">
          ▲ +12%
        </p>
      </div>
      <button
        onClick={handleLikeClick}
        className={`hover:scale-115 transition-transform ml-2 ${
          isLiked ? "text-red-500" : "text-white/40 hover:text-white"
        }`}
      >
        <Heart className="w-3.5 h-3.5 fill-current" />
      </button>
    </div>
  );
}
