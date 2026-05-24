"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Play, Pause, Heart, Download, Music, Clock, Calendar, BarChart2, MessageSquare } from "lucide-react";
import { usePlayerStore } from "@/stores/playerStore";

interface Artist {
  id: string;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
  bio?: string | null;
}

interface DBTrack {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  coverArtUrl: string | null;
  durationMs: number;
  genre: string | null;
  mood: string | null;
  bpm: number | null;
  releaseDate: Date | null;
  isDownloadable: boolean;
  downloadPrice: any;
  playCount: string;
  downloadCount: string;
  artist: Artist;
}

interface TrackDetailsClientProps {
  track: DBTrack;
  relatedTracks: any[];
  initialLikesCount: number;
}

export default function TrackDetailsClient({ track, relatedTracks, initialLikesCount }: TrackDetailsClientProps) {
  const { currentTrack, isPlaying, setTrack, togglePlay, likedTracks, toggleLikeTrack, progress, currentTime } =
    usePlayerStore();
  const [commentInput, setCommentInput] = useState("");
  const [comments, setComments] = useState<any[]>([]);
  const [likesCount, setLikesCount] = useState(initialLikesCount);

  useEffect(() => {
    async function fetchComments() {
      try {
        const res = await fetch(`/api/tracks/${track.id}/comments`);
        if (res.ok) {
          const data = await res.json();
          if (data.success && Array.isArray(data.comments)) {
            setComments(data.comments);
          }
        }
      } catch (err) {
        console.error("Failed to fetch comments:", err);
      }
    }
    fetchComments();
  }, [track.id]);

  const isCurrent = currentTrack?.id === track.id;
  const isPlayingThis = isCurrent && isPlaying;
  const isLiked = likedTracks.includes(track.id);

  // Format plays
  const playsNum = parseInt(track.playCount || "0", 10);
  let playsStr = `${playsNum}`;
  if (playsNum >= 1000000) playsStr = `${(playsNum / 1000000).toFixed(1)}M`;
  else if (playsNum >= 1000) playsStr = `${(playsNum / 1000).toFixed(1)}K`;

  // Format duration
  const totalSeconds = Math.floor(track.durationMs / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  const durationStr = `${minutes}:${seconds.toString().padStart(2, "0")}`;

  // Get cover art URL
  const getCoverUrl = (url: string | null) => {
    if (!url) return "/images/default-cover.jpg";
    if (url.startsWith("http") || url.startsWith("/")) {
      return url;
    }
    return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/tracks/${url}`;
  };

  const getArtistAvatar = (url: string | null) => {
    if (!url) return null;
    if (url.startsWith("http") || url.startsWith("/")) {
      return url;
    }
    return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/avatars/${url}`;
  };

  // Convert DB Track to Player Store Track type
  const getFrontendTrack = (t: any): any => {
    const artistName = t.artist?.displayName || t.artist?.username || "Unknown Artist";
    const coverUrl = getCoverUrl(t.coverArtUrl);
    
    // Format duration
    const totSec = Math.floor((t.durationMs || 0) / 1000);
    const mins = Math.floor(totSec / 60);
    const secs = totSec % 60;
    const durStr = `${mins}:${secs.toString().padStart(2, "0")}`;

    return {
      id: t.id,
      title: t.title,
      artist: artistName,
      duration: durStr,
      cover: coverUrl,
      genre: t.genre || "Alternative",
      color: "from-blue-600 to-indigo-900",
      emoji: "🔥",
    };
  };

  const handlePlayToggle = () => {
    if (isCurrent) {
      togglePlay();
    } else {
      setTrack(getFrontendTrack(track));
    }
  };

  const handleDownload = async () => {
    try {
      const res = await fetch(`/api/tracks/${track.id}/dl`);
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.downloadUrl) {
          window.open(data.downloadUrl, "_blank");
        }
      }
    } catch (err) {
      console.error("Download failed:", err);
    }
  };

  const handlePostComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentInput.trim()) return;
    try {
      const res = await fetch(`/api/tracks/${track.id}/comments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ text: commentInput }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.comment) {
          setComments((prev) => [data.comment, ...prev]);
          setCommentInput("");
        }
      }
    } catch (err) {
      console.error("Failed to post comment:", err);
    }
  };

  // Pre-seed static peaks heights for waveform
  const waveformPeaks = [
    25, 40, 35, 50, 45, 60, 55, 70, 65, 80, 75, 90, 85, 95, 88, 72, 65, 55, 48, 35, 
    20, 15, 30, 42, 55, 68, 75, 84, 90, 78, 62, 55, 40, 30, 25, 42, 50, 65, 75, 85, 
    92, 80, 68, 54, 45, 38, 25, 18, 32, 45, 58, 70, 78, 88, 92, 85, 72, 60, 48, 35, 
    28, 40, 55, 68, 72, 80, 85, 90, 78, 64, 52, 40, 32, 25, 18, 30, 45, 58, 62, 48, 
    35, 25, 38, 48, 55, 68, 75, 82, 90, 85, 72, 60, 48, 38, 28, 15, 25, 35, 40, 20
  ];

  const handleWaveformClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isCurrent) {
      // Play first if not current
      setTrack(getFrontendTrack(track));
      return;
    }
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const percent = Math.max(0, Math.min(100, (clickX / rect.width) * 100));
    const targetTime = (percent / 100) * totalSeconds;
    
    // Dispatch seek event to global player
    window.dispatchEvent(new CustomEvent("ekoro:seek", { detail: { time: targetTime } }));
  };

  return (
    <div
      style={{
        minHeight: "100%",
        background: "var(--ek-void)",
        color: "var(--ek-text-primary)",
        position: "relative",
        overflow: "hidden",
        padding: "40px",
      }}
    >
      {/* Glow Backdrop */}
      <div
        style={{
          position: "absolute",
          top: -120,
          left: -120,
          width: 500,
          height: 500,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(201,168,76,0.06) 0%, transparent 70%)",
          pointerEvents: "none",
          zIndex: 0,
        }}
      />

      <div style={{ position: "relative", zIndex: 1, maxWidth: 1040, margin: "0 auto" }}>
        
        {/* Breadcrumb / Back button */}
        <Link href="/">
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              fontSize: 12,
              color: "var(--ek-text-secondary)",
              marginBottom: 32,
              cursor: "pointer",
              transition: "color 0.2s ease",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "var(--ek-text-primary)")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "var(--ek-text-secondary)")}
          >
            ← Back to explore
          </div>
        </Link>

        {/* 1. Track Header */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "250px 1fr",
            gap: 40,
            alignItems: "end",
            marginBottom: 48,
          }}
        >
          {/* Cover Art */}
          <div
            style={{
              width: 250,
              height: 250,
              borderRadius: 20,
              overflow: "hidden",
              border: "1px solid var(--ek-border-mid)",
              background: "var(--ek-raised)",
              position: "relative",
              boxShadow: "0 20px 40px rgba(0,0,0,0.4)",
            }}
          >
            <Image
              src={getCoverUrl(track.coverArtUrl)}
              alt={track.title}
              fill
              unoptimized
              style={{ objectFit: "cover" }}
              priority
            />
          </div>

          {/* Text & Actions */}
          <div style={{ minWidth: 0 }}>
            {/* Badges */}
            <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
              {track.genre && (
                <span
                  style={{
                    background: "var(--ek-surface)",
                    border: "1px solid var(--ek-border-mid)",
                    borderRadius: 99,
                    padding: "4px 12px",
                    fontSize: 11,
                    fontWeight: 500,
                    color: "var(--ek-gold)",
                    fontFamily: "var(--font-mono)",
                    textTransform: "uppercase",
                  }}
                >
                  {track.genre}
                </span>
              )}
              {track.mood && (
                <span
                  style={{
                    background: "var(--ek-surface)",
                    border: "1px solid var(--ek-border-mid)",
                    borderRadius: 99,
                    padding: "4px 12px",
                    fontSize: 11,
                    fontWeight: 500,
                    color: "var(--ek-text-secondary)",
                    fontFamily: "var(--font-mono)",
                    textTransform: "uppercase",
                  }}
                >
                  {track.mood}
                </span>
              )}
            </div>

            {/* Title */}
            <h1
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "clamp(32px, 5vw, 48px)",
                fontWeight: 400,
                lineHeight: 1.1,
                letterSpacing: "-0.02em",
                marginBottom: 16,
                color: "var(--ek-text-primary)",
              }}
            >
              {track.title}
            </h1>

            {/* Artist Info */}
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 32 }}>
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: "50%",
                  overflow: "hidden",
                  background: "var(--ek-raised)",
                  border: "1px solid var(--ek-border)",
                  position: "relative",
                }}
              >
                {getArtistAvatar(track.artist.avatarUrl) ? (
                  <Image
                    src={getArtistAvatar(track.artist.avatarUrl)!}
                    alt={track.artist.displayName || track.artist.username}
                    fill
                    unoptimized
                    style={{ objectFit: "cover" }}
                  />
                ) : (
                  <div
                    style={{
                      width: "100%",
                      height: "100%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 10,
                      fontWeight: 600,
                      color: "var(--ek-gold)",
                    }}
                  >
                    {track.artist.displayName?.slice(0, 2).toUpperCase() || track.artist.username.slice(0, 2).toUpperCase()}
                  </div>
                )}
              </div>
              <div>
                <Link href={`/artist/${track.artist.username}`}>
                  <span
                    style={{
                      fontSize: 14,
                      fontWeight: 600,
                      color: "var(--ek-text-primary)",
                      cursor: "pointer",
                    }}
                  >
                    {track.artist.displayName || track.artist.username}
                  </span>
                </Link>
                <div style={{ fontSize: 12, color: "var(--ek-text-secondary)" }}>
                  @{track.artist.username}
                </div>
              </div>
            </div>

            {/* CTA Controls Row */}
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              {/* Play Button */}
              <button
                onClick={handlePlayToggle}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  background: "var(--ek-gold)",
                  color: "#0f0f0f",
                  border: "none",
                  borderRadius: 99,
                  padding: "14px 28px",
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: "pointer",
                  transition: "all 0.2s var(--ease-out-expo)",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "scale(1.03)";
                  e.currentTarget.style.background = "#d4af5a";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "scale(1)";
                  e.currentTarget.style.background = "var(--ek-gold)";
                }}
              >
                {isPlayingThis ? <Pause size={16} fill="currentColor" /> : <Play size={16} fill="currentColor" />}
                {isPlayingThis ? "Pause" : "Play"}
              </button>

              {/* Like Button */}
              <button
                onClick={() => {
                  toggleLikeTrack(track.id);
                  setLikesCount((prev) => (isLiked ? prev - 1 : prev + 1));
                }}
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: "50%",
                  background: "transparent",
                  border: `1px solid ${isLiked ? "var(--ek-red)" : "var(--ek-border-mid)"}`,
                  color: isLiked ? "var(--ek-red)" : "var(--ek-text-secondary)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                }}
                onMouseEnter={(e) => {
                  if (!isLiked) e.currentTarget.style.borderColor = "var(--ek-border-hi)";
                }}
                onMouseLeave={(e) => {
                  if (!isLiked) e.currentTarget.style.borderColor = "var(--ek-border-mid)";
                }}
              >
                <Heart size={18} fill={isLiked ? "currentColor" : "none"} />
              </button>

              {/* Download Button */}
              {track.isDownloadable && (
                <button
                  onClick={handleDownload}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    background: "transparent",
                    color: "var(--ek-text-secondary)",
                    border: "1px solid var(--ek-border-mid)",
                    borderRadius: 99,
                    padding: "14px 22px",
                    fontSize: 13,
                    fontWeight: 500,
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = "var(--ek-border-hi)";
                    e.currentTarget.style.color = "var(--ek-text-primary)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = "var(--ek-border-mid)";
                    e.currentTarget.style.color = "var(--ek-text-secondary)";
                  }}
                >
                  <Download size={15} />
                  Download
                </button>
              )}
            </div>
          </div>
        </div>

        {/* 2. Waveform Visualizer */}
        <div
          style={{
            background: "var(--ek-raised)",
            border: "1px solid var(--ek-border)",
            borderRadius: 20,
            padding: "24px 32px",
            marginBottom: 48,
          }}
        >
          <div
            onClick={handleWaveformClick}
            style={{
              display: "flex",
              alignItems: "flex-end",
              gap: 4,
              height: 100,
              cursor: "pointer",
              position: "relative",
            }}
          >
            {waveformPeaks.map((peak, idx) => {
              const barPercent = (idx / waveformPeaks.length) * 100;
              const isFilled = isCurrent && progress >= barPercent;

              return (
                <div
                  key={idx}
                  style={{
                    flex: 1,
                    height: `${peak}%`,
                    borderRadius: 99,
                    background: isFilled ? "var(--ek-gold)" : "var(--ek-border-hi)",
                    opacity: isFilled ? 1 : 0.45,
                    transition: "background 0.2s, opacity 0.2s",
                  }}
                />
              );
            })}
          </div>

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              fontSize: 11,
              fontFamily: "var(--font-mono)",
              color: "var(--ek-text-tertiary)",
              marginTop: 12,
            }}
          >
            <span>{isCurrent ? `${Math.floor(currentTime / 60)}:${Math.floor(currentTime % 60).toString().padStart(2, "0")}` : "0:00"}</span>
            <span>{durationStr}</span>
          </div>
        </div>

        {/* 3. Main Grid layout: Comments & Info / Related Tracks */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: 48 }}>
          
          {/* Left Column: Comments */}
          <div>
            <h3
              style={{
                fontFamily: "var(--font-display)",
                fontSize: 18,
                fontWeight: 500,
                color: "var(--ek-text-primary)",
                marginBottom: 20,
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <MessageSquare size={16} />
              Comments ({comments.length})
            </h3>

            {/* Comment Form */}
            <form onSubmit={handlePostComment} style={{ marginBottom: 32 }}>
              <div
                style={{
                  display: "flex",
                  gap: 12,
                  background: "var(--ek-raised)",
                  border: "1px solid var(--ek-border)",
                  borderRadius: 14,
                  padding: "10px",
                }}
              >
                <input
                  type="text"
                  placeholder="Write a comment..."
                  value={commentInput}
                  onChange={(e) => setCommentInput(e.target.value)}
                  style={{
                    flex: 1,
                    background: "transparent",
                    border: "none",
                    outline: "none",
                    color: "var(--ek-text-primary)",
                    fontSize: 13,
                    padding: "8px 12px",
                  }}
                />
                <button
                  type="submit"
                  disabled={!commentInput.trim()}
                  style={{
                    background: commentInput.trim() ? "var(--ek-gold)" : "var(--ek-surface)",
                    color: commentInput.trim() ? "#0f0f0f" : "var(--ek-text-muted)",
                    border: "none",
                    borderRadius: 8,
                    padding: "8px 16px",
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: commentInput.trim() ? "pointer" : "default",
                    transition: "all 0.2s ease",
                  }}
                >
                  Post
                </button>
              </div>
            </form>

            {/* Comments List */}
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {comments.map((comment) => {
                const displayName = comment.user?.displayName || comment.user?.username || "Anonymous";
                const initials = displayName.slice(0, 2).toUpperCase();
                const formattedTime = new Date(comment.createdAt).toLocaleDateString(undefined, {
                  month: "short",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                });

                return (
                  <div
                    key={comment.id}
                    style={{
                      display: "flex",
                      gap: 12,
                      background: "var(--ek-raised)",
                      border: "1px solid var(--ek-border-dim)",
                      borderRadius: 14,
                      padding: "16px",
                    }}
                  >
                    <div
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: "50%",
                        background: "var(--ek-surface)",
                        border: "1px solid var(--ek-border-mid)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontFamily: "var(--font-mono)",
                        fontSize: 11,
                        fontWeight: 600,
                        color: "var(--ek-gold)",
                        flexShrink: 0,
                      }}
                    >
                      {initials}
                    </div>
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                        <span style={{ fontSize: 13, fontWeight: 600 }}>{displayName}</span>
                        <span style={{ fontSize: 11, color: "var(--ek-text-muted)" }}>{formattedTime}</span>
                      </div>
                      <p style={{ fontSize: 13, color: "var(--ek-text-secondary)", lineHeight: 1.5 }}>
                        {comment.body}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Column: Track Details & Related Tracks */}
          <div>
            {/* Track Info Card */}
            <div
              style={{
                background: "var(--ek-raised)",
                border: "1px solid var(--ek-border)",
                borderRadius: 16,
                padding: "20px",
                marginBottom: 32,
              }}
            >
              <h4 style={{ fontSize: 14, fontWeight: 600, color: "var(--ek-text-primary)", marginBottom: 16 }}>
                Track Info
              </h4>

              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
                  <span style={{ color: "var(--ek-text-tertiary)", display: "flex", alignItems: "center", gap: 6 }}>
                    <BarChart2 size={13} /> Plays
                  </span>
                  <span style={{ fontFamily: "var(--font-mono)", fontWeight: 500 }}>{playsStr}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
                  <span style={{ color: "var(--ek-text-tertiary)", display: "flex", alignItems: "center", gap: 6 }}>
                    <Heart size={13} style={{ color: isLiked ? "var(--ek-red)" : "inherit" }} /> Likes
                  </span>
                  <span style={{ fontFamily: "var(--font-mono)", fontWeight: 500 }}>{likesCount}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
                  <span style={{ color: "var(--ek-text-tertiary)", display: "flex", alignItems: "center", gap: 6 }}>
                    <Clock size={13} /> Duration
                  </span>
                  <span style={{ fontFamily: "var(--font-mono)", fontWeight: 500 }}>{durationStr}</span>
                </div>
                {track.bpm && (
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
                    <span style={{ color: "var(--ek-text-tertiary)", display: "flex", alignItems: "center", gap: 6 }}>
                      <Music size={13} /> Tempo
                    </span>
                    <span style={{ fontFamily: "var(--font-mono)", fontWeight: 500 }}>{track.bpm} BPM</span>
                  </div>
                )}
                {track.releaseDate && (
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
                    <span style={{ color: "var(--ek-text-tertiary)", display: "flex", alignItems: "center", gap: 6 }}>
                      <Calendar size={13} /> Released
                    </span>
                    <span style={{ fontFamily: "var(--font-mono)", fontWeight: 500 }}>
                      {new Date(track.releaseDate).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Related Tracks */}
            <div>
              <h4 style={{ fontSize: 14, fontWeight: 600, color: "var(--ek-text-primary)", marginBottom: 16 }}>
                Related Tracks
              </h4>

              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {relatedTracks.length === 0 ? (
                  <div style={{ fontSize: 12, color: "var(--ek-text-tertiary)", fontStyle: "italic" }}>
                    No related tracks found.
                  </div>
                ) : (
                  relatedTracks.map((relTrack) => {
                    const isRelCurrent = currentTrack?.id === relTrack.id;
                    const isRelPlaying = isRelCurrent && isPlaying;

                    return (
                      <div
                        key={relTrack.id}
                        onClick={() => setTrack(getFrontendTrack(relTrack))}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 12,
                          padding: "10px",
                          borderRadius: 12,
                          background: "var(--ek-surface)",
                          border: "1px solid var(--ek-border-dim)",
                          cursor: "pointer",
                          transition: "all 0.2s ease",
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.borderColor = "var(--ek-border-mid)")}
                        onMouseLeave={(e) => (e.currentTarget.style.borderColor = "var(--ek-border-dim)")}
                      >
                        <div
                          style={{
                            width: 36,
                            height: 36,
                            borderRadius: 8,
                            overflow: "hidden",
                            background: "var(--ek-raised)",
                            position: "relative",
                            flexShrink: 0,
                          }}
                        >
                          <Image
                            src={getCoverUrl(relTrack.coverArtUrl)}
                            alt={relTrack.title}
                            fill
                            unoptimized
                            style={{ objectFit: "cover" }}
                          />
                          <div
                            style={{
                              position: "absolute",
                              inset: 0,
                              background: "rgba(0,0,0,0.4)",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              color: "var(--ek-gold)",
                            }}
                          >
                            {isRelPlaying ? <Pause size={12} fill="currentColor" /> : <Play size={12} fill="currentColor" />}
                          </div>
                        </div>

                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div
                            style={{
                              fontSize: 12,
                              fontWeight: 500,
                              color: "var(--ek-text-primary)",
                              whiteSpace: "nowrap",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                            }}
                          >
                            {relTrack.title}
                          </div>
                          <div
                            style={{
                              fontSize: 11,
                              color: "var(--ek-text-secondary)",
                              whiteSpace: "nowrap",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                            }}
                          >
                            {relTrack.artist?.displayName || relTrack.artist?.username}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}
