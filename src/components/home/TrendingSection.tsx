"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { Play, Pause, Heart, TrendingUp, Zap, ShoppingBag, CheckCircle2 } from "lucide-react";
import { Track } from "@/types";
import { usePlayerStore } from "@/stores/playerStore";

interface PatronActivity {
  id: number;
  name: string;
  initials: string;
  action: string;
  amount: number;
  artist: string;
  track: string;
  time: string;
  message: string;
  color: string;
}

const INITIAL_PATRONS: PatronActivity[] = [
  {
    id: 1, name: "Tunde A.", initials: "TA", action: "tipped",
    amount: 15, artist: "Wizkid", track: "Essence (FLAC)",
    time: "just now", message: "Nothing hits like this on vinyl.",
    color: "#5b8dee",
  },
  {
    id: 2, name: "Sarah J.", initials: "SJ", action: "purchased",
    amount: 5, artist: "Davido", track: "Fall (320kbps)",
    time: "3m ago", message: "Supporting independent artists is the only way.",
    color: "#4caf7d",
  },
  {
    id: 3, name: "Nnamdi O.", initials: "NO", action: "subscribed",
    amount: 8.99, artist: "Tems", track: "Artist Circle",
    time: "11m ago", message: "This beats a penny per stream any day.",
    color: "#c9a84c",
  },
  {
    id: 4, name: "David K.", initials: "DK", action: "tipped",
    amount: 20, artist: "Asake", track: "Only Me (HI-RES)",
    time: "18m ago", message: "Bass sounds insane on good headphones.",
    color: "#e05555",
  },
];

interface TrendingSectionProps {
  tracks: Track[];
  isLoading: boolean;
}

interface TrendingTrackRowProps {
  track: Track;
  index: number;
  isCurrent: boolean;
  isLiked: boolean;
  isPlaying: boolean;
  isLast: boolean;
  onPlayToggle: () => void;
  onLikeToggle: () => void;
}

function TrendingTrackRow({
  track,
  index,
  isCurrent,
  isLiked,
  isPlaying,
  isLast,
  onPlayToggle,
  onLikeToggle,
}: TrendingTrackRowProps) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={onPlayToggle}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 14,
        padding: "10px 10px",
        borderRadius: 10,
        cursor: "pointer",
        background: hovered ? "var(--ek-surface)" : isCurrent ? "var(--ek-gold-glow)" : "transparent",
        transition: "background 0.15s ease",
        borderBottom: isLast ? "none" : "1px solid var(--ek-border)",
      }}
    >
      {/* Rank / play icon */}
      <div
        style={{
          width: 22,
          textAlign: "right",
          flexShrink: 0,
          color: index < 3 ? "var(--ek-gold)" : "var(--ek-text-tertiary)",
          fontFamily: "var(--font-mono)",
          fontSize: 12,
          fontWeight: 500,
        }}
      >
        {hovered ? (
          <span style={{ display: "flex", justifyContent: "center" }}>
            {isCurrent && isPlaying ? (
              <Pause size={13} />
            ) : (
              <Play size={13} fill="currentColor" />
            )}
          </span>
        ) : isCurrent && isPlaying ? (
          <span style={{ color: "var(--ek-gold)" }}>▶</span>
        ) : (
          String(index + 1).padStart(2, "0")
        )}
      </div>

      {/* Art */}
      <div
        style={{
          width: 40,
          height: 40,
          borderRadius: 8,
          overflow: "hidden",
          flexShrink: 0,
          background: "var(--ek-raised)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 18,
          border: isCurrent ? "1px solid var(--ek-gold)44" : "1px solid var(--ek-border)",
          position: "relative",
        }}
      >
        {track.cover ? (
          <Image
            src={track.cover}
            alt={track.title}
            fill
            unoptimized
            style={{ objectFit: "cover" }}
            sizes="40px"
          />
        ) : (
          track.emoji || "🎵"
        )}
      </div>

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: 13,
            fontWeight: 500,
            color: isCurrent ? "var(--ek-gold)" : "var(--ek-text-primary)",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
            letterSpacing: "-0.01em",
          }}
        >
          {track.title}
        </div>
        <div
          style={{
            fontSize: 12,
            color: "var(--ek-text-secondary)",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {track.artist}
        </div>
      </div>

      {/* Right meta */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-end",
          gap: 4,
          flexShrink: 0,
        }}
      >
        <span
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: 11,
            color: "var(--ek-text-tertiary)",
          }}
        >
          {track.plays}
        </span>
        <span
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: 9,
            color: "var(--ek-green)",
            letterSpacing: "0.04em",
          }}
        >
          ▲ +12%
        </span>
      </div>

      {/* Like */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onLikeToggle();
        }}
        style={{
          background: "none",
          border: "none",
          padding: "0 2px",
          color: isLiked ? "var(--ek-red)" : "var(--ek-text-muted)",
          display: "flex",
          flexShrink: 0,
          transition: "color 0.2s, transform 0.15s",
          transform: isLiked ? "scale(1.1)" : "scale(1)",
        }}
      >
        <Heart size={13} fill={isLiked ? "currentColor" : "none"} />
      </button>
    </div>
  );
}

