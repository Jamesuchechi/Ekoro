"use client";

import React, { useState, useEffect } from "react";
import { Track } from "@/types";
import HeroSection from "@/components/home/HeroSection";
import DiscoverSection from "@/components/home/DiscoverSection";
import FeaturedArtists from "@/components/home/FeaturedArtists";
import TrendingSection from "@/components/home/TrendingSection";
import WaveformSection from "@/components/home/WaveformSection";
import SupportSection from "@/components/home/SupportSection";

function mapApiTrackToFrontendTrack(t: any, i: number): Track {
  const artistName = t.artist?.displayName || t.artist?.username || "Unknown Artist";
  
  const playsNum = parseInt(t.playCount || "0", 10);
  let playsStr = `${playsNum}`;
  if (playsNum >= 1000000) playsStr = `${(playsNum / 1000000).toFixed(1)}M`;
  else if (playsNum >= 1000) playsStr = `${(playsNum / 1000).toFixed(1)}K`;

  const totalSeconds = Math.floor((t.durationMs || 0) / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  const durationStr = `${minutes}:${seconds.toString().padStart(2, "0")}`;

  let coverUrl = "";
  if (t.coverArtUrl) {
    if (t.coverArtUrl.startsWith("http") || t.coverArtUrl.startsWith("/")) {
      coverUrl = t.coverArtUrl;
    } else {
      coverUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/tracks/${t.coverArtUrl}`;
    }
  }

  const COLORS = [
    "from-blue-600 to-indigo-900",
    "from-amber-600 to-orange-900",
    "from-emerald-600 to-teal-900",
    "from-purple-600 to-fuchsia-900",
    "from-rose-600 to-red-900",
    "from-cyan-600 to-sky-900",
  ];
  const EMOJIS = ["🔥", "⚡", "🌟", "🎸", "🌊", "✨"];

  return {
    id: t.id,
    title: t.title,
    artist: artistName,
    duration: durationStr,
    cover: coverUrl || undefined,
    plays: playsStr,
    genre: t.genre || "Alternative",
    color: COLORS[i % COLORS.length],
    emoji: EMOJIS[i % EMOJIS.length],
  };
}

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
        const res = await fetch("/api/tracks?sort=popular&limit=8");
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data.tracks)) {
            const mapped = data.tracks.map((t: any, i: number) => mapApiTrackToFrontendTrack(t, i));
            setTrendingTracks(mapped);
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

      let endpoint = "/api/tracks?limit=6";
      if (activeTab === "Trending") {
        endpoint = "/api/tracks?sort=popular&limit=6";
      } else if (activeTab === "New Releases") {
        endpoint = "/api/tracks?sort=new-releases&limit=6";
      } else if (activeTab === "Afrobeats") {
        endpoint = "/api/tracks?genre=Afrobeats&limit=6";
      } else if (activeTab === "Alternative") {
        endpoint = "/api/tracks?genre=Alternative&limit=6";
      }

      try {
        const res = await fetch(endpoint);
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data.tracks)) {
            const mapped = data.tracks.map((t: any, i: number) => mapApiTrackToFrontendTrack(t, i));
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

      {/* 2.5 — Featured artists grid */}
      <FeaturedArtists />

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
