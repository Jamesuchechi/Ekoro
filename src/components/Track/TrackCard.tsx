"use client";

import React from "react";
import Image from "next/image";
import { Play, Pause, Heart } from "lucide-react";
import { Track } from "@/types";
import { usePlayerStore } from "@/stores/playerStore";

import AddToPlaylistDropdown from "../Playlist/AddToPlaylistDropdown";

interface TrackCardProps {
  track: Track;
}

export default function TrackCard({ track }: TrackCardProps) {
  const { currentTrack, isPlaying, setTrack, togglePlay, likedTracks, toggleLikeTrack } =
    usePlayerStore();

  const isCurrentTrack = currentTrack?.id === track.id;
  const isLiked = likedTracks.includes(track.id);

  const handleCardClick = () => {
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
      onClick={handleCardClick}
      className="group relative bg-ekoro-dark-paper border border-white/5 hover:border-white/15 rounded-xl p-3 cursor-pointer transition-all hover:shadow-lg hover:shadow-black/20"
    >
      <div
        className="aspect-square w-full rounded-lg bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center text-4xl shadow-inner relative overflow-hidden"
      >
        {track.cover || track.coverArtUrl ? (
          <Image
            src={(track.cover || track.coverArtUrl)!}
            alt={track.title}
            width={300}
            height={300}
            unoptimized
            className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <span className="transform group-hover:scale-110 transition-transform duration-300">
            {track.emoji || "🎵"}
          </span>
        )}

        {/* Play overlay button on hover */}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <div className="w-12 h-12 bg-ekoro-green text-white rounded-full flex items-center justify-center shadow-lg transform translate-y-3 group-hover:translate-y-0 transition-all duration-300">
            {isCurrentTrack && isPlaying ? (
              <Pause className="w-5 h-5 fill-current" />
            ) : (
              <Play className="w-5 h-5 fill-current ml-0.5" />
            )}
          </div>
        </div>
      </div>

      <div className="mt-3">
        <h4 className="font-semibold text-sm truncate">{track.title}</h4>
        <p className="text-xs text-white/50 truncate mt-0.5">{track.artist}</p>
        <div className="flex items-center justify-between mt-3">
          <span className="text-3xs font-medium text-white/40 flex items-center gap-1">
            <Play className="w-2.5 h-2.5 fill-current" /> {track.plays}
          </span>
          <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
            <span className="text-4xs px-2 py-0.5 bg-white/5 border border-white/10 rounded-full font-bold text-white/60">
              {track.genre}
            </span>
            <button
              onClick={handleLikeClick}
              className={`hover:scale-110 transition-transform ${
                isLiked ? "text-red-500" : "text-white/40 hover:text-white"
              }`}
            >
              <Heart className="w-3.5 h-3.5 fill-current" />
            </button>
            <AddToPlaylistDropdown trackId={track.id} />
          </div>
        </div>
      </div>
    </div>
  );
}
