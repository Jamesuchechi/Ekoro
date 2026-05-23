"use client";

import React, { useEffect, useRef, useState } from "react";
import Image from "next/image";
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Heart,
  Volume2,
  VolumeX,
  Repeat,
  Shuffle,
  Download,
  ChevronUp,
  Maximize2,
} from "lucide-react";
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

  const [muted, setMuted] = useState(false);
  const [repeat, setRepeat] = useState(false);
  const [shuffle, setShuffle] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [seeking, setSeeking] = useState(false);
  const progressRef = useRef<HTMLDivElement>(null);
  const animRef = useRef<number>();
  const lastTickRef = useRef<number>(0);

  useEffect(() => {
    const tick = (now: number) => {
      if (!isPlaying) return;
      const delta = now - (lastTickRef.current || now);
      lastTickRef.current = now;
      if (!seeking) {
        setCurrentTime((prev) => prev + delta / 1000);
        setProgress((prev) => {
          const next = prev + (delta / 1000 / 210) * 100;
          if (next >= 100) {
            setIsPlaying(false);
            return 0;
          }
          return next;
        });
      }
      animRef.current = requestAnimationFrame(tick);
    };
    if (isPlaying) {
      animRef.current = requestAnimationFrame(tick);
    }
    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, [isPlaying, seeking]);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!progressRef.current) return;
    const rect = progressRef.current.getBoundingClientRect();
    const pct = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
    setProgress(pct);
    setCurrentTime((pct / 100) * 210);
  };

  const isLiked = currentTrack ? likedTracks.includes(currentTrack.id) : false;

  if (!currentTrack) return null;

  const totalDuration = 210;
  const remainingTime = totalDuration - currentTime;

  return (
    <footer
      style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 50,
        background: "rgba(8, 8, 8, 0.92)",
        backdropFilter: "blur(24px)",
        WebkitBackdropFilter: "blur(24px)",
        borderTop: "1px solid var(--ek-border-mid)",
        height: expanded ? 280 : 70,
        transition: "height 0.35s var(--ease-out-expo)",
        overflow: "hidden",
      }}
    >
      {/* Progress bar — full width at very top */}
      <div
        ref={progressRef}
        onClick={handleProgressClick}
        onMouseEnter={() => setSeeking(true)}
        onMouseLeave={() => setSeeking(false)}
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: seeking ? 4 : 2,
          cursor: "pointer",
          transition: "height 0.15s ease",
          background: "var(--ek-border)",
        }}
      >
        <div
          style={{
            height: "100%",
            width: `${progress}%`,
            background: "linear-gradient(90deg, var(--ek-gold), #e8c563)",
            transition: seeking ? "none" : "width 0.05s linear",
            position: "relative",
          }}
        >
          {seeking && (
            <div
              style={{
                position: "absolute",
                right: -5,
                top: "50%",
                transform: "translateY(-50%)",
                width: 10,
                height: 10,
                borderRadius: "50%",
                background: "var(--ek-gold)",
                boxShadow: "0 0 6px var(--ek-gold)",
              }}
            />
          )}
        </div>
      </div>

      {/* Main player row */}
      <div
        style={{
          height: 70,
          display: "flex",
          alignItems: "center",
          padding: "0 24px",
          gap: 0,
        }}
      >
        {/* Track info — left */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            width: 280,
            flexShrink: 0,
          }}
        >
          {/* Album art */}
          <div
            style={{
              width: 42,
              height: 42,
              borderRadius: 8,
              overflow: "hidden",
              flexShrink: 0,
              background: "var(--ek-surface)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 18,
              border: "1px solid var(--ek-border-mid)",
              position: "relative",
            }}
          >
            {currentTrack.cover ? (
              <Image
                src={currentTrack.cover}
                alt={currentTrack.title}
                fill
                unoptimized
                style={{ objectFit: "cover" }}
                sizes="42px"
              />
            ) : (
              <span>{currentTrack.emoji || "🎵"}</span>
            )}
            {/* Spin overlay when playing */}
            {isPlaying && (
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  borderRadius: 8,
                  border: "1.5px solid var(--ek-gold)44",
                  animation: "none",
                }}
              />
            )}
          </div>

          <div style={{ minWidth: 0, flex: 1 }}>
            <div
              style={{
                fontSize: 13,
                fontWeight: 500,
                color: "var(--ek-text-primary)",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
                letterSpacing: "-0.01em",
              }}
            >
              {currentTrack.title}
            </div>
            <div
              style={{
                fontSize: 11,
                color: "var(--ek-text-secondary)",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
                marginTop: 1,
              }}
            >
              {currentTrack.artist}
            </div>
          </div>

          {/* Like + download */}
          <div style={{ display: "flex", gap: 8, alignItems: "center", flexShrink: 0 }}>
            <button
              onClick={() => toggleLikeTrack(currentTrack.id)}
              style={{
                background: "none",
                border: "none",
                padding: 0,
                color: isLiked ? "var(--ek-red)" : "var(--ek-text-muted)",
                display: "flex",
                cursor: "pointer",
                transition: "color 0.2s, transform 0.15s",
                transform: isLiked ? "scale(1.1)" : "scale(1)",
              }}
            >
              <Heart size={15} fill={isLiked ? "currentColor" : "none"} />
            </button>
            <button
              style={{
                background: "none",
                border: "none",
                padding: 0,
                color: "var(--ek-text-muted)",
                display: "flex",
                cursor: "pointer",
              }}
            >
              <Download size={14} />
            </button>
          </div>
        </div>

        {/* Controls — center */}
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 8,
          }}
        >
          {/* Buttons */}
          <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
            <button
              onClick={() => setShuffle(!shuffle)}
              style={{
                background: "none",
                border: "none",
                padding: 0,
                color: shuffle ? "var(--ek-gold)" : "var(--ek-text-muted)",
                cursor: "pointer",
                display: "flex",
                transition: "color 0.2s",
              }}
            >
              <Shuffle size={14} />
            </button>
            <button
              style={{
                background: "none",
                border: "none",
                padding: 0,
                color: "var(--ek-text-secondary)",
                cursor: "pointer",
                display: "flex",
                transition: "color 0.2s",
              }}
              onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.color = "var(--ek-text-primary)")}
              onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.color = "var(--ek-text-secondary)")}
            >
              <SkipBack size={16} fill="currentColor" />
            </button>

            {/* Main play button */}
            <button
              onClick={togglePlay}
              style={{
                width: 38,
                height: 38,
                borderRadius: "50%",
                background: "var(--ek-text-primary)",
                border: "none",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "var(--ek-void)",
                cursor: "pointer",
                transition: "all 0.15s ease",
                flexShrink: 0,
              }}
              onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.background = "var(--ek-gold)")}
              onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.background = "var(--ek-text-primary)")}
            >
              {isPlaying ? (
                <Pause size={16} fill="currentColor" />
              ) : (
                <Play size={16} fill="currentColor" style={{ marginLeft: 2 }} />
              )}
            </button>

            <button
              style={{
                background: "none",
                border: "none",
                padding: 0,
                color: "var(--ek-text-secondary)",
                cursor: "pointer",
                display: "flex",
                transition: "color 0.2s",
              }}
              onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.color = "var(--ek-text-primary)")}
              onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.color = "var(--ek-text-secondary)")}
            >
              <SkipForward size={16} fill="currentColor" />
            </button>
            <button
              onClick={() => setRepeat(!repeat)}
              style={{
                background: "none",
                border: "none",
                padding: 0,
                color: repeat ? "var(--ek-gold)" : "var(--ek-text-muted)",
                cursor: "pointer",
                display: "flex",
                transition: "color 0.2s",
              }}
            >
              <Repeat size={14} />
            </button>
          </div>

          {/* Time row */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              width: "100%",
              maxWidth: 460,
            }}
          >
            <span
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: 10,
                color: "var(--ek-text-tertiary)",
                width: 30,
                textAlign: "right",
                flexShrink: 0,
              }}
            >
              {formatTime(currentTime)}
            </span>
            <div
              style={{
                flex: 1,
                height: 2,
                background: "var(--ek-border)",
                borderRadius: 99,
                position: "relative",
                cursor: "pointer",
              }}
            >
              <div
                style={{
                  height: "100%",
                  width: `${progress}%`,
                  background: "var(--ek-gold)",
                  borderRadius: 99,
                }}
              />
            </div>
            <span
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: 10,
                color: "var(--ek-text-tertiary)",
                width: 30,
                flexShrink: 0,
              }}
            >
              -{formatTime(remainingTime > 0 ? remainingTime : 0)}
            </span>
          </div>
        </div>

        {/* Right controls */}
        <div
          style={{
            width: 240,
            display: "flex",
            alignItems: "center",
            justifyContent: "flex-end",
            gap: 14,
            flexShrink: 0,
          }}
        >
          {/* Quality badge */}
          <div
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: 9,
              color: "var(--ek-gold)",
              background: "var(--ek-gold-dim)",
              border: "1px solid var(--ek-gold)33",
              padding: "3px 8px",
              borderRadius: 4,
              letterSpacing: "0.06em",
            }}
          >
            FLAC
          </div>

          {/* Volume */}
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <button
              onClick={() => setMuted(!muted)}
              style={{
                background: "none",
                border: "none",
                padding: 0,
                color: muted ? "var(--ek-text-muted)" : "var(--ek-text-secondary)",
                cursor: "pointer",
                display: "flex",
              }}
            >
              {muted ? <VolumeX size={14} /> : <Volume2 size={14} />}
            </button>
            <div
              style={{
                width: 72,
                height: 3,
                background: "var(--ek-border)",
                borderRadius: 99,
                cursor: "pointer",
                position: "relative",
              }}
              onClick={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const pct = Math.round(((e.clientX - rect.left) / rect.width) * 100);
                setVolume(pct);
                setMuted(false);
              }}
            >
              <div
                style={{
                  height: "100%",
                  width: `${muted ? 0 : volume}%`,
                  background: "var(--ek-text-secondary)",
                  borderRadius: 99,
                  transition: "width 0.1s ease",
                }}
              />
            </div>
          </div>

          {/* Expand */}
          <button
            onClick={() => setExpanded(!expanded)}
            style={{
              background: "none",
              border: "none",
              padding: 0,
              color: expanded ? "var(--ek-gold)" : "var(--ek-text-muted)",
              cursor: "pointer",
              display: "flex",
              transition: "color 0.2s",
            }}
          >
            {expanded ? <ChevronUp size={15} /> : <Maximize2 size={14} />}
          </button>
        </div>
      </div>

      {/* Expanded view */}
      {expanded && (
        <div
          style={{
            height: 210,
            display: "flex",
            alignItems: "center",
            padding: "0 32px",
            gap: 32,
            borderTop: "1px solid var(--ek-border)",
          }}
        >
          {/* Large art */}
          <div
            style={{
              width: 140,
              height: 140,
              borderRadius: 16,
              overflow: "hidden",
              flexShrink: 0,
              background: "var(--ek-surface)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 48,
              position: "relative",
              border: "1px solid var(--ek-border-mid)",
            }}
          >
            {currentTrack.cover ? (
              <Image
                src={currentTrack.cover}
                alt={currentTrack.title}
                fill
                unoptimized
                style={{ objectFit: "cover" }}
                sizes="140px"
              />
            ) : (
              currentTrack.emoji || "🎵"
            )}
          </div>

          {/* Track details */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                fontFamily: "var(--font-display)",
                fontSize: 28,
                fontWeight: 400,
                letterSpacing: "-0.02em",
                color: "var(--ek-text-primary)",
                marginBottom: 6,
                lineHeight: 1.1,
              }}
            >
              {currentTrack.title}
            </div>
            <div
              style={{
                fontSize: 15,
                color: "var(--ek-text-secondary)",
                marginBottom: 20,
              }}
            >
              {currentTrack.artist}
            </div>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              {[
                { label: "FORMAT", value: "FLAC 24-bit" },
                { label: "SAMPLE RATE", value: "96kHz" },
                { label: "BITRATE", value: "Lossless" },
                { label: "GENRE", value: currentTrack.genre || "Afrobeats" },
              ].map(({ label, value }) => (
                <div
                  key={label}
                  style={{
                    background: "var(--ek-surface)",
                    border: "1px solid var(--ek-border)",
                    borderRadius: 8,
                    padding: "6px 12px",
                  }}
                >
                  <div
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: 9,
                      color: "var(--ek-text-muted)",
                      letterSpacing: "0.08em",
                      textTransform: "uppercase",
                      marginBottom: 2,
                    }}
                  >
                    {label}
                  </div>
                  <div style={{ fontSize: 12, color: "var(--ek-text-primary)", fontWeight: 500 }}>
                    {value}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Live waveform visualizer */}
          <div
            style={{
              width: 180,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 12,
            }}
          >
            <div
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: 9,
                color: "var(--ek-text-tertiary)",
                letterSpacing: "0.1em",
                textTransform: "uppercase",
              }}
            >
              {isPlaying ? "Now playing" : "Paused"}
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "flex-end",
                gap: 3,
                height: 50,
              }}
            >
              {Array.from({ length: 20 }).map((_, i) => {
                const baseH = [40, 70, 55, 85, 45, 90, 60, 75, 35, 80, 65, 50, 95, 40, 70, 55, 85, 45, 60, 75][i];
                return (
                  <div
                    key={i}
                    style={{
                      width: 4,
                      height: `${baseH}%`,
                      borderRadius: 2,
                      background: `linear-gradient(to top, var(--ek-gold), rgba(201,168,76,0.3))`,
                      transformOrigin: "bottom",
                      animation: isPlaying
                        ? `waveBar ${0.6 + (i % 5) * 0.12}s ease-in-out infinite alternate`
                        : "none",
                      animationDelay: `${i * 0.05}s`,
                      opacity: isPlaying ? 1 : 0.3,
                      transition: "opacity 0.3s ease",
                    }}
                  />
                );
              })}
            </div>
          </div>
        </div>
      )}
    </footer>
  );
}
