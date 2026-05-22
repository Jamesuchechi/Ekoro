"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import {
  Play,
  Pause,
  Sparkles,
  Loader2,
  Heart,
  MessageSquare,
  Share2,
  DollarSign,
  Disc,
  Users,
  CheckCircle2,
  ArrowRight,
  Flame,
  Globe,
  Radio,
  Send,
  MessageCircle,
  HelpCircle,
  Coins,
  Music,
  ShoppingBag,
  ExternalLink
} from "lucide-react";
import { Track } from "@/types";
import { usePlayerStore } from "@/stores/playerStore";
import TrackCard from "@/components/Track/TrackCard";
import TrackRow from "@/components/Track/TrackRow";

interface PatronActivity {
  id: number;
  name: string;
  action: string;
  amount: number;
  artist: string;
  track: string;
  time: string;
  message: string;
  avatar: string;
}

interface WaveformComment {
  id: number;
  user: string;
  avatar: string;
  text: string;
  timePercent: number; // position on waveform (0-100)
  timestamp: string; // e.g. "0:45"
}

export default function Home() {
  const { currentTrack, isPlaying, setTrack, togglePlay, likedTracks, toggleLikeTrack } = usePlayerStore();
  const [activeTab, setActiveTab] = useState<string>("For You");
  const [trendingTracks, setTrendingTracks] = useState<Track[]>([]);
  const [featuredTracks, setFeaturedTracks] = useState<Track[]>([]);

  // Loading states
  const [isTrendingLoading, setIsTrendingLoading] = useState(true);
  const [isFeaturedLoading, setIsFeaturedLoading] = useState(true);

  // Bandcamp Support / Tipping State
  const [tipAmount, setTipAmount] = useState<string>("10");
  const [customTip, setCustomTip] = useState<string>("");
  const [supportMessage, setSupportMessage] = useState<string>("");
  const [isSupporting, setIsSupporting] = useState<boolean>(false);
  const [supportSuccess, setSupportSuccess] = useState<boolean>(false);

  // Patronage Feed (Live Activity Feed)
  const [patrons, setPatrons] = useState<PatronActivity[]>([
    {
      id: 1,
      name: "Tunde Alao",
      action: "purchased limited vinyl",
      amount: 35.00,
      artist: "Wizkid",
      track: "Essence LP",
      time: "Just now",
      message: "This record is pure gold. Best pressing of the year!",
      avatar: "TA",
    },
    {
      id: 2,
      name: "Sarah Jenkins",
      action: "supported with tip",
      amount: 15.00,
      artist: "Rema",
      track: "Soweto (HLS Quality)",
      time: "4m ago",
      message: "The 320kbps master is exceptionally clean. Keep it up!",
      avatar: "SJ",
    },
    {
      id: 3,
      name: "Nnamdi O.",
      action: "subscribed to Artist Circle",
      amount: 8.99,
      artist: "Tems",
      track: "Monthly Support",
      time: "12m ago",
      message: "Glad to support directly rather than pennies from streaming.",
      avatar: "NO",
    },
    {
      id: 4,
      name: "David K.",
      action: "purchased digital track",
      amount: 5.00,
      artist: "Asake",
      track: "Only Me (FLAC Lossless)",
      time: "24m ago",
      message: "Massive bass. Sounds incredible on high-end speakers.",
      avatar: "DK",
    }
  ]);

  // SoundCloud-Style Waveform Comments
  const [waveComments, setWaveComments] = useState<WaveformComment[]>([
    { id: 1, user: "Seyi V.", avatar: "SV", text: "That intro sample is crazy! 🤯", timePercent: 12, timestamp: "0:25" },
    { id: 2, user: "Femi A.", avatar: "FA", text: "Tems' vocals entering here gives goosebumps", timePercent: 35, timestamp: "1:15" },
    { id: 3, user: "Elena", avatar: "EL", text: "Best bridge of 2026. Transition is flawless", timePercent: 62, timestamp: "2:10" },
    { id: 4, user: "DJ Bass", avatar: "DB", text: "This drop goes wild in the club! 🔥🎧", timePercent: 80, timestamp: "2:55" },
  ]);
  const [newWaveComment, setNewWaveComment] = useState<string>("");
  const [commentTimePercent, setCommentTimePercent] = useState<number>(45);

  // SoundCloud-Style Lounge Chat
  const [chatMessages, setChatMessages] = useState([
    { id: 1, user: "BurnerFan", text: "Ekoro's direct payout is a game-changer for indie artists.", time: "17:01" },
    { id: 2, user: "audiophile99", text: "Is anyone listening to the Wizkid master? The dynamic range is so wide.", time: "17:03" },
    { id: 3, user: "jessica_r", text: "Just tipped Rema. He is hosting a listening party on Ekoro tomorrow!", time: "17:04" },
    { id: 4, user: "NaijaBeats", text: "Send demo links! Love checking out the WIP section.", time: "17:05" },
  ]);
  const [chatInput, setChatInput] = useState("");
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom of chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

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
          query = "Davido"; // default query
        } else if (activeTab === "New Releases") {
          query = "Rema"; // popular query
        } else if (activeTab === "Demos & WIP") {
          query = "Asake"; // demo feeling query
        }

        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
        if (res.ok) {
          const data = await res.json();
          if (data && Array.isArray(data.tracks)) {
            const mappedTracks: Track[] = data.tracks.map((t: any, index: number) => ({
              id: t.id,
              title: t.title,
              artist: t.artist,
              duration: t.duration,
              cover: t.cover,
              plays: t.plays || `${(2.4 + index * 0.7).toFixed(1)}M`,
              genre: activeTab,
              color: index % 3 === 0 ? "from-emerald-600 to-teal-800" : index % 3 === 1 ? "from-amber-600 to-orange-800" : "from-blue-600 to-indigo-800",
              emoji: index % 3 === 0 ? "🌊" : index % 3 === 1 ? "✨" : "🔥"
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

  const handleSendTip = (e: React.FormEvent) => {
    e.preventDefault();
    const finalAmount = parseFloat(customTip || tipAmount);
    if (isNaN(finalAmount) || finalAmount <= 0) return;

    setIsSupporting(true);

    // Simulate payment process
    setTimeout(() => {
      setIsSupporting(false);
      setSupportSuccess(true);

      // Add to live patron feed
      const newPatron: PatronActivity = {
        id: Date.now(),
        name: "Adeola (You)",
        action: "supported with tip",
        amount: finalAmount,
        artist: currentTrack?.artist || "Featured Artist",
        track: currentTrack?.title || "New Track",
        time: "Just now",
        message: supportMessage || "Supporting independent music! 🎹🎧",
        avatar: "AD",
      };

      setPatrons([newPatron, ...patrons]);

      // Clear inputs
      setCustomTip("");
      setSupportMessage("");

      // Reset success state after a few seconds
      setTimeout(() => setSupportSuccess(false), 5000);
    }, 1500);
  };

  const handleAddWaveComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWaveComment.trim()) return;

    const mins = Math.floor((commentTimePercent / 100) * 3.5);
    const secs = Math.floor(((commentTimePercent / 100) * 3.5 * 60) % 60);
    const timestampStr = `${mins}:${secs < 10 ? "0" : ""}${secs}`;

    const newComment: WaveformComment = {
      id: Date.now(),
      user: "Adeola (You)",
      avatar: "AD",
      text: newWaveComment,
      timePercent: commentTimePercent,
      timestamp: timestampStr
    };

    setWaveComments([...waveComments, newComment]);
    setNewWaveComment("");
  };

  const handleSendChatMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const now = new Date();
    const timeStr = `${now.getHours()}:${now.getMinutes() < 10 ? "0" : ""}${now.getMinutes()}`;

    setChatMessages([
      ...chatMessages,
      {
        id: Date.now(),
        user: "Adeola",
        text: chatInput,
        time: timeStr
      }
    ]);
    setChatInput("");
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-[1600px] mx-auto space-y-8 select-none">

      {/* SECTION 1: HERO & VISUAL SPOTLIGHT */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Spotify-SoundCloud Style Animated Hero (Col Span 2) */}
        <div className="lg:col-span-2 relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-ekoro-blue-dark/40 to-slate-900 p-6 sm:p-8 border border-white/10 shadow-2xl flex flex-col justify-between min-h-[380px]">
          {/* Animated Ambient Light Spheres */}
          <div className="absolute -right-20 -top-20 w-96 h-96 bg-ekoro-blue/20 rounded-full blur-3xl animate-pulse" style={{ animationDuration: "12s" }} />
          <div className="absolute -left-10 -bottom-10 w-72 h-72 bg-ekoro-green/10 rounded-full blur-3xl animate-pulse" style={{ animationDuration: "8s" }} />
          <div className="absolute right-1/3 bottom-10 w-64 h-64 bg-ekoro-gold/10 rounded-full blur-3xl animate-pulse" style={{ animationDuration: "15s" }} />

          {/* Top Row: Station status */}
          <div className="relative z-10 flex items-center justify-between">
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-white/5 backdrop-blur-md text-ekoro-gold border border-white/10">
              <Radio className="w-3.5 h-3.5 text-ekoro-gold animate-pulse" />
              Ekoro Wave Live Broadcast
            </span>
            <div className="flex items-center gap-1 text-white/50 text-xs bg-black/30 backdrop-blur-md px-3 py-1 rounded-full border border-white/5">
              <Users className="w-3.5 h-3.5 text-ekoro-green" />
              <span className="text-white font-bold">2,431</span> listeners tuning in
            </div>
          </div>

          {/* Middle Row: Artist & Track Details */}
          <div className="relative z-10 my-6">
            <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white via-white to-white/70 leading-tight">
              Adekola, discover today&apos;s raw cuts.
            </h1>
            <p className="text-sm sm:text-base text-white/60 mt-3 max-w-xl leading-relaxed">
              Every stream directly funds the creator. Join the community backing independent artists without middle-men.
            </p>

            {/* Live Audio Visualizer Graphics */}
            <div className="flex items-end gap-1.5 h-10 mt-6 max-w-sm">
              {[40, 70, 45, 90, 60, 30, 85, 50, 95, 40, 75, 60, 90, 35, 80, 50, 70, 45].map((h, i) => (
                <span
                  key={i}
                  className="flex-1 bg-gradient-to-t from-ekoro-blue to-ekoro-green rounded-full transform origin-bottom transition-all duration-300"
                  style={{
                    height: isPlaying ? `${h}%` : "15%",
                    animation: isPlaying ? `pulse-bar 1.2s ease-in-out infinite alternate` : "none",
                    animationDelay: `${i * 0.08}s`
                  }}
                />
              ))}
            </div>
            <style jsx>{`
              @keyframes pulse-bar {
                0% { transform: scaleY(0.3); }
                100% { transform: scaleY(1); }
              }
            `}</style>
          </div>

          {/* Bottom Row: Actions */}
          <div className="relative z-10 flex flex-wrap items-center gap-4">
            <button
              onClick={handleHeroPlay}
              className="bg-white hover:bg-white/90 active:scale-95 text-slate-950 font-bold text-sm px-8 py-3 rounded-2xl shadow-xl shadow-white/5 flex items-center gap-2.5 transition-all"
            >
              {isPlaying ? (
                <>
                  <Pause className="w-4 h-4 fill-current" /> Pause Broadcast
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-current ml-0.5" /> Play Live Session
                </>
              )}
            </button>
            <button
              onClick={() => {
                const element = document.getElementById("direct-support");
                element?.scrollIntoView({ behavior: "smooth" });
              }}
              className="bg-white/5 hover:bg-white/10 border border-white/10 active:scale-95 text-white font-bold text-sm px-6 py-3 rounded-2xl flex items-center gap-2 transition-all hover:border-ekoro-gold/30"
            >
              <Coins className="w-4 h-4 text-ekoro-gold" />
              Direct Support Portal
            </button>
          </div>
        </div>

        {/* 3D Spinning Vinyl Lathe Cut Showcase (Col Span 1) */}
        <div className="bg-gradient-to-b from-slate-900 to-slate-950 border border-white/10 rounded-3xl p-6 shadow-2xl relative flex flex-col justify-between overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-ekoro-gold/5 rounded-full blur-2xl" />

          <div className="flex items-center justify-between z-10">
            <span className="text-2xs font-bold text-ekoro-gold uppercase tracking-wider flex items-center gap-1.5">
              <Disc className="w-3.5 h-3.5 animate-spin" style={{ animationDuration: isPlaying ? "4s" : "12s" }} />
              Lathe Cut Vinyl Pressing
            </span>
            <span className="text-4xs px-2 py-0.5 bg-ekoro-gold/20 text-ekoro-gold font-bold rounded-full border border-ekoro-gold/30">
              LIMITED 1/100
            </span>
          </div>

          {/* Interactive Vinyl Object */}
          <div className="my-6 flex justify-center relative py-4">
            <div className="relative w-44 h-44 flex items-center justify-center">

              {/* Spinning Vinyl Grooves */}
              <div
                className={`absolute w-44 h-44 rounded-full bg-slate-950 border border-neutral-800 shadow-2xl flex items-center justify-center transition-transform ${
                  isPlaying ? "animate-spin" : "group-hover:rotate-45"
                }`}
                style={{
                  backgroundImage: "radial-gradient(circle, transparent 20%, #171717 21%, #0a0a0a 40%, #171717 60%, #030303 80%)",
                  boxShadow: "0 0 25px rgba(0, 0, 0, 0.6), inset 0 0 10px rgba(255, 255, 255, 0.05)",
                  animationDuration: "4s",
                  animationTimingFunction: "linear",
                  animationIterationCount: "infinite"
                }}
              >
                {/* Vinyl Grooves Details */}
                <div className="absolute w-36 h-36 rounded-full border border-neutral-900/60" />
                <div className="absolute w-28 h-28 rounded-full border border-neutral-900/40" />
                <div className="absolute w-20 h-20 rounded-full border border-neutral-900/80" />

                {/* Center Label (Track Color & Art) */}
                <div className={`w-16 h-16 rounded-full bg-gradient-to-tr ${currentTrack?.color || "from-ekoro-blue to-purple-800"} flex items-center justify-center text-xs overflow-hidden relative border-2 border-neutral-900`}>
                  {currentTrack?.cover ? (
                    <Image
                      src={currentTrack.cover}
                      alt={currentTrack.title}
                      width={64}
                      height={64}
                      unoptimized
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-xl">{currentTrack?.emoji || "🎵"}</span>
                  )}
                  {/* Spindle Hole */}
                  <div className="absolute w-3.5 h-3.5 rounded-full bg-slate-900 border border-neutral-900 z-10" />
                </div>
              </div>
            </div>
          </div>

          <div className="z-10">
            <h3 className="font-bold text-base truncate group-hover:text-ekoro-gold transition-colors">
              {currentTrack?.title || "Essence"}
            </h3>
            <p className="text-xs text-white/50 truncate mt-0.5">by {currentTrack?.artist || "Wizkid"}</p>

            <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/5">
              <div>
                <span className="text-3xs text-white/40 block">Lathe price</span>
                <span className="text-base font-extrabold text-white">$24.99</span>
              </div>
              <button
                onClick={() => alert("Vinyl pressing checkouts are integrated via Stripe. Setup your wallet in settings.")}
                className="bg-ekoro-gold hover:bg-ekoro-gold/90 text-ekoro-blue-dark font-extrabold text-xs px-4 py-2 rounded-xl transition-all shadow-md shadow-ekoro-gold/10"
              >
                Order Vinyl
              </button>
            </div>
          </div>
        </div>

      </div>

      {/* SECTION 2: SOUNDCLOUD COMMUNITY WAVE & DIRECT TIPPING PORTAL */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

        {/* SoundCloud-Style Interactive Waveform Comments (Col Span 2) */}
        <div className="xl:col-span-2 bg-slate-950 border border-white/5 rounded-3xl p-6 shadow-xl flex flex-col justify-between space-y-6">
          <div>
            <div className="flex items-center justify-between mb-2">
              <div>
                <span className="text-3xs px-2.5 py-0.5 rounded-full font-bold bg-ekoro-green/20 text-ekoro-green uppercase border border-ekoro-green/30">
                  SoundCloud Vibe
                </span>
                <h2 className="text-lg font-bold text-white mt-2">Interactive Waveform Soundboard</h2>
              </div>
              <span className="text-xs text-white/40 italic">Hover pins to read fan notes</span>
            </div>
            <p className="text-xs text-white/50">Click along the timeline to drop comments directly onto the audio wave.</p>
          </div>

          {/* Interactive Custom Waveform Visualizer */}
          <div className="relative pt-6 pb-2 px-1">

            {/* Waveform graphic bars */}
            <div className="h-20 w-full flex items-end gap-[3px] opacity-80 relative">
              {Array.from({ length: 70 }).map((_, idx) => {
                // Generate a pseudo-random wave shape
                const height = Math.abs(Math.sin(idx * 0.15) * 60) + Math.abs(Math.cos(idx * 0.08) * 30) + 10;

                // Color filled state based on player progress
                const isPlayed = idx < 38; // mock current player progress (approx 54%)

                return (
                  <div
                    key={idx}
                    className={`flex-1 rounded-t-sm transition-all duration-300 ${
                      isPlayed
                        ? "bg-gradient-to-t from-ekoro-gold to-orange-500 shadow-sm shadow-ekoro-gold/15"
                        : "bg-white/10 hover:bg-white/20"
                    }`}
                    style={{ height: `${height}%` }}
                  />
                );
              })}

              {/* Floating Comment Avatars on the wave */}
              {waveComments.map((comment) => (
                <div
                  key={comment.id}
                  className="absolute bottom-0 group"
                  style={{ left: `${comment.timePercent}%`, transform: "translateX(-50%)" }}
                >
                  {/* Pin Dot */}
                  <div className="w-5 h-5 rounded-full bg-slate-950 border-2 border-ekoro-gold hover:border-white shadow-lg flex items-center justify-center cursor-pointer transform -translate-y-1 group-hover:scale-120 transition-all">
                    <span className="text-5xs font-bold text-ekoro-gold group-hover:text-white uppercase">{comment.avatar}</span>
                  </div>

                  {/* Tooltip Hover Bubble */}
                  <div className="absolute bottom-7 left-1/2 -translate-x-1/2 bg-slate-900 border border-white/15 text-white p-2.5 rounded-xl text-3xs w-48 shadow-2xl opacity-0 group-hover:opacity-100 pointer-events-none transition-all z-20 translate-y-2 group-hover:translate-y-0">
                    <div className="flex justify-between font-bold text-ekoro-gold mb-1">
                      <span>{comment.user}</span>
                      <span>{comment.timestamp}</span>
                    </div>
                    <p className="text-white/80 font-normal leading-relaxed">{comment.text}</p>
                    <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2.5 h-2.5 bg-slate-900 border-r border-b border-white/15 rotate-45" />
                  </div>
                </div>
              ))}
            </div>

            {/* Waveform slider background */}
            <div className="w-full h-1 bg-white/5 rounded-full mt-2 relative">
              <div className="absolute h-full bg-ekoro-gold rounded-full" style={{ width: "54%" }} />
              <div className="absolute w-3 h-3 bg-ekoro-gold rounded-full top-1/2 -translate-y-1/2 shadow cursor-grab" style={{ left: "54%" }} />
            </div>
          </div>

          {/* Comment Drop Form */}
          <form onSubmit={handleAddWaveComment} className="flex gap-2 bg-white/5 border border-white/10 rounded-2xl p-2 focus-within:border-ekoro-gold/30 transition-colors">
            <input
              type="text"
              placeholder={`Add a comment on the wave at ${(commentTimePercent * 3.5 / 100).toFixed(2)}m...`}
              value={newWaveComment}
              onChange={(e) => setNewWaveComment(e.target.value)}
              className="flex-1 bg-transparent px-3 text-xs text-white placeholder-white/30 outline-none"
            />

            <div className="flex items-center gap-2 pr-1">
              {/* Spot position selector slider */}
              <div className="hidden sm:flex items-center gap-1.5 px-2 bg-white/5 rounded-lg border border-white/5">
                <span className="text-4xs text-white/40">Pos:</span>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={commentTimePercent}
                  onChange={(e) => setCommentTimePercent(Number(e.target.value))}
                  className="w-12 h-0.5 accent-ekoro-gold rounded-full cursor-pointer bg-white/10"
                />
                <span className="text-4xs text-ekoro-gold font-bold">{commentTimePercent}%</span>
              </div>

              <button
                type="submit"
                className="bg-ekoro-gold hover:bg-ekoro-gold/90 text-ekoro-blue-dark font-extrabold text-xs px-3.5 py-1.5 rounded-xl flex items-center gap-1"
              >
                <Send className="w-3 h-3 fill-current" /> Drop Note
              </button>
            </div>
          </form>
        </div>

        {/* Bandcamp-Style Direct Patronage/Tipping Portal (Col Span 1) */}
        <div id="direct-support" className="bg-gradient-to-b from-slate-900 to-ekoro-blue-dark/20 border border-white/10 rounded-3xl p-6 shadow-2xl flex flex-col justify-between relative overflow-hidden">
          {/* Background Brand Pattern */}
          <div className="absolute bottom-0 right-0 w-24 h-24 bg-ekoro-green/5 rounded-full blur-xl pointer-events-none" />

          <div>
            <span className="text-3xs px-2.5 py-0.5 rounded-full font-bold bg-ekoro-gold/20 text-ekoro-gold uppercase border border-ekoro-gold/30">
              Bandcamp Philosophy
            </span>
            <h2 className="text-lg font-bold text-white mt-2">Support {currentTrack?.artist || "Featured Artist"} Directly</h2>
            <p className="text-xs text-white/50 mt-1">92% of tip goes directly into the artist&apos;s wallet. Standard platforms pay 0.003 cents per stream.</p>
          </div>

          <form onSubmit={handleSendTip} className="space-y-4 my-6">

            {/* Quick Select Buttons */}
            <div className="grid grid-cols-4 gap-2">
              {["3", "5", "10", "20"].map((val) => (
                <button
                  type="button"
                  key={val}
                  onClick={() => { setTipAmount(val); setCustomTip(""); }}
                  className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                    tipAmount === val && !customTip
                      ? "bg-ekoro-gold border-ekoro-gold text-ekoro-blue-dark"
                      : "bg-white/5 border-white/10 text-white hover:bg-white/10"
                  }`}
                >
                  ${val}
                </button>
              ))}
            </div>

            {/* Custom Input */}
            <div className="relative">
              <input
                type="number"
                min="1"
                placeholder="Custom Amount"
                value={customTip}
                onChange={(e) => { setCustomTip(e.target.value); setTipAmount(""); }}
                className="w-full bg-white/5 border border-white/10 rounded-xl py-2 pl-7 pr-4 text-xs text-white placeholder-white/30 focus:outline-none focus:border-ekoro-gold/40 focus:bg-white/10"
              />
              <DollarSign className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-white/40" />
            </div>

            {/* Support message */}
            <textarea
              placeholder="Leave a message of support (shows on community board)..."
              value={supportMessage}
              onChange={(e) => setSupportMessage(e.target.value)}
              rows={2}
              className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-xs text-white placeholder-white/30 focus:outline-none focus:border-ekoro-gold/40 focus:bg-white/10 resize-none"
            />

            {supportSuccess ? (
              <div className="bg-ekoro-green/20 border border-ekoro-green/40 text-ekoro-green-light rounded-xl p-3 text-xs text-center flex items-center justify-center gap-1.5 font-semibold">
                <CheckCircle2 className="w-4 h-4 text-ekoro-green animate-bounce" />
                Support broadcasted to the crowd!
              </div>
            ) : (
              <button
                type="submit"
                disabled={isSupporting}
                className="w-full bg-ekoro-green hover:bg-ekoro-green/90 disabled:bg-ekoro-green/50 text-white font-extrabold py-3 rounded-xl transition-all shadow-lg shadow-ekoro-green/10 flex items-center justify-center gap-2 active:scale-98"
              >
                {isSupporting ? (
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                ) : (
                  <>
                    <Coins className="w-4 h-4 text-white fill-current" />
                    Send Direct Support
                  </>
                )}
              </button>
            )}
          </form>

          <div className="text-4xs text-white/40 flex items-center justify-between">
            <span>Powered by Stripe Identity</span>
            <span className="flex items-center gap-0.5 text-ekoro-green">
              <span className="inline-block w-1.5 h-1.5 bg-ekoro-green rounded-full animate-ping" />
              Direct payment gateway online
            </span>
          </div>
        </div>

      </div>

      {/* SECTION 3: THE MUSIC FRONT (DISCOVER TABS & LIVE PATRON FEED) */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">

        {/* Left/Middle: Discovery Section (Col Span 2) */}
        <div className="xl:col-span-2 space-y-6">

          {/* Header & Tabs */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-white/5 pb-4">
            <h2 className="text-xl font-extrabold tracking-tight text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-ekoro-gold" />
              Discover Wavefront
            </h2>

            <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              {["For You", "New Releases", "Demos & WIP", "Afrobeats", "Alternative"].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all border ${
                    activeTab === tab
                      ? "bg-ekoro-gold border-ekoro-gold text-ekoro-blue-dark shadow-md shadow-ekoro-gold/10"
                      : "bg-white/5 border-white/10 text-white/60 hover:text-white hover:bg-white/10"
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          {/* Featured Grid */}
          {isFeaturedLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 py-12">
              {[1, 2, 3].map((n) => (
                <div key={n} className="bg-slate-900 border border-white/5 rounded-2xl p-4 animate-pulse flex flex-col gap-3">
                  <div className="aspect-square w-full rounded-xl bg-white/5" />
                  <div className="h-4 bg-white/10 rounded w-3/4" />
                  <div className="h-3 bg-white/5 rounded w-1/2" />
                </div>
              ))}
            </div>
          ) : featuredTracks.length === 0 ? (
            <div className="text-center py-16 text-white/40 text-sm bg-slate-900 rounded-3xl border border-white/5">
              No tracks found matching &ldquo;{activeTab}&rdquo;. Try another filter.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {featuredTracks.map((track) => (
                <div key={track.id} className="relative group">
                  {/* Subtle hover glow backdrop */}
                  <div className="absolute -inset-0.5 bg-gradient-to-r from-ekoro-blue to-ekoro-green rounded-2xl blur opacity-0 group-hover:opacity-10 transition duration-500" />
                  <TrackCard track={track} />
                  {/* Premium quality badges overlaid */}
                  <div className="absolute top-5 left-5 z-20 flex gap-1">
                    <span className="bg-black/75 backdrop-blur-md text-ekoro-green text-5xs font-bold px-1.5 py-0.5 rounded border border-ekoro-green/20">
                      FLAC LOSSLESS
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Dual Columns: Trending Charts & Social Demos Feed */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">

            {/* Spotify / Last.fm Charts */}
            <div className="bg-slate-950 border border-white/5 rounded-3xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-extrabold text-sm tracking-wider text-white uppercase flex items-center gap-1.5">
                  <Flame className="w-4 h-4 text-orange-500 fill-current" />
                  Live Trending Charts
                </h3>
                <span className="text-4xs text-white/40 bg-white/5 px-2 py-0.5 rounded">LAST.FM SYNCED</span>
              </div>

              {isTrendingLoading ? (
                <div className="space-y-4 py-8 flex flex-col items-center justify-center text-white/40">
                  <Loader2 className="w-5 h-5 animate-spin text-ekoro-gold" />
                  <span className="text-3xs">Tuning in charts...</span>
                </div>
              ) : (
                <div className="space-y-1">
                  {trendingTracks.slice(0, 5).map((track, i) => (
                    <TrackRow key={track.id} track={track} index={i} />
                  ))}
                </div>
              )}
            </div>

            {/* SoundCloud-Style WIP & Demos List */}
            <div className="bg-slate-950 border border-white/5 rounded-3xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-extrabold text-sm tracking-wider text-white uppercase flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-ekoro-green" />
                  Underground Demos & WIPs
                </h3>
                <span className="text-4xs text-ekoro-green bg-ekoro-green/10 px-2 py-0.5 rounded font-bold">FEEDBACK ACTIVE</span>
              </div>

              <div className="space-y-3">
                {[
                  { id: "demo1", title: "Amapiano Groove (Demo 3)", artist: "DJ Phyno", comments: 24, progress: "45%", likes: "1.2k" },
                  { id: "demo2", title: "Lost Voices (Vocal Cut)", artist: "Amara", comments: 18, progress: "70%", likes: "980" },
                  { id: "demo3", title: "Highlife Horns Intro WIP", artist: "Kwame K.", comments: 7, progress: "10%", likes: "320" },
                ].map((demo, idx) => (
                  <div
                    key={demo.id}
                    onClick={() => {
                      setTrack({
                        id: demo.id,
                        title: demo.title,
                        artist: demo.artist,
                        plays: demo.likes,
                        genre: "Demo",
                        duration: "2:40",
                        color: idx === 0 ? "from-purple-800 to-indigo-900" : "from-emerald-800 to-slate-900",
                        emoji: "🧪"
                      });
                    }}
                    className="group flex items-center justify-between p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 cursor-pointer transition-all hover:translate-x-1"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-neutral-900 flex items-center justify-center text-xs font-bold border border-white/10 group-hover:border-ekoro-gold/30">
                        🧪
                      </div>
                      <div>
                        <h4 className="text-xs font-semibold text-white group-hover:text-ekoro-gold truncate max-w-[150px]">{demo.title}</h4>
                        <p className="text-4xs text-white/40">{demo.artist}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-4xs px-2 py-0.5 bg-white/5 rounded-full text-white/50 flex items-center gap-1">
                        <MessageCircle className="w-2.5 h-2.5" />
                        {demo.comments}
                      </span>
                      <div className="w-7 h-7 rounded-full bg-white/5 hover:bg-ekoro-gold hover:text-slate-950 flex items-center justify-center text-white transition-colors">
                        <Play className="w-3 h-3 fill-current ml-0.5" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>

        </div>

        {/* Right Column: Social & Patronage Circle (Col Span 1) */}
        <div className="space-y-6">

          {/* Bandcamp-Style Live Patron Feed */}
          <div className="bg-slate-950 border border-white/5 rounded-3xl p-5 shadow-lg space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold text-sm tracking-wider text-white uppercase flex items-center gap-1.5">
                <ShoppingBag className="w-4 h-4 text-ekoro-gold" />
                Live Patron Feed
              </h3>
              <span className="inline-flex items-center w-2 h-2 rounded-full bg-ekoro-green animate-ping" />
            </div>

            <div className="space-y-3.5 max-h-[350px] overflow-y-auto pr-1 scrollbar-none">
              {patrons.map((patron) => (
                <div key={patron.id} className="p-3 bg-white/5 border border-white/5 hover:border-white/10 rounded-2xl text-xs space-y-1.5 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-ekoro-blue to-ekoro-green flex items-center justify-center text-4xs font-bold text-white uppercase">
                        {patron.avatar}
                      </div>
                      <span className="font-bold text-white">{patron.name}</span>
                    </div>
                    <span className="text-3xs text-ekoro-green font-bold bg-ekoro-green/10 px-2 py-0.5 rounded-full">
                      +${patron.amount.toFixed(2)}
                    </span>
                  </div>

                  <p className="text-4xs text-white/50">
                    {patron.action} for <span className="text-white font-semibold">{patron.track}</span>
                  </p>

                  {patron.message && (
                    <div className="bg-black/35 rounded-xl p-2 text-4xs text-white/70 italic border border-white/5">
                      &ldquo;{patron.message}&rdquo;
                    </div>
                  )}

                  <span className="text-5xs text-white/30 block text-right">{patron.time}</span>
                </div>
              ))}
            </div>
          </div>

          {/* SoundCloud-Style Community Lounge Chat */}
          <div className="bg-slate-950 border border-white/5 rounded-3xl p-5 shadow-lg flex flex-col justify-between h-[360px]">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-extrabold text-sm tracking-wider text-white uppercase flex items-center gap-1.5">
                <MessageSquare className="w-4 h-4 text-ekoro-blue" />
                Community Lounge
              </h3>
              <span className="text-4xs text-white/40">ONLINE</span>
            </div>

            {/* Chat Box Stream */}
            <div className="flex-1 overflow-y-auto space-y-3 pr-1 scrollbar-none my-2">
              {chatMessages.map((msg) => (
                <div key={msg.id} className="text-xs space-y-0.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white/70 hover:text-ekoro-gold cursor-pointer transition-colors">{msg.user}</span>
                    <span className="text-5xs text-white/30">{msg.time}</span>
                  </div>
                  <p className="text-white/80 bg-white/5 rounded-xl px-3 py-1.5 inline-block max-w-[90%] leading-relaxed">
                    {msg.text}
                  </p>
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>

            {/* Chat Input */}
            <form onSubmit={handleSendChatMessage} className="flex gap-1.5 mt-2">
              <input
                type="text"
                placeholder="Post a message in the lounge..."
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 text-xs text-white placeholder-white/30 focus:outline-none focus:border-ekoro-blue/40"
              />
              <button
                type="submit"
                className="bg-ekoro-blue hover:bg-ekoro-blue/90 text-white p-2 rounded-xl transition-colors"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>

        </div>

      </div>

      {/* spacer for persistent audio player bottom margin */}
      <div className="h-16" />

    </div>
  );
}
