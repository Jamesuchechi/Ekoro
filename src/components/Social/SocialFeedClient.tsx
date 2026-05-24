"use client";

import React, { useState, useRef, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePlayerStore } from "@/stores/playerStore";
import { Track } from "@/types";
import {
  Play,
  Pause,
  Music,
  Users,
  Check,
  Loader2,
  Radio,
} from "lucide-react";

interface FeedTrack {
  id: string;
  title: string;
  coverArtUrl: string | null;
  durationMs: number;
  genre: string | null;
  playCount: string;
  createdAt: string;
  artist: {
    id: string;
    username: string;
    displayName: string | null;
    avatarUrl: string | null;
    isVerified: boolean;
  };
}

interface FeedResult {
  tracks: FeedTrack[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

interface SocialFeedClientProps {
  initialFeed: FeedResult;
  currentUserId: string;
}

function formatCount(count: bigint | number | string) {
  const num = Number(count);
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
  if (num >= 1_000) return `${(num / 1_000).toFixed(1)}K`;
  return num.toString();
}

function formatDuration(ms: number) {
  const s = Math.floor(ms / 1000);
  return `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function mapToTrack(t: FeedTrack): Track {
  return {
    id: t.id,
    title: t.title,
    artist: t.artist.displayName || t.artist.username,
    plays: formatCount(t.playCount),
    genre: t.genre || undefined,
    duration: formatDuration(t.durationMs),
    coverArtUrl: t.coverArtUrl || undefined,
  };
}

export default function SocialFeedClient({
  initialFeed,
  currentUserId,
}: SocialFeedClientProps) {
  const { currentTrack, isPlaying, setTrack, togglePlay } = usePlayerStore();

  const [tracks, setTracks] = useState<FeedTrack[]>(initialFeed.tracks);
  const [page, setPage] = useState(initialFeed.page);
  const [totalPages] = useState(initialFeed.totalPages);
  const [loadingMore, setLoadingMore] = useState(false);

  const loadNextPage = async () => {
    if (loadingMore || page >= totalPages) return;
    setLoadingMore(true);
    try {
      const res = await fetch(`/api/feed?page=${page + 1}&limit=10`);
      const data = await res.json();
      if (data.success && Array.isArray(data.data.tracks)) {
        setTracks((prev) => [...prev, ...data.data.tracks]);
        setPage(data.data.page);
      }
    } catch (err) {
      console.error("Failed to load more feed tracks:", err);
    } finally {
      setLoadingMore(false);
    }
  };

  // Keep a stable ref to the latest loadNextPage so the IntersectionObserver
  // callback never closes over a stale version of the function.
  const loadNextPageRef = useRef(loadNextPage);
  loadNextPageRef.current = loadNextPage;

  // Intersection Observer for infinite scroll sentinel
  const observer = useRef<IntersectionObserver | null>(null);
  const sentinelRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (loadingMore) return;
      if (observer.current) observer.current.disconnect();
      observer.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && page < totalPages) {
          loadNextPageRef.current();
        }
      });
      if (node) observer.current.observe(node);
    },
    [loadingMore, page, totalPages]  // loadNextPage intentionally omitted — called via stable ref
  );

  const handlePlay = (t: FeedTrack) => {
    if (currentTrack?.id === t.id) {
      togglePlay();
    } else {
      setTrack(mapToTrack(t));
    }
  };

  // ── Empty State ──────────────────────────────────────────────────
  if (tracks.length === 0) {
    return (
      <div className="p-6 max-w-2xl mx-auto space-y-8 animate-page flex flex-col items-center justify-center min-h-[60vh] text-center">
        <div className="w-16 h-16 rounded-full bg-ek-gold-dim border border-ek-gold/20 flex items-center justify-center text-ek-gold mb-2">
          <Radio size={24} />
        </div>
        <div className="space-y-2">
          <h2 className="text-xl font-bold text-white">Your feed is empty</h2>
          <p className="text-sm text-ek-text-secondary max-w-xs mx-auto">
            Follow artists to see their latest releases here.
          </p>
        </div>
        <Link
          href="/explore"
          className="px-5 py-2.5 bg-ek-gold hover:bg-ek-gold/90 text-ek-void rounded-xl text-sm font-semibold transition-all active:scale-[0.97]"
        >
          Discover Artists
        </Link>
      </div>
    );
  }

  // ── Feed ─────────────────────────────────────────────────────────
  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6 animate-page">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-white/5 pb-6">
        <div className="w-8 h-8 rounded-xl bg-ek-gold-dim border border-ek-gold/20 flex items-center justify-center">
          <Users size={14} className="text-ek-gold" />
        </div>
        <div>
          <p className="text-[10px] font-mono uppercase tracking-wider text-ek-text-tertiary">
            Social
          </p>
          <h1 className="text-lg font-bold tracking-tight text-white leading-none">
            Your Feed
          </h1>
        </div>
        <span className="ml-auto text-xs font-mono text-ek-text-muted">
          {initialFeed.total} release{initialFeed.total !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Track Cards */}
      <div className="space-y-3">
        {tracks.map((t) => {
          const isCurrent = currentTrack?.id === t.id;
          const isTrackPlaying = isCurrent && isPlaying;

          return (
            <div
              key={t.id}
              className={`group flex gap-4 items-center p-3 rounded-2xl border transition-all ${
                isCurrent
                  ? "bg-ek-gold-glow border-ek-gold/20"
                  : "bg-white/5 border-white/5 hover:border-white/10"
              }`}
            >
              {/* Cover + Play overlay */}
              <div
                className="relative w-14 h-14 rounded-xl overflow-hidden flex-shrink-0 cursor-pointer bg-white/5 border border-white/5"
                onClick={() => handlePlay(t)}
              >
                {t.coverArtUrl ? (
                  <Image
                    src={t.coverArtUrl}
                    alt={t.title}
                    fill
                    unoptimized
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-ek-text-muted">
                    <Music size={20} />
                  </div>
                )}
                {/* Overlay */}
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                  {isTrackPlaying ? (
                    <Pause size={18} fill="currentColor" className="text-white" />
                  ) : (
                    <Play size={18} fill="currentColor" className="text-white ml-0.5" />
                  )}
                </div>
              </div>

              {/* Track info */}
              <div className="flex-1 min-w-0">
                <button
                  onClick={() => handlePlay(t)}
                  className={`font-semibold text-sm truncate block w-full text-left ${
                    isCurrent ? "text-ek-gold" : "text-white hover:text-ek-gold"
                  } transition-colors`}
                >
                  {t.title}
                </button>

                {/* Artist row */}
                <Link
                  href={`/artist/${t.artist.username}`}
                  className="flex items-center gap-1.5 mt-0.5 w-fit"
                >
                  <div className="relative w-4 h-4 rounded-full overflow-hidden bg-white/10 flex-shrink-0">
                    {t.artist.avatarUrl ? (
                      <Image
                        src={t.artist.avatarUrl}
                        alt={t.artist.displayName || t.artist.username}
                        fill
                        unoptimized
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-ek-raised" />
                    )}
                  </div>
                  <span className="text-xs text-ek-text-secondary hover:text-white transition-colors truncate">
                    {t.artist.displayName || t.artist.username}
                  </span>
                  {t.artist.isVerified && (
                    <Check size={10} className="text-ek-blue flex-shrink-0" strokeWidth={3} />
                  )}
                </Link>

                {/* Meta row */}
                <div className="flex items-center gap-2 mt-1.5 text-[10px] font-mono text-ek-text-muted">
                  {t.genre && (
                    <>
                      <span className="px-1.5 py-0.5 bg-white/5 rounded-full border border-white/5">
                        {t.genre}
                      </span>
                      <span>·</span>
                    </>
                  )}
                  <span>{formatDuration(t.durationMs)}</span>
                  <span>·</span>
                  <span>{formatCount(t.playCount)} plays</span>
                  <span>·</span>
                  <span>{timeAgo(t.createdAt)}</span>
                </div>
              </div>

              {/* Play button (right) */}
              <button
                onClick={() => handlePlay(t)}
                className="w-9 h-9 rounded-full bg-white/5 hover:bg-ek-gold/10 border border-white/5 hover:border-ek-gold/30 flex items-center justify-center text-white transition-all flex-shrink-0"
              >
                {isTrackPlaying ? (
                  <Pause size={14} fill="currentColor" className="text-ek-gold" />
                ) : (
                  <Play size={14} fill="currentColor" className="ml-0.5" />
                )}
              </button>
            </div>
          );
        })}
      </div>

      {/* Infinite scroll sentinel */}
      {page < totalPages && (
        <div ref={sentinelRef} className="flex justify-center py-4">
          {loadingMore && <Loader2 size={18} className="animate-spin text-ek-text-secondary" />}
        </div>
      )}

      {page >= totalPages && tracks.length > 0 && (
        <p className="text-center text-xs text-ek-text-muted py-4 font-mono">
          — You&apos;re all caught up —
        </p>
      )}
    </div>
  );
}
