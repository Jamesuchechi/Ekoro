"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import {
  Play,
  Pause,
  Heart,
  Download,
  MoreHorizontal,
  Flame,
  Sparkles,
  Clock,
  Music2,
  TrendingUp,
  Lock,
} from "lucide-react";
import { Track } from "@/types";
import { usePlayerStore } from "@/stores/playerStore";

interface DiscoverSectionProps {
  trendingTracks: Track[];
  isTrendingLoading: boolean;
  featuredTracks: Track[];
  isFeaturedLoading: boolean;
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const TABS = [
  { id: "For You", label: "For you", icon: Sparkles },
  { id: "Trending", label: "Trending", icon: Flame },
  { id: "New Releases", label: "New releases", icon: Clock },
  { id: "Afrobeats", label: "Afrobeats", icon: Music2 },
  { id: "Alternative", label: "Alternative", icon: TrendingUp },
];

const QUALITY_LABELS: Record<number, string> = {
  0: "FLAC",
  1: "320K",
  2: "FLAC",
  3: "HI-RES",
};

function TrackCardLarge({ track, index }: { track: Track; index: number }) {
  const { currentTrack, isPlaying, setTrack, togglePlay, likedTracks, toggleLikeTrack } =
    usePlayerStore();
  const [hovered, setHovered] = useState(false);
  const isCurrent = currentTrack?.id === track.id;
  const isLiked = likedTracks.includes(track.id);

  const handlePlay = () => {
    if (isCurrent) togglePlay();
    else setTrack(track);
  };

  const downloadTypes: Record<number, { label: string; color: string; bg: string }> = {
    0: { label: "FREE", color: "var(--ek-green)", bg: "var(--ek-green-dim)" },
    1: { label: "PAID", color: "var(--ek-gold)", bg: "var(--ek-gold-dim)" },
    2: { label: "FREE", color: "var(--ek-green)", bg: "var(--ek-green-dim)" },
    3: { label: "PRO", color: "var(--ek-blue)", bg: "rgba(91,141,238,0.12)" },
  };
  const dtype = downloadTypes[index % 4];

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: hovered ? "var(--ek-surface)" : "var(--ek-raised)",
        border: `1px solid ${isCurrent ? "var(--ek-gold)" : hovered ? "var(--ek-border-mid)" : "var(--ek-border)"}`,
        borderRadius: 16,
        overflow: "hidden",
        cursor: "pointer",
        transition: "all 0.2s var(--ease-out-expo)",
        transform: hovered ? "translateY(-2px)" : "translateY(0)",
        position: "relative",
      }}
    >
      {/* Active glow line */}
      {isCurrent && (
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: 2,
            background: "linear-gradient(90deg, var(--ek-gold), transparent)",
          }}
        />
      )}

      {/* Art */}
      <div style={{ position: "relative", aspectRatio: "1/1", overflow: "hidden" }}>
        <div
          style={{
            width: "100%",
            height: "100%",
            background: `linear-gradient(135deg, ${track.color?.split(" ")[0]?.replace("from-", "") || "#1e1e1e"} 0%, #0f0f0f 100%)`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 36,
            minHeight: 160,
          }}
        >
          {track.cover ? (
            <Image
              src={track.cover}
              alt={track.title}
              fill
              unoptimized
              style={{ objectFit: "cover", transition: "transform 0.4s var(--ease-out-expo)" }}
              sizes="(max-width: 768px) 50vw, 25vw"
            />
          ) : (
            <span style={{ filter: "drop-shadow(0 2px 8px rgba(0,0,0,0.5))" }}>
              {track.emoji || "🎵"}
            </span>
          )}
        </div>

        {/* Quality badge */}
        <div
          style={{
            position: "absolute",
            top: 10,
            left: 10,
            background: "rgba(8,8,8,0.8)",
            backdropFilter: "blur(8px)",
            border: "1px solid var(--ek-border-mid)",
            borderRadius: 6,
            padding: "2px 7px",
            fontFamily: "var(--font-mono)",
            fontSize: 9,
            letterSpacing: "0.08em",
            color: "var(--ek-gold)",
          }}
        >
          {QUALITY_LABELS[index % 4]}
        </div>

        {/* Download type badge */}
        <div
          style={{
            position: "absolute",
            top: 10,
            right: 10,
            background: dtype.bg,
            border: `1px solid ${dtype.color}33`,
            borderRadius: 6,
            padding: "2px 7px",
            fontFamily: "var(--font-mono)",
            fontSize: 9,
            letterSpacing: "0.08em",
            color: dtype.color,
          }}
        >
          {index % 4 === 3 && <Lock size={7} style={{ display: "inline", marginRight: 3 }} />}
          {dtype.label}
        </div>

        {/* Play overlay */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "rgba(0,0,0,0.45)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            opacity: hovered || isCurrent ? 1 : 0,
            transition: "opacity 0.2s ease",
          }}
        >
          <button
            onClick={(e) => { e.stopPropagation(); handlePlay(); }}
            style={{
              width: 48,
              height: 48,
              borderRadius: "50%",
              background: "var(--ek-gold)",
              border: "none",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#0f0f0f",
              transform: hovered ? "scale(1)" : "scale(0.85)",
              transition: "transform 0.25s var(--ease-out-expo)",
            }}
          >
            {isCurrent && isPlaying ? (
              <Pause size={18} fill="currentColor" />
            ) : (
              <Play size={18} fill="currentColor" style={{ marginLeft: 2 }} />
            )}
          </button>
        </div>
      </div>

      {/* Info */}
      <div style={{ padding: "14px 14px 12px" }}>
        <div
          style={{
            fontSize: 13,
            fontWeight: 500,
            color: "var(--ek-text-primary)",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
            marginBottom: 3,
            letterSpacing: "-0.01em",
          }}
        >
          {track.title}
        </div>
        <div
          style={{
            fontSize: 12,
            color: "var(--ek-text-secondary)",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            marginBottom: 12,
          }}
        >
          {track.artist}
        </div>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: 11,
              color: "var(--ek-text-tertiary)",
              display: "flex",
              alignItems: "center",
              gap: 4,
            }}
          >
            <Play size={9} fill="currentColor" />
            {track.plays}
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button
              onClick={(e) => { e.stopPropagation(); toggleLikeTrack(track.id); }}
              style={{
                background: "none",
                border: "none",
                padding: 0,
                color: isLiked ? "var(--ek-red)" : "var(--ek-text-tertiary)",
                transition: "color 0.2s, transform 0.15s",
                display: "flex",
                transform: isLiked ? "scale(1.15)" : "scale(1)",
              }}
            >
              <Heart size={14} fill={isLiked ? "currentColor" : "none"} />
            </button>
            <button
              style={{
                background: "none",
                border: "none",
                padding: 0,
                color: "var(--ek-text-tertiary)",
                display: "flex",
              }}
            >
              <Download size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function SkeletonCard() {
  return (
    <div style={{ borderRadius: 16, overflow: "hidden", border: "1px solid var(--ek-border)" }}>
      <div className="skeleton" style={{ aspectRatio: "1/1", minHeight: 160 }} />
      <div style={{ padding: "14px 14px 12px", background: "var(--ek-raised)" }}>
        <div className="skeleton" style={{ height: 13, width: "75%", marginBottom: 8 }} />
        <div className="skeleton" style={{ height: 11, width: "50%", marginBottom: 14 }} />
        <div className="skeleton" style={{ height: 10, width: "40%" }} />
      </div>
    </div>
  );
}

