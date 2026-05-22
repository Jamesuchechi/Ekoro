import React from "react";
import { Search, Disc } from "lucide-react";

export default function Navbar() {
  return (
    <nav className="sticky top-0 z-50 flex items-center justify-between px-6 h-16 bg-ekoro-dark/85 backdrop-blur-md border-b border-white/5">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 bg-ekoro-gold rounded-lg flex items-center justify-center shadow-lg shadow-ekoro-gold/20 animate-pulse">
          <Disc className="w-5 h-5 text-ekoro-blue-dark" />
        </div>
        <span className="text-xl font-bold tracking-tight">
          Ek<span className="text-ekoro-gold italic">oro</span>
        </span>
      </div>

      <div className="hidden md:flex items-center gap-8">
        {["Discover", "Trending", "Artists", "Library"].map((link) => (
          <a
            key={link}
            href="#"
            className={`text-sm font-medium transition-colors ${
              link === "Discover" ? "text-white" : "text-white/60 hover:text-white"
            }`}
          >
            {link}
          </a>
        ))}
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
        <span className="bg-ekoro-gold text-ekoro-blue-dark text-xxs font-extrabold px-2.5 py-0.5 rounded-full shadow-sm">
          PRO
        </span>
        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-ekoro-blue to-ekoro-green flex items-center justify-center text-xs font-bold text-white border border-white/10 cursor-pointer hover:scale-105 transition-transform">
          AK
        </div>
      </div>
    </nav>
  );
}
