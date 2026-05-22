import React from "react";

export default function ExplorePage() {
  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight text-white">Explore Music</h1>
        <p className="text-sm text-white/60">Discover new genres, curated lists, and charts.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4">
        {["Afrobeats", "Hip-Hop", "Gospel", "Highlife", "R&B / Soul", "Dancehall", "Jazz", "Reggae"].map((genre) => (
          <div key={genre} className="bg-white/5 border border-white/10 hover:border-white/20 rounded-xl p-5 text-center font-bold hover:scale-102 transition-all cursor-pointer">
            {genre}
          </div>
        ))}
      </div>
    </div>
  );
}