export default function TrendingSection({ tracks, isLoading }: TrendingSectionProps) {
  const { currentTrack, isPlaying, setTrack, togglePlay, likedTracks, toggleLikeTrack } =
    usePlayerStore();
  const [patrons, setPatrons] = useState<PatronActivity[]>(INITIAL_PATRONS);
  const [newPatronFlash, setNewPatronFlash] = useState<number | null>(null);

  // Simulate incoming patron activity
  useEffect(() => {
    const interval = setInterval(() => {
      const names = ["Adaeze M.", "Kofi B.", "Yemi T.", "Imani R.", "Chidi A."];
      const actions = ["tipped", "purchased", "subscribed"];
      const artists = ["Wizkid", "Burna Boy", "Tems", "Rema", "Asake"];
      const colors = ["#5b8dee", "#4caf7d", "#c9a84c", "#e05555", "#a855f7"];
      const messages = [
        "Keep making music like this 🔥",
        "Worth every kobo.",
        "Been waiting for this EP for months.",
        "Direct support is the future.",
      ];

      const newPatron: PatronActivity = {
        id: Date.now(),
        name: names[Math.floor(Math.random() * names.length)],
        initials: "?",
        action: actions[Math.floor(Math.random() * actions.length)],
        amount: [3, 5, 10, 15, 20][Math.floor(Math.random() * 5)],
        artist: artists[Math.floor(Math.random() * artists.length)],
        track: "Track",
        time: "just now",
        message: messages[Math.floor(Math.random() * messages.length)],
        color: colors[Math.floor(Math.random() * colors.length)],
      };
      newPatron.initials = newPatron.name.slice(0, 2).toUpperCase();

      setPatrons((prev) => [newPatron, ...prev.slice(0, 5)]);
      setNewPatronFlash(newPatron.id);
      setTimeout(() => setNewPatronFlash(null), 2000);
    }, 12000);
    return () => clearInterval(interval);
  }, []);

  return (
    <section
      style={{
        display: "grid",
        gridTemplateColumns: "1fr 320px",
        gap: 0,
        borderTop: "1px solid var(--ek-border)",
        borderBottom: "1px solid var(--ek-border)",
      }}
    >
      {/* Left: Trending tracks list */}
      <div
        style={{
          padding: "32px 40px",
          borderRight: "1px solid var(--ek-border)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 24 }}>
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: 8,
              background: "var(--ek-gold-dim)",
              border: "1px solid var(--ek-gold)33",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <TrendingUp size={13} style={{ color: "var(--ek-gold)" }} />
          </div>
          <div>
            <div
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: 10,
                color: "var(--ek-text-tertiary)",
                letterSpacing: "0.08em",
                textTransform: "uppercase",
              }}
            >
              Last.fm synced
            </div>
            <h2
              style={{
                fontFamily: "var(--font-display)",
                fontSize: 20,
                fontWeight: 400,
                letterSpacing: "-0.02em",
                color: "var(--ek-text-primary)",
                lineHeight: 1,
              }}
            >
              Live trending charts
            </h2>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {isLoading
            ? Array.from({ length: 8 }).map((_, i) => (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 14,
                    padding: "10px 0",
                    borderBottom: "1px solid var(--ek-border)",
                  }}
                >
                  <div className="skeleton" style={{ width: 18, height: 13, flexShrink: 0 }} />
                  <div className="skeleton" style={{ width: 40, height: 40, borderRadius: 8, flexShrink: 0 }} />
                  <div style={{ flex: 1 }}>
                    <div className="skeleton" style={{ height: 13, width: "60%", marginBottom: 5 }} />
                    <div className="skeleton" style={{ height: 11, width: "40%" }} />
                  </div>
                  <div className="skeleton" style={{ height: 11, width: 40 }} />
                </div>
              ))
            : tracks.slice(0, 8).map((track, i) => {
                const isCurrent = currentTrack?.id === track.id;
                const isLiked = likedTracks.includes(track.id);

                return (
                  <TrendingTrackRow
                    key={track.id}
                    track={track}
                    index={i}
                    isCurrent={isCurrent}
                    isLiked={isLiked}
                    isPlaying={isPlaying}
                    isLast={i === tracks.slice(0, 8).length - 1}
                    onPlayToggle={() => {
                      if (isCurrent) togglePlay();
                      else setTrack(track);
                    }}
                    onLikeToggle={() => toggleLikeTrack(track.id)}
                  />
                );
              })}
        </div>
      </div>

      {/* Right: Patron feed */}
      <div style={{ padding: "32px 24px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20 }}>
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: 8,
              background: "var(--ek-green-dim)",
              border: "1px solid var(--ek-green)33",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <ShoppingBag size={13} style={{ color: "var(--ek-green)" }} />
          </div>
          <div>
            <div
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: 10,
                color: "var(--ek-text-tertiary)",
                letterSpacing: "0.08em",
                textTransform: "uppercase",
              }}
            >
              Live activity
            </div>
            <h2
              style={{
                fontFamily: "var(--font-display)",
                fontSize: 20,
                fontWeight: 400,
                letterSpacing: "-0.02em",
                color: "var(--ek-text-primary)",
                lineHeight: 1,
              }}
            >
              Patron feed
            </h2>
          </div>
          {/* Live indicator */}
          <div
            style={{
              marginLeft: "auto",
              display: "flex",
              alignItems: "center",
              gap: 5,
              fontFamily: "var(--font-mono)",
              fontSize: 10,
              color: "var(--ek-green)",
              letterSpacing: "0.06em",
            }}
          >
            <span
              style={{
                width: 5,
                height: 5,
                borderRadius: "50%",
                background: "var(--ek-green)",
                display: "block",
                animation: "pulseDot 2s ease infinite",
              }}
            />
            LIVE
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {patrons.map((patron) => (
            <div
              key={patron.id}
              style={{
                background:
                  newPatronFlash === patron.id ? "var(--ek-surface)" : "var(--ek-raised)",
                border: `1px solid ${newPatronFlash === patron.id ? "var(--ek-border-mid)" : "var(--ek-border)"}`,
                borderRadius: 12,
                padding: "12px 14px",
                transition: "all 0.4s ease",
                animation: newPatronFlash === patron.id ? "fadeUp 0.4s ease" : "none",
              }}
            >
              <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: "50%",
                    background: patron.color + "22",
                    border: `1px solid ${patron.color}44`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontFamily: "var(--font-mono)",
                    fontSize: 10,
                    fontWeight: 500,
                    color: patron.color,
                    flexShrink: 0,
                  }}
                >
                  {patron.initials}
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: 8,
                      marginBottom: 2,
                    }}
                  >
                    <span style={{ fontSize: 13, fontWeight: 500, color: "var(--ek-text-primary)" }}>
                      {patron.name}
                    </span>
                    <span
                      style={{
                        fontFamily: "var(--font-mono)",
                        fontSize: 12,
                        color: "var(--ek-green)",
                        fontWeight: 500,
                        flexShrink: 0,
                      }}
                    >
                      +${patron.amount.toFixed(2)}
                    </span>
                  </div>
                  <div
                    style={{
                      fontSize: 11,
                      color: "var(--ek-text-secondary)",
                      lineHeight: 1.4,
                      marginBottom: 8,
                    }}
                  >
                    <span style={{ color: "var(--ek-text-tertiary)" }}>{patron.action} </span>
                    <span style={{ color: "var(--ek-text-primary)", fontWeight: 500 }}>
                      {patron.track}
                    </span>
                    <span style={{ color: "var(--ek-text-tertiary)" }}> by {patron.artist}</span>
                  </div>
                  {patron.message && (
                    <div
                      style={{
                        fontSize: 11,
                        color: "var(--ek-text-secondary)",
                        fontStyle: "italic",
                        background: "var(--ek-surface)",
                        border: "1px solid var(--ek-border)",
                        borderRadius: 8,
                        padding: "6px 10px",
                        lineHeight: 1.4,
                        marginBottom: 6,
                      }}
                    >
                      &ldquo;{patron.message}&rdquo;
                    </div>
                  )}
                  <div
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: 10,
                      color: "var(--ek-text-muted)",
                      letterSpacing: "0.04em",
                    }}
                  >
                    {patron.time}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Platform philosophy note */}
        <div
          style={{
            marginTop: 16,
            padding: "12px 14px",
            background: "var(--ek-gold-glow)",
            border: "1px solid var(--ek-gold)22",
            borderRadius: 12,
            fontSize: 11,
            color: "var(--ek-text-secondary)",
            lineHeight: 1.5,
            display: "flex",
            gap: 8,
            alignItems: "flex-start",
          }}
        >
          <CheckCircle2 size={13} style={{ color: "var(--ek-gold)", flexShrink: 0, marginTop: 1 }} />
          <span>
            <strong style={{ color: "var(--ek-gold)", fontWeight: 500 }}>92%</strong> of every tip
            goes directly to the artist. No label. No middleman. Just music.
          </span>
        </div>
      </div>
    </section>
  );
}
