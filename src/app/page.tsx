"use client";

import React, { useState, useEffect } from "react";
import { Play, Sparkles, Loader2 } from "lucide-react";
import { Track } from "@/types";
import { usePlayerStore } from "@/stores/playerStore";
import TrackCard from "@/components/Track/TrackCard";
import TrackRow from "@/components/Track/TrackRow";

export default function Home() {
  const { setTrack } = usePlayerStore();
  const [activeTab, setActiveTab] = useState<string>("For You");
  const [trendingTracks, setTrendingTracks] = useState<Track[]>([]);
  const [featuredTracks, setFeaturedTracks] = useState<Track[]>([]);

  const [isTrendingLoading, setIsTrendingLoading] = useState(true);
  const [isFeaturedLoading, setIsFeaturedLoading] = useState(true);

  // Fetch trending tracks on mount
  useEffect(() => {
    async function fetchTrending() {
      setIsTrendingLoading(true);
      try {
        const res = await fetch("/api/tracks");
        if (res.ok) {
          const data = await res.json();
          if (data && Array.isArray(data.tracks)) {
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

  // Fetch featured tracks based on tab changes
  useEffect(() => {
    async function fetchFeatured() {
      setIsFeaturedLoading(true);
      try {
        let query = activeTab;
        if (activeTab === "For You") {
          query = "Wizkid"; // default query for personalized home
        } else if (activeTab === "New Releases") {
          query = "Rema"; // popular query for new tracks
        }

        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
        if (res.ok) {
          const data = await res.json();
          if (data && Array.isArray(data.tracks)) {
            const mappedTracks: Track[] = data.tracks.map((t: any) => ({
              id: t.id,
              title: t.title,
              artist: t.artist,
              duration: t.duration,
              cover: t.cover,
              plays: "Live",
              genre: activeTab,
            }));
            setFeaturedTracks(mappedTracks);
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

  const handleHeroPlay = () => {
    if (featuredTracks.length > 0) {
      setTrack(featuredTracks[0]);
    } else if (trendingTracks.length > 0) {
      setTrack(trendingTracks[0]);
    }
  };

  return (
    <div className="p-6">
      {/* HERO BANNER */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-ekoro-blue-dark via-ekoro-blue to-purple-900 p-8 mb-8 border border-white/10 shadow-xl shadow-ekoro-blue-dark/20">
        <div className="absolute right-0 top-0 w-80 h-80 bg-ekoro-gold/5 rounded-full blur-3xl" />
        <div className="absolute left-1/3 bottom-0 w-48 h-48 bg-ekoro-green/5 rounded-full blur-3xl" />

        <div className="relative z-10 max-w-lg">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-white/10 text-ekoro-gold mb-4 border border-white/10">
            <Sparkles className="w-3.5 h-3.5" /> Live Connection
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight mb-2">
            Good evening, Adekola 👋
          </h2>
          <p className="text-sm text-white/70 mb-6 leading-relaxed">
            MusicBrainz catalog and Last.fm recommendations are synchronized. Stream lossless audio metadata and discover artists.
          </p>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={handleHeroPlay}
              disabled={featuredTracks.length === 0 && trendingTracks.length === 0}
              className="bg-ekoro-gold hover:bg-ekoro-gold/90 disabled:bg-ekoro-gold/50 text-ekoro-blue-dark font-bold text-sm px-6 py-2.5 rounded-xl shadow-lg shadow-ekoro-gold/20 flex items-center gap-2 hover:scale-102 active:scale-98 transition-all"
            >
              <Play className="w-4 h-4 fill-current" /> Play Now
            </button>
            <button className="bg-white/10 hover:bg-white/15 text-white border border-white/10 font-bold text-sm px-6 py-2.5 rounded-xl flex items-center gap-2 transition-all">
              Discover More
            </button>
          </div>
        </div>
      </div>

      {/* TABS */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2 scrollbar-none">
        {["For You", "New Releases", "Afrobeats", "Hip-Hop", "Gospel"].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all border ${
              activeTab === tab
                ? "bg-ekoro-blue border-ekoro-blue text-white shadow-md shadow-ekoro-blue/20"
                : "bg-white/5 border-white/10 text-white/70 hover:text-white hover:bg-white/10"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* FEATURED GRID */}
      <div className="mb-10">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold tracking-tight">Featured Tracks ({activeTab})</h3>
          <button className="text-xs text-ekoro-gold hover:underline">See all →</button>
        </div>

        {isFeaturedLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 py-12">
            {[1, 2, 3, 4].map((n) => (
              <div key={n} className="bg-white/5 border border-white/5 rounded-xl p-3 animate-pulse flex flex-col gap-3">
                <div className="aspect-square w-full rounded-lg bg-white/5" />
                <div className="h-4 bg-white/10 rounded w-3/4" />
                <div className="h-3 bg-white/5 rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : featuredTracks.length === 0 ? (
          <div className="text-center py-12 text-white/40 text-sm bg-white/5 rounded-xl border border-white/5">
            No tracks found matching &ldquo;{activeTab}&rdquo;. Try another filter.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
            {featuredTracks.map((track) => (
              <TrackCard key={track.id} track={track} />
            ))}
          </div>
        )}
      </div>

      {/* TWO COLUMN ROW */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        {/* TRENDING CHARTS */}
        <div className="bg-ekoro-dark-paper border border-white/5 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold tracking-tight">🔥 Trending Charts (Last.fm)</h3>
            <button className="text-xs text-ekoro-gold hover:underline">Full chart →</button>
          </div>

          {isTrendingLoading ? (
            <div className="space-y-4 py-6 flex flex-col items-center justify-center text-white/40">
              <Loader2 className="w-6 h-6 animate-spin text-ekoro-gold" />
              <span className="text-xs">Loading live charts...</span>
            </div>
          ) : trendingTracks.length === 0 ? (
            <div className="text-center py-6 text-white/40 text-sm">
              Trending tracks could not be loaded.
            </div>
          ) : (
            <div className="space-y-1">
              {trendingTracks.slice(0, 5).map((track, i) => (
                <TrackRow key={track.id} track={track} index={i} />
              ))}
            </div>
          )}
        </div>

        {/* PRICING PLANS */}
        <div className="bg-ekoro-dark-paper border border-white/5 rounded-xl p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold tracking-tight">Upgrade Your Plan</h3>
              <button className="text-xs text-ekoro-gold hover:underline">Compare plans</button>
            </div>

            <div className="space-y-3">
              {/* Free Plan */}
              <div className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/5">
                <div>
                  <span className="text-3xs px-2 py-0.5 bg-white/10 rounded-full font-bold text-white/60 uppercase">
                    Free
                  </span>
                  <p className="text-xs font-semibold mt-1">128kbps Stream · Standard Downloads</p>
                </div>
                <div className="text-right">
                  <span className="text-base font-extrabold">$0</span>
                </div>
              </div>

              {/* Pro Plan */}
              <div className="flex items-center justify-between p-3 rounded-lg bg-ekoro-blue/10 border border-ekoro-blue/30 relative">
                <div className="absolute -top-2.5 right-4 bg-ekoro-blue text-white text-4xs font-bold px-2 py-0.5 rounded-full">
                  POPULAR
                </div>
                <div>
                  <span className="text-3xs px-2 py-0.5 bg-ekoro-blue/30 rounded-full font-bold text-ekoro-light uppercase">
                    Pro
                  </span>
                  <p className="text-xs font-semibold mt-1">320kbps Stream · Unlimited Offline · Ad Free</p>
                </div>
                <div className="text-right">
                  <span className="text-base font-extrabold text-ekoro-light">$9.99</span>
                  <p className="text-4xs text-white/40">/month</p>
                </div>
              </div>

              {/* Artist Pro Plan */}
              <div className="flex items-center justify-between p-3 rounded-lg bg-ekoro-gold/5 border border-ekoro-gold/20">
                <div>
                  <span className="text-3xs px-2 py-0.5 bg-ekoro-gold/25 rounded-full font-bold text-ekoro-gold uppercase">
                    Artist Pro
                  </span>
                  <p className="text-xs font-semibold mt-1">Lossless FLAC · Upload 500 tracks · Analytics</p>
                </div>
                <div className="text-right">
                  <span className="text-base font-extrabold text-ekoro-gold">$19.99</span>
                  <p className="text-4xs text-white/40">/month</p>
                </div>
              </div>
            </div>
          </div>

          <button className="w-full mt-4 bg-ekoro-blue hover:bg-ekoro-blue/90 text-white font-bold py-2.5 rounded-xl transition-all shadow-md shadow-ekoro-blue/20">
            Upgrade to Pro Plan
          </button>
        </div>
      </div>
    </div>
  );
}
