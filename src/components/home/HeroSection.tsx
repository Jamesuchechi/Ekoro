"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { Play, Pause, Radio, Users, ChevronRight, Disc3 } from "lucide-react";
import { Track } from "@/types";
import { usePlayerStore } from "@/stores/playerStore";
import { useAuthStore } from "@/stores/authStore";

interface HeroSectionProps {
  featuredTrack?: Track;
}

const LISTENER_COUNT = 2847;

export default function HeroSection({ featuredTrack }: HeroSectionProps) {
  const { currentTrack, isPlaying, setTrack, togglePlay } = usePlayerStore();
  const { user, profile } = useAuthStore();
  const [mounted, setMounted] = useState(false);
  const [listeners, setListeners] = useState(LISTENER_COUNT);

  useEffect(() => {
    setMounted(true);
    const interval = setInterval(() => {
      setListeners((n) => n + Math.floor(Math.random() * 3) - 1);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const getPersonalizedGreeting = () => {
    const hr = new Date().getHours();
    let timeOfDay = "day";
    if (hr < 12) timeOfDay = "morning";
    else if (hr < 17) timeOfDay = "afternoon";
    else timeOfDay = "evening";

    if (user) {
      const name = profile?.displayName || user.email?.split("@")[0] || "music lover";
      return `Good ${timeOfDay}, ${name}`;
    }
    return "Welcome to Ekoro";
  };

  const handlePlay = () => {
    if (!featuredTrack) return;
    if (currentTrack?.id === featuredTrack.id) {
      togglePlay();
    } else {
      setTrack(featuredTrack);
    }
  };

  const isCurrentPlaying =
    currentTrack?.id === featuredTrack?.id && isPlaying;

  const bars = Array.from({ length: 28 }, (_, i) => {
    const heights = [35, 55, 80, 45, 90, 60, 75, 40, 95, 50, 70, 85, 30, 65, 50, 80, 45, 70, 55, 90, 35, 75, 60, 85, 40, 65, 50, 45];
    return heights[i] || 50;
  });

  return (
    <section
      style={{
        position: "relative",
        overflow: "hidden",
        background: "var(--ek-ink)",
        borderBottom: "1px solid var(--ek-border)",
        minHeight: 340,
      }}
    >
      {/* Ambient background blobs */}
      <div
        style={{
          position: "absolute",
          top: -80,
          right: -60,
          width: 400,
          height: 400,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(201,168,76,0.06) 0%, transparent 70%)",
          pointerEvents: "none",
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: -100,
          left: -40,
          width: 320,
          height: 320,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(76,175,125,0.05) 0%, transparent 70%)",
          pointerEvents: "none",
        }}
      />

      <div
        style={{
          position: "relative",
          zIndex: 1,
          display: "grid",
          gridTemplateColumns: "1fr auto",
          alignItems: "center",
          gap: 40,
          padding: "48px 40px",
          maxWidth: "100%",
        }}
      >
        {/* Left content */}
        <div style={{ minWidth: 0 }}>
          {/* Live badge */}
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              background: "var(--ek-surface)",
              border: "1px solid var(--ek-border-mid)",
              borderRadius: 99,
              padding: "5px 14px",
              marginBottom: 24,
              animation: mounted ? "fadeIn 0.6s ease forwards" : "none",
            }}
          >
            <span
              style={{
                width: 6,
                height: 6,
                borderRadius: "50%",
                background: "var(--ek-green)",
                display: "block",
                animation: "pulseDot 2s ease infinite",
              }}
            />
            <Radio size={11} style={{ color: "var(--ek-text-secondary)" }} />
            <span
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: 11,
                color: "var(--ek-text-secondary)",
                letterSpacing: "0.06em",
              }}
            >
              EKORO WAVE · LIVE
            </span>
            <span
              style={{
                display: "flex",
                alignItems: "center",
                gap: 4,
                fontFamily: "var(--font-mono)",
                fontSize: 11,
                color: "var(--ek-gold)",
                marginLeft: 4,
              }}
            >
              <Users size={10} />
              {listeners.toLocaleString()}
            </span>
          </div>

          {/* Personalized Greeting */}
          {mounted && (
            <div
              style={{
                fontSize: 12,
                fontWeight: 500,
                color: "var(--ek-gold)",
                fontFamily: "var(--font-mono)",
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                marginBottom: 12,
                animation: "fadeIn 0.6s ease forwards",
              }}
            >
              {getPersonalizedGreeting()}
            </div>
          )}

          {/* Headline */}
          <h1
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "clamp(32px, 4vw, 54px)",
              fontWeight: 400,
              lineHeight: 1.08,
              letterSpacing: "-0.02em",
              color: "var(--ek-text-primary)",
              maxWidth: 560,
              marginBottom: 16,
              animation: mounted ? "fadeUp 0.7s 0.1s ease both" : "none",
            }}
          >
            Where music{" "}
            <em style={{ color: "var(--ek-gold)", fontStyle: "italic" }}>
              lives
            </em>
            .<br />
            Artists{" "}
            <em style={{ fontStyle: "italic", color: "var(--ek-text-secondary)" }}>
              breathe
            </em>
            .
          </h1>

          <p
            style={{
              fontSize: 14,
              color: "var(--ek-text-secondary)",
              lineHeight: 1.6,
              maxWidth: 420,
              marginBottom: 32,
              animation: mounted ? "fadeUp 0.7s 0.2s ease both" : "none",
            }}
          >
            Stream in lossless. Buy direct. Support artists the way it should
            have always been — every stream funds the creator, not the
            middleman.
          </p>

          {/* CTA row */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              animation: mounted ? "fadeUp 0.7s 0.3s ease both" : "none",
            }}
          >
            <button
              onClick={handlePlay}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                background: "var(--ek-gold)",
                color: "#0f0f0f",
                border: "none",
                borderRadius: 99,
                padding: "12px 24px",
                fontFamily: "var(--font-body)",
                fontSize: 13,
                fontWeight: 600,
                letterSpacing: "0.02em",
                transition: "all 0.2s var(--ease-out-expo)",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.transform = "scale(1.03)";
                (e.currentTarget as HTMLButtonElement).style.background = "#d4af5a";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.transform = "scale(1)";
                (e.currentTarget as HTMLButtonElement).style.background = "var(--ek-gold)";
              }}
            >
              {isCurrentPlaying ? (
                <Pause size={15} fill="currentColor" />
              ) : (
                <Play size={15} fill="currentColor" style={{ marginLeft: 1 }} />
              )}
              {isCurrentPlaying ? "Pause session" : "Play live session"}
            </button>

            <button
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                background: "transparent",
                color: "var(--ek-text-secondary)",
                border: "1px solid var(--ek-border-mid)",
                borderRadius: 99,
                padding: "12px 20px",
                fontFamily: "var(--font-body)",
                fontSize: 13,
                fontWeight: 400,
                transition: "all 0.2s ease",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--ek-border-hi)";
                (e.currentTarget as HTMLButtonElement).style.color = "var(--ek-text-primary)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--ek-border-mid)";
                (e.currentTarget as HTMLButtonElement).style.color = "var(--ek-text-secondary)";
              }}
            >
              Browse artists
              <ChevronRight size={14} />
            </button>
          </div>
        </div>

        {/* Right — vinyl + waveform */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 20,
            animation: mounted ? "fadeIn 0.8s 0.15s ease both" : "none",
            flexShrink: 0,
          }}
        >
          {/* Vinyl */}
          <div
            style={{
              position: "relative",
              width: 140,
              height: 140,
              animation: isCurrentPlaying ? "spinSlow 4s linear infinite" : "float 6s ease infinite",
            }}
          >
            <div
              style={{
                width: "100%",
                height: "100%",
                borderRadius: "50%",
                background: "var(--ek-surface)",
                border: "1px solid var(--ek-border-mid)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                position: "relative",
                overflow: "hidden",
              }}
            >
              {/* Vinyl grooves */}
              {[0.85, 0.7, 0.55, 0.4].map((scale, i) => (
                <div
                  key={i}
                  style={{
                    position: "absolute",
                    width: `${scale * 100}%`,
                    height: `${scale * 100}%`,
                    borderRadius: "50%",
                    border: "1px solid var(--ek-border)",
                  }}
                />
              ))}
              {/* Center label */}
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: "50%",
                  background: featuredTrack?.cover
                    ? "transparent"
                    : "linear-gradient(135deg, var(--ek-gold) 0%, #8B6914 100%)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  overflow: "hidden",
                  position: "relative",
                  zIndex: 1,
                }}
              >
                {featuredTrack?.cover ? (
                  <Image
                    src={featuredTrack.cover}
                    alt={featuredTrack.title}
                    width={44}
                    height={44}
                    unoptimized
                    style={{ objectFit: "cover", width: "100%", height: "100%" }}
                  />
                ) : (
                  <Disc3 size={18} style={{ color: "#0f0f0f" }} />
                )}
                {/* Spindle */}
                <div
                  style={{
                    position: "absolute",
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    background: "var(--ek-raised)",
                    border: "1px solid var(--ek-border-mid)",
                  }}
                />
              </div>
            </div>
          </div>

          {/* Waveform */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 2.5,
              height: 44,
              padding: "0 4px",
            }}
          >
            {bars.map((h, i) => (
              <div
                key={i}
                style={{
                  width: 3,
                  height: `${h}%`,
                  borderRadius: 99,
                  background:
                    i < 10
                      ? "var(--ek-gold)"
                      : "var(--ek-border-mid)",
                  transformOrigin: "bottom",
                  animation: isCurrentPlaying
                    ? `waveBar ${0.8 + (i % 5) * 0.15}s ease-in-out infinite alternate`
                    : "none",
                  animationDelay: `${i * 0.04}s`,
                  transition: "background 0.3s ease",
                }}
              />
            ))}
          </div>

          {/* Now playing label */}
          {featuredTrack && (
            <div style={{ textAlign: "center" }}>
              <div
                style={{
                  fontSize: 11,
                  fontFamily: "var(--font-mono)",
                  color: "var(--ek-text-tertiary)",
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  marginBottom: 2,
                }}
              >
                {isCurrentPlaying ? "Now playing" : "Featured"}
              </div>
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 500,
                  color: "var(--ek-text-primary)",
                  maxWidth: 160,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {featuredTrack.title}
              </div>
              <div
                style={{
                  fontSize: 12,
                  color: "var(--ek-text-secondary)",
                }}
              >
                {featuredTrack.artist}
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
