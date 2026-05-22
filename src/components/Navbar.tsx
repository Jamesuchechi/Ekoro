"use client";

import React from "react";
import { Search, Disc } from "lucide-react";
import Link from "next/link";
import { useAuthStore } from "@/stores/authStore";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Image from "next/image";

export default function Navbar() {
  const { user, profile, isLoading } = useAuthStore();
  const supabase = createClient();
  const router = useRouter();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.refresh();
    router.push("/");
  };

  return (
    <nav className="sticky top-0 z-50 flex items-center justify-between px-6 h-16 bg-ekoro-dark/85 backdrop-blur-md border-b border-white/5">
      <div className="flex items-center gap-3">
        <Link href="/" className="flex items-center gap-3 hover:opacity-90 transition-opacity">
          <div className="w-9 h-9 bg-ekoro-gold rounded-lg flex items-center justify-center shadow-lg shadow-ekoro-gold/20 animate-pulse">
            <Disc className="w-5 h-5 text-ekoro-blue-dark" />
          </div>
          <span className="text-xl font-bold tracking-tight text-white">
            Ek<span className="text-ekoro-gold italic">oro</span>
          </span>
        </Link>
      </div>

      <div className="hidden md:flex items-center gap-8">
        <Link href="/" className="text-sm font-medium text-white">
          Discover
        </Link>
        <Link href="/explore" className="text-sm font-medium text-white/60 hover:text-white transition-colors">
          Explore
        </Link>
        <Link href="/explore?trending=true" className="text-sm font-medium text-white/60 hover:text-white transition-colors">
          Trending
        </Link>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative hidden sm:block">
          <input
            type="text"
            placeholder="Search tracks, artists..."
            className="pl-9 pr-4 py-1.5 w-64 bg-white/5 border border-white/10 rounded-full text-xs text-white placeholder-white/40 focus:outline-none focus:border-ekoro-gold/50 focus:bg-white/10 transition-all"
          />
          <Search className="absolute left-3 top-2 w-3.5 h-3.5 text-white/40" />
        </div>

        {isLoading ? (
          <div className="w-8 h-8 rounded-full bg-white/5 animate-pulse" />
        ) : profile ? (
          <div className="flex items-center gap-3 relative group">
            {profile.plan && profile.plan !== "free" && (
              <span className="bg-ekoro-gold text-ekoro-blue-dark text-[10px] font-extrabold px-2 py-0.5 rounded-full shadow-sm uppercase tracking-wider hidden sm:inline-block">
                {profile.plan.replace("_", " ")}
              </span>
            )}
            
            <button className="w-8 h-8 rounded-full overflow-hidden border border-white/10 hover:scale-105 transition-transform relative">
              {profile.avatarUrl ? (
                <Image
                  src={profile.avatarUrl}
                  alt={profile.displayName || "User profile"}
                  fill
                  sizes="32px"
                  className="object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-tr from-ekoro-blue to-ekoro-green flex items-center justify-center text-xs font-bold text-white">
                  {(profile.displayName || profile.username || "U").substring(0, 2).toUpperCase()}
                </div>
              )}
            </button>

            {/* Dropdown Menu on hover */}
            <div className="absolute right-0 top-full pt-2 hidden group-hover:block z-50">
              <div className="bg-slate-900 border border-white/10 rounded-xl p-2 w-48 shadow-xl">
                <div className="px-3 py-1.5 text-xs text-white/50 border-b border-white/5 truncate">
                  Signed in as <span className="font-semibold text-white block truncate">{profile.displayName || profile.username}</span>
                </div>
                {profile.role === "artist" && (
                  <Link
                    href="/dashboard"
                    className="flex w-full px-3 py-2 text-xs text-white hover:bg-white/5 rounded-lg transition-colors mt-1 font-medium"
                  >
                    Creator Dashboard
                  </Link>
                )}
                <button
                  onClick={handleSignOut}
                  className="flex w-full text-left px-3 py-2 text-xs text-red-400 hover:bg-red-500/10 rounded-lg transition-colors mt-1 font-medium"
                >
                  Sign Out
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Link
              href="/login"
              className="text-xs font-bold text-white/80 hover:text-white px-3 py-1.5 transition-colors"
            >
              Sign In
            </Link>
            <Link
              href="/register"
              className="text-xs font-bold bg-ekoro-blue hover:bg-ekoro-blue/90 text-white px-4 py-1.5 rounded-full transition-all shadow-sm"
            >
              Sign Up
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
}
