import React from "react";
import { Compass, Sparkles, TrendingUp, User, Heart, ListMusic, Download } from "lucide-react";

export default function Sidebar() {
  return (
    <aside className="w-60 border-r border-white/5 bg-ekoro-dark/30 hidden lg:block p-6 flex-shrink-0 overflow-y-auto">
      <div className="space-y-6">
        <div>
          <p className="text-2xs font-bold uppercase tracking-widest text-ekoro-dark-muted mb-3">
            Browse
          </p>
          <div className="space-y-1">
            <button className="w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg bg-white/5 text-ekoro-gold">
              <Compass className="w-4 h-4" />
              Home
            </button>
            <button className="w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg text-white/60 hover:text-white hover:bg-white/5 transition-colors">
              <Sparkles className="w-4 h-4" />
              Explore
            </button>
            <button className="w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg text-white/60 hover:text-white hover:bg-white/5 transition-colors">
              <TrendingUp className="w-4 h-4" />
              Trending
              <span className="ml-auto text-xs">🔥</span>
            </button>
            <button className="w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg text-white/60 hover:text-white hover:bg-white/5 transition-colors">
              <User className="w-4 h-4" />
              Artists
            </button>
          </div>
        </div>

        <div>
          <p className="text-2xs font-bold uppercase tracking-widest text-ekoro-dark-muted mb-3">
            Library
          </p>
          <div className="space-y-1">
            <button className="w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg text-white/60 hover:text-white hover:bg-white/5 transition-colors">
              <Heart className="w-4 h-4" />
              Liked Tracks
            </button>
            <button className="w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg text-white/60 hover:text-white hover:bg-white/5 transition-colors">
              <ListMusic className="w-4 h-4" />
              Playlists
            </button>
            <button className="w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg text-white/60 hover:text-white hover:bg-white/5 transition-colors">
              <Download className="w-4 h-4" />
              Downloads
            </button>
          </div>
        </div>

        <div>
          <p className="text-2xs font-bold uppercase tracking-widest text-ekoro-dark-muted mb-3">
            Genres
          </p>
          <div className="space-y-1 text-white/60 text-sm">
            {["🎵 Afrobeats", "🎤 Hip-Hop", "🎶 R&B / Soul", "✝ Gospel", "🎸 Highlife"].map(
              (genre) => (
                <button
                  key={genre}
                  className="w-full text-left px-3 py-1.5 hover:text-white transition-colors"
                >
                  {genre}
                </button>
              )
            )}
          </div>
        </div>
      </div>
    </aside>
  );
}
