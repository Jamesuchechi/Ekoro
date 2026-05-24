"use client";

import React, { useState, useEffect } from "react";
import { Track } from "@/types";
import HeroSection from "@/components/home/HeroSection";
import DiscoverSection from "@/components/home/DiscoverSection";
import TrendingSection from "@/components/home/TrendingSection";
import WaveformSection from "@/components/home/WaveformSection";
import SupportSection from "@/components/home/SupportSection";

export default function Home() {
  const [activeTab, setActiveTab] = useState("For You");

  const [trendingTracks, setTrendingTracks] = useState<Track[]>([]);
  const [isTrendingLoading, setIsTrendingLoading] = useState(true);

  const [featuredTracks, setFeaturedTracks] = useState<Track[]>([]);
  const [isFeaturedLoading, setIsFeaturedLoading] = useState(true);

  // Fetch trending once on mount
  useEffect(() => {
    async function fetchTrending() {
      setIsTrendingLoading(true);
      try {
        const res = await fetch("/api/tracks");
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data.tracks)) {
            setTrendingTracks(data.tracks);
          }
        }
      } catch (err) {
        console.error("Failed to fetch trending tracks:", err);
      } finally {
        setIsTrendingLoading(false);
      }
    }
    fetchTrending();
  }, []);

  // Fetch featured whenever tab changes
  useEffect(() => {
    async function fetchFeatured() {
      setIsFeaturedLoading(true);

      const queryMap: Record<string, string> = {
        "For You": "Davido",
        "Trending": "Wizkid",
        "New Releases": "Rema",
        "Afrobeats": "Burna Boy",
        "Alternative": "Asake",
      };
      const q = queryMap[activeTab] || activeTab;

      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data.tracks)) {
            const COLORS = [
              "from-blue-600 to-indigo-900",
              "from-amber-600 to-orange-900",
              "from-emerald-600 to-teal-900",
              "from-purple-600 to-fuchsia-900",
              "from-rose-600 to-red-900",
              "from-cyan-600 to-sky-900",
            ];
            const EMOJIS = ["🔥", "⚡", "🌟", "🎸", "🌊", "✨"];

            const mapped: Track[] = data.tracks.map((t: any, i: number) => ({
              id: t.id,
              title: t.title,
              artist: t.artist,
              duration: t.duration,
              cover: t.cover,
              plays: t.plays || `${(1.2 + i * 0.6).toFixed(1)}M`,
              genre: activeTab === "For You" ? "Afrobeats" : activeTab,
              color: COLORS[i % COLORS.length],
              emoji: EMOJIS[i % EMOJIS.length],
            }));
            setFeaturedTracks(mapped);
          }
        }
      } catch (err) {
        console.error("Failed to fetch featured tracks:", err);
      } finally {
        setIsFeaturedLoading(false);
      }
    }
    fetchFeatured();
  }, [activeTab]);

  const heroTrack =
    featuredTracks[0] || trendingTracks[0] || undefined;

  return (
    <div
      style={{
        minHeight: "100%",
        background: "var(--ek-void)",
      }}
    >
      {/* 1 — Editorial hero */}
      <HeroSection featuredTrack={heroTrack} />

      {/* 2 — Tabbed discovery grid */}
      <DiscoverSection
        trendingTracks={trendingTracks}
        isTrendingLoading={isTrendingLoading}
        featuredTracks={featuredTracks}
        isFeaturedLoading={isFeaturedLoading}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      {/* 3 — Trending charts + live patron feed */}
      <TrendingSection
        tracks={trendingTracks}
        isLoading={isTrendingLoading}
      />

      {/* 4 — Interactive waveform + community lounge */}
      <WaveformSection />

      {/* 5 — Direct artist support portal */}
      <SupportSection />

      {/* Bottom padding for fixed player */}
      <div style={{ height: 80 }} />
    </div>
  );
}
