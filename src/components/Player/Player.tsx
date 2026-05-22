"use client";

import React, { useEffect } from "react";
import { Play, Pause, Heart, SkipBack, SkipForward, Volume2 } from "lucide-react";
import { usePlayerStore } from "@/stores/playerStore";

export default function Player() {
  const {
    currentTrack,
    isPlaying,
    volume,
    progress,
    currentTime,
    likedTracks,
    togglePlay,
    setIsPlaying,
    setVolume,
    setProgress,
    setCurrentTime,
    toggleLikeTrack,
  } = usePlayerStore();

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPlaying) {
      interval = setInterval(() => {
        if (progress >= 100) {
          setIsPlaying(false);
          setProgress(0);
        } else {
          setProgress(progress + 0.5);
        }
        setCurrentTime(currentTime + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isPlaying, progress, currentTime, setCurrentTime, setProgress, setIsPlaying]);

  if (!currentTrack) return null;

  const formatTime = (secs: number) => {
    const minutes = Math.floor(secs / 60);
    const seconds = Math.floor(secs % 60);
    return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
  };

  return (
    <footer className="fixed bottom-0 inset-x-0 bg-ekoro-dark-paper border-t border-white/10 h-20 px-6 flex items-center justify-between z-50 shadow-2xl">
      <div className="flex items-center gap-3.5 min-w-0 max-w-xs">
        <div
          className={`w-11 h-11 rounded-lg bg-gradient-to-br ${currentTrack.color} flex items-center justify-center text-xl flex-shrink-0`}
        >
          {currentTrack.emoji}
        </div>
        <div className="min-w-0">
          <h5 className="text-sm font-semibold truncate text-white">{currentTrack.title}</h5>
          <p className="text-xs text-white/50 truncate mt-0.5">{currentTrack.artist}</p>
        </div>
        <button
          onClick={() => toggleLikeTrack(currentTrack.id)}
          className={`hover:scale-115 transition-transform flex-shrink-0 ${
            likedTracks.includes(currentTrack.id) ? "text-red-500" : "text-white/40 hover:text-white"
          }`}
        >
          <Heart className="w-4 h-4 fill-current" />
        </button>
      </div>

      {/* PLAYER CONTROLS */}
      <div className="flex flex-col items-center gap-1.5 flex-1 max-w-xl px-4">
        <div className="flex items-center gap-6">
          <button className="text-white/50 hover:text-white transition-colors">
            <SkipBack className="w-4 h-4 fill-current" />
          </button>
          <button
            onClick={togglePlay}
            className="w-8 h-8 rounded-full bg-white text-ekoro-blue-dark flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-sm"
          >
            {isPlaying ? (
              <Pause className="w-4 h-4 fill-current text-ekoro-blue-dark" />
            ) : (
              <Play className="w-4 h-4 fill-current text-ekoro-blue-dark ml-0.5" />
            )}
          </button>
          <button className="text-white/50 hover:text-white transition-colors">
            <SkipForward className="w-4 h-4 fill-current" />
          </button>
        </div>

        <div className="flex items-center gap-3 w-full">
          <span className="text-4xs font-medium text-white/40 min-w-6 text-right">
            {formatTime(currentTime)}
          </span>
          <div className="flex-1 h-1 bg-white/10 rounded-full relative cursor-pointer group">
            <div
              className="absolute inset-y-0 left-0 bg-ekoro-gold rounded-full group-hover:bg-ekoro-gold/90"
              style={{ width: `${progress}%` }}
            />
            <div
              className="absolute w-2.5 h-2.5 bg-ekoro-gold rounded-full top-1/2 -translate-y-1/2 shadow opacity-0 group-hover:opacity-100 transition-opacity"
              style={{ left: `${progress}%`, transform: "translate(-50%, -50%)" }}
            />
          </div>
          <span className="text-4xs font-medium text-white/40 min-w-6">
            {currentTrack.duration}
          </span>
        </div>
      </div>

      {/* VOLUME AND EXTRA UTILITIES */}
      <div className="hidden sm:flex items-center gap-3.5 min-w-xs justify-end">
        <Volume2 className="w-4 h-4 text-white/50" />
        <input
          type="range"
          min="0"
          max="100"
          value={volume}
          onChange={(e) => setVolume(Number(e.target.value))}
          className="w-20 h-1 bg-white/10 accent-ekoro-gold rounded-full cursor-pointer hover:bg-white/15"
        />
      </div>
    </footer>
  );
}
