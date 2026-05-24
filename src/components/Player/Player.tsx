"use client";

import React, { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Hls from "hls.js";
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
  ChevronDown,
  Maximize2,
  Loader2,
} from "lucide-react";
import { usePlayerStore } from "@/stores/playerStore";

export default function Player() {
  const {
    currentTrack,
    isPlaying,
    isBuffering,
    volume,
    progress,
    currentTime,
    likedTracks,
    togglePlay,
    setIsPlaying,
    setIsBuffering,
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
  const [isMobile, setIsMobile] = useState(false);
  const [duration, setDuration] = useState(0);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const hlsRef = useRef<Hls | null>(null);
  const hasLoggedPlay = useRef(false);
  const progressRef = useRef<HTMLDivElement>(null);
  const progressMobileRef = useRef<HTMLDivElement>(null);

  // 1. Detect screen size for mobile layout
  useEffect(() => {
    const checkSize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkSize();
    window.addEventListener("resize", checkSize);
    return () => window.removeEventListener("resize", checkSize);
  }, []);

  // 2. Initialize native Audio element on mount
  useEffect(() => {
    audioRef.current = new Audio();
    
    const audio = audioRef.current;

    const handleTimeUpdate = () => {
      if (!audio.duration || isNaN(audio.duration)) return;
      setCurrentTime(audio.currentTime);
      setProgress((audio.currentTime / audio.duration) * 100);

      // Track 30 seconds of listening for analytics play logger
      if (audio.currentTime >= 30 && !hasLoggedPlay.current && currentTrack) {
        hasLoggedPlay.current = true;
        fetch(`/api/tracks/${currentTrack.id}/play`, { method: "POST" })
          .catch((err) => console.error("Failed to log play event:", err));
      }
    };

    const handleDurationChange = () => {
      if (!isNaN(audio.duration)) {
        setDuration(audio.duration);
      }
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setProgress(0);
      setCurrentTime(0);
    };

    const handleWaiting = () => {
      setIsBuffering(true);
    };

    const handlePlaying = () => {
      setIsBuffering(false);
    };

    audio.addEventListener("timeupdate", handleTimeUpdate);
    audio.addEventListener("durationchange", handleDurationChange);
    audio.addEventListener("ended", handleEnded);
    audio.addEventListener("waiting", handleWaiting);
    audio.addEventListener("playing", handlePlaying);
    audio.addEventListener("canplay", handlePlaying);

    return () => {
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.removeEventListener("durationchange", handleDurationChange);
      audio.removeEventListener("ended", handleEnded);
      audio.removeEventListener("waiting", handleWaiting);
      audio.removeEventListener("playing", handlePlaying);
      audio.removeEventListener("canplay", handlePlaying);
      audio.pause();
      if (hlsRef.current) {
        hlsRef.current.destroy();
      }
    };
  }, [currentTrack, setCurrentTime, setProgress, setIsPlaying, setIsBuffering]);

  // 3. Handle loading new track stream (supports HLS & standard MP3 fallback)
  useEffect(() => {
    if (!currentTrack || !audioRef.current) return;

    const loadStream = async () => {
      hasLoggedPlay.current = false;
      const audio = audioRef.current!;

      try {
        // Fetch quality-validated streaming path
        const res = await fetch(`/api/tracks/${currentTrack.id}/stream`);
        if (!res.ok) throw new Error("Failed to fetch stream details");
        
        const data = await res.json();
        const streamUrl = data.streamUrl;
        const isHls = data.type === "hls_adaptive";

        // Clean up previous Hls stream
        if (hlsRef.current) {
          hlsRef.current.destroy();
          hlsRef.current = null;
        }

        if (isHls && Hls.isSupported()) {
          const hls = new Hls({
            maxMaxBufferLength: 10,
          });
          hlsRef.current = hls;
          hls.loadSource(streamUrl);
          hls.attachMedia(audio);
          hls.on(Hls.Events.MANIFEST_PARSED, () => {
            const activeIsPlaying = usePlayerStore.getState().isPlaying;
            if (activeIsPlaying) {
              audio.play().catch((err) => console.log("HLS Play failed:", err));
            }
          });
        } else if (audio.canPlayType("application/vnd.apple.mpegurl")) {
          // Native support (Safari)
          audio.src = streamUrl;
          const activeIsPlaying = usePlayerStore.getState().isPlaying;
          if (activeIsPlaying) {
            audio.play().catch((err) => console.log("Native HLS Play failed:", err));
          }
        } else {
          // Standard audio files (MP3/WAV/etc.)
          audio.src = streamUrl;
          const activeIsPlaying = usePlayerStore.getState().isPlaying;
          if (activeIsPlaying) {
            audio.play().catch((err) => console.log("Fallback Play failed:", err));
          }
        }
      } catch (error) {
        console.error("Stream playback setup error:", error);
      }
    };

    loadStream();
  }, [currentTrack]);

  // 4. Handle play/pause changes
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !audio.src) return;

    if (isPlaying) {
      audio.play().catch((err) => console.log("Audio play deferred:", err));
    } else {
      audio.pause();
    }
  }, [isPlaying]);

  // 5. Handle volume and mute
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.volume = muted ? 0 : volume / 100;
  }, [volume, muted]);

  // 5.5 Handle custom window seek events (e.g. from waveform visualizer)
  useEffect(() => {
    const handleSeekEvent = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (audioRef.current && typeof customEvent.detail?.time === "number") {
        const newTime = customEvent.detail.time;
        audioRef.current.currentTime = newTime;
        setCurrentTime(newTime);
        const dur = audioRef.current.duration || 1;
        setProgress((newTime / dur) * 100);
      }
    };
    window.addEventListener("ekoro:seek", handleSeekEvent);
    return () => window.removeEventListener("ekoro:seek", handleSeekEvent);
  }, [setCurrentTime, setProgress]);

  if (!currentTrack) return null;

  // Helpers
  const formatTime = (secs: number) => {
    if (isNaN(secs) || secs === Infinity) return "0:00";
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  const getCoverUrl = (track: any) => {
    if (!track) return null;
    const cover = track.cover || track.coverArtUrl;
    if (!cover) return null;
    if (cover.startsWith("http://") || cover.startsWith("https://") || cover.startsWith("/")) {
      return cover;
    }
    return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/covers/${cover}`;
  };

  const handleProgressSeek = (e: React.MouseEvent<HTMLDivElement>, isMobileView = false) => {
    const targetRef = isMobileView ? progressMobileRef : progressRef;
    if (!targetRef.current || !audioRef.current || isNaN(duration)) return;

    const rect = targetRef.current.getBoundingClientRect();
    const pct = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
    setProgress(pct);
    const newTime = (pct / 100) * duration;
    setCurrentTime(newTime);
    audioRef.current.currentTime = newTime;
  };

  const isLiked = likedTracks.includes(currentTrack.id);
  const remainingTime = duration - currentTime;

  return (
    <footer
      style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 50,
        background: "rgba(8, 8, 8, 0.95)",
        backdropFilter: "blur(24px)",
        WebkitBackdropFilter: "blur(24px)",
        borderTop: "1px solid var(--ek-border-mid)",
        height: expanded ? (isMobile ? "100vh" : 280) : 70,
        transition: "all 0.35s var(--ease-out-expo)",
        overflow: "hidden",
      }}
    >
      {/* ----------------- MOBILE FULL SCREEN PLAYER ----------------- */}
      {expanded && isMobile ? (
        <div
          style={{
            height: "100%",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            padding: "24px",
            background: "linear-gradient(180deg, #121212 0%, #080808 100%)",
          }}
        >
          {/* Top header bar */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <button
              onClick={() => setExpanded(false)}
              style={{
                background: "none",
                border: "none",
                color: "var(--ek-text-secondary)",
                display: "flex",
                padding: 8,
              }}
            >
              <ChevronDown size={24} />
            </button>
            <div style={{ fontSize: 11, fontWeight: 500, letterSpacing: "0.08em", color: "var(--ek-text-secondary)" }}>
              NOW STREAMING
            </div>
            <div style={{ width: 40 }} />
          </div>

          {/* Large cover art */}
          <div style={{ display: "flex", justifyContent: "center", margin: "24px 0" }}>
            <div
              style={{
                width: 260,
                height: 260,
                borderRadius: 16,
                overflow: "hidden",
                boxShadow: "0 12px 32px rgba(0, 0, 0, 0.5)",
                position: "relative",
                background: "var(--ek-surface)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 64,
                border: "1px solid var(--ek-border-mid)",
              }}
            >
              {getCoverUrl(currentTrack) ? (
                <Image
                  src={getCoverUrl(currentTrack)!}
                  alt={currentTrack.title}
                  fill
                  unoptimized
                  style={{ objectFit: "cover" }}
                />
              ) : (
                currentTrack.emoji || "🎵"
              )}
            </div>
          </div>

          {/* Metadata & Liked state */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ minWidth: 0, flex: 1 }}>
              <h2
                style={{
                  fontSize: 22,
                  fontWeight: 600,
                  color: "var(--ek-text-primary)",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {currentTrack.title}
              </h2>
              <p
                style={{
                  fontSize: 14,
                  color: "var(--ek-text-secondary)",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  marginTop: 2,
                }}
              >
                {currentTrack.artist}
              </p>
            </div>
            <button
              onClick={() => toggleLikeTrack(currentTrack.id)}
              style={{
                background: "none",
                border: "none",
                color: isLiked ? "var(--ek-red)" : "var(--ek-text-secondary)",
                padding: 8,
              }}
            >
              <Heart size={22} fill={isLiked ? "currentColor" : "none"} />
            </button>
          </div>

          {/* Mobile slider and time trackers */}
          <div>
            <div
              ref={progressMobileRef}
              onClick={(e) => handleProgressSeek(e, true)}
              style={{
                height: 6,
                background: "var(--ek-border)",
                borderRadius: 99,
                cursor: "pointer",
                position: "relative",
                marginBottom: 8,
              }}
            >
              <div
                style={{
                  height: "100%",
                  width: `${progress}%`,
                  background: "linear-gradient(90deg, var(--ek-gold), #e8c563)",
                  borderRadius: 99,
                }}
              />
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "var(--ek-text-tertiary)" }}>
              <span>{formatTime(currentTime)}</span>
              <span>-{formatTime(remainingTime > 0 ? remainingTime : 0)}</span>
            </div>
          </div>

          {/* Full control actions */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0 16px" }}>
            <button
              onClick={() => setShuffle(!shuffle)}
              style={{ background: "none", border: "none", color: shuffle ? "var(--ek-gold)" : "var(--ek-text-muted)" }}
            >
              <Shuffle size={18} />
            </button>
            <button style={{ background: "none", border: "none", color: "var(--ek-text-primary)" }}>
              <SkipBack size={26} fill="currentColor" />
            </button>
            <button
              onClick={togglePlay}
              style={{
                width: 64,
                height: 64,
                borderRadius: "50%",
                background: "var(--ek-text-primary)",
                border: "none",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "var(--ek-void)",
              }}
            >
              {isBuffering ? <Loader2 size={28} className="animate-spin" /> : isPlaying ? <Pause size={28} fill="currentColor" /> : <Play size={28} fill="currentColor" style={{ marginLeft: 4 }} />}
            </button>
            <button style={{ background: "none", border: "none", color: "var(--ek-text-primary)" }}>
              <SkipForward size={26} fill="currentColor" />
            </button>
            <button
              onClick={() => setRepeat(!repeat)}
              style={{ background: "none", border: "none", color: repeat ? "var(--ek-gold)" : "var(--ek-text-muted)" }}
            >
              <Repeat size={18} />
            </button>
          </div>

          {/* Mobile Bottom volume control */}
          <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "0 12px" }}>
            <button onClick={() => setMuted(!muted)} style={{ background: "none", border: "none", color: "var(--ek-text-secondary)" }}>
              {muted ? <VolumeX size={18} /> : <Volume2 size={18} />}
            </button>
            <div
              style={{
                flex: 1,
                height: 4,
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
                }}
              />
            </div>
          </div>
        </div>
      ) : (
        /* ----------------- STANDARD & TABLET PLAYER VIEW ----------------- */
        <>
          {/* Progress bar — full width at very top */}
          <div
            ref={progressRef}
            onClick={(e) => handleProgressSeek(e, false)}
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
                transition: seeking ? "none" : "width 0.1s linear",
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
              padding: isMobile ? "0 16px" : "0 24px",
              justifyContent: "space-between",
            }}
          >
            {/* Track info — left */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                width: isMobile ? "auto" : 280,
                flex: isMobile ? 1 : "initial",
                minWidth: 0,
              }}
              onClick={() => isMobile && setExpanded(true)}
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
                {getCoverUrl(currentTrack) ? (
                  <Image
                    src={getCoverUrl(currentTrack)!}
                    alt={currentTrack.title}
                    fill
                    unoptimized
                    style={{ objectFit: "cover" }}
                    sizes="42px"
                  />
                ) : (
                  <span>{currentTrack.emoji || "🎵"}</span>
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

              {/* Like + download (hidden on small mobile screens to prevent cramming) */}
              {!isMobile && (
                <div style={{ display: "flex", gap: 8, alignItems: "center", flexShrink: 0, marginLeft: 8 }}>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleLikeTrack(currentTrack.id);
                    }}
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
              )}
            </div>

            {/* Controls — center */}
            <div
              style={{
                flex: 1,
                display: isMobile ? "none" : "flex",
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
                  }}
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
                >
                  {isBuffering ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : isPlaying ? (
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
                  }}
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

            {/* Play/pause toggle for mobile (compact layout) */}
            {isMobile && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  togglePlay();
                }}
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
                  marginRight: 10,
                }}
              >
                {isBuffering ? <Loader2 size={16} className="animate-spin" /> : isPlaying ? <Pause size={16} fill="currentColor" /> : <Play size={16} fill="currentColor" style={{ marginLeft: 2 }} />}
              </button>
            )}

            {/* Right controls */}
            <div
              style={{
                width: isMobile ? "auto" : 240,
                display: "flex",
                alignItems: "center",
                justifyContent: "flex-end",
                gap: 14,
                flexShrink: 0,
              }}
            >
              {/* Quality badge (hidden on mobile) */}
              {!isMobile && (
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
                  LOSSLESS
                </div>
              )}

              {/* Volume (hidden on mobile) */}
              {!isMobile && (
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
              )}

              {/* Expand button */}
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
                <Maximize2 size={14} />
              </button>
            </div>
          </div>

          {/* Expanded view for Tablet/Desktop */}
          {expanded && !isMobile && (
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
                {getCoverUrl(currentTrack) ? (
                  <Image
                    src={getCoverUrl(currentTrack)!}
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
                    { label: "SAMPLE RATE", value: "48kHz" },
                    { label: "BITRATE", value: "Adaptive Lossless" },
                    { label: "GENRE", value: currentTrack.genre || "Electronic" },
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
                  {isPlaying ? "Streaming" : "Paused"}
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
        </>
      )}
    </footer>
  );
}