export default function DiscoverSection({
  trendingTracks,
  isTrendingLoading,
  featuredTracks,
  isFeaturedLoading,
  activeTab,
  onTabChange,
}: DiscoverSectionProps) {
  const activeRef = useRef<HTMLButtonElement>(null);
  const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0 });

  useEffect(() => {
    if (activeRef.current) {
      const el = activeRef.current;
      setIndicatorStyle({ left: el.offsetLeft, width: el.offsetWidth });
    }
  }, [activeTab]);

  const displayTracks = featuredTracks.length > 0 ? featuredTracks : trendingTracks;
  const isLoading = featuredTracks.length > 0 ? isFeaturedLoading : isTrendingLoading;

  return (
    <section style={{ padding: "32px 40px" }}>
      {/* Section header */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "space-between",
          marginBottom: 24,
        }}
      >
        <div>
          <div
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: 10,
              color: "var(--ek-gold)",
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              marginBottom: 6,
            }}
          >
            Discover
          </div>
          <h2
            style={{
              fontFamily: "var(--font-display)",
              fontSize: 26,
              fontWeight: 400,
              letterSpacing: "-0.02em",
              color: "var(--ek-text-primary)",
            }}
          >
            Your wavefront
          </h2>
        </div>

        {/* Tabs */}
        <div
          style={{
            display: "flex",
            gap: 4,
            background: "var(--ek-surface)",
            border: "1px solid var(--ek-border)",
            borderRadius: 99,
            padding: "4px",
            position: "relative",
          }}
        >
          {/* Sliding indicator */}
          <div
            style={{
              position: "absolute",
              top: 4,
              height: "calc(100% - 8px)",
              left: indicatorStyle.left,
              width: indicatorStyle.width,
              background: "var(--ek-raised)",
              borderRadius: 99,
              transition: "all 0.25s var(--ease-out-expo)",
              border: "1px solid var(--ek-border-mid)",
              pointerEvents: "none",
            }}
          />
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                ref={isActive ? activeRef : undefined}
                onClick={() => onTabChange(tab.id)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 5,
                  background: "transparent",
                  border: "none",
                  borderRadius: 99,
                  padding: "6px 14px",
                  fontSize: 12,
                  fontWeight: 400,
                  fontFamily: "var(--font-body)",
                  color: isActive ? "var(--ek-text-primary)" : "var(--ek-text-tertiary)",
                  cursor: "pointer",
                  transition: "color 0.2s ease",
                  position: "relative",
                  zIndex: 1,
                  whiteSpace: "nowrap",
                }}
              >
                <Icon size={11} />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Track grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
          gap: 14,
        }}
      >
        {isLoading
          ? Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)
          : displayTracks.slice(0, 6).map((track, i) => (
              <TrackCardLarge key={track.id} track={track} index={i} />
            ))}
      </div>
    </section>
  );
}
