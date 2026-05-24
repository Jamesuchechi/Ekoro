"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Search, ArrowLeft, Music, User, Library, Disc, ChevronRight } from "lucide-react";
import { Track } from "@/types";
import TrackCard from "@/components/Track/TrackCard";
import TrackRow from "@/components/Track/TrackRow";

interface ArtistResult {
  id: string;
  name: string;
  image: string;
  genres: string[];
}

interface PlaylistResult {
  id: string;
  title: string;
  description: string | null;
  cover: string;
  creator: string;
}

interface AlbumResult {
  id: string;
  title: string;
  cover: string;
  artist: string;
  year: number | string;
}

interface ExploreClientProps {
  initialQuery?: string;
  selectedGenre?: string;
  searchResults: {
    artists: ArtistResult[];
    albums: AlbumResult[];
    tracks: Track[];
    playlists: PlaylistResult[];
  } | null;
  genreTracks: Track[];
  trendingTracks: Track[];
}

const GENRES = [
  { name: "Afrobeats", desc: "Vibrant rhythms & pop fusion from West Africa", gradient: "from-rose-600 via-orange-500 to-amber-500" },
  { name: "Hip-Hop", desc: "Hard-hitting beats & lyrical storytelling", gradient: "from-purple-600 via-indigo-600 to-blue-600" },
  { name: "Gospel", desc: "Soulful vocals, uplifting messages & harmonies", gradient: "from-sky-500 via-teal-500 to-emerald-500" },
  { name: "Highlife", desc: "Traditional horns, guitars & jazzy melodies", gradient: "from-amber-600 via-yellow-600 to-orange-600" },
  { name: "R&B / Soul", desc: "Sensual melodies & heartfelt vocal performances", gradient: "from-pink-600 via-rose-600 to-purple-800" },
  { name: "Dancehall", desc: "Energetic riddims & club sounds from Jamaica", gradient: "from-emerald-500 via-lime-500 to-yellow-500" },
  { name: "Jazz", desc: "Smooth improvisations, horns & rich chords", gradient: "from-indigo-900 via-blue-900 to-sky-900" },
  { name: "Reggae", desc: "Conscious roots rhythms & offbeat guitar chops", gradient: "from-red-600 via-yellow-500 to-green-600" },
];

export default function ExploreClient({
  initialQuery = "",
  selectedGenre = "",
  searchResults,
  genreTracks,
  trendingTracks,
}: ExploreClientProps) {
  const router = useRouter();
  const [searchVal, setSearchVal] = useState(initialQuery);
  const [activeTab, setActiveTab] = useState<"tracks" | "artists" | "playlists" | "albums">("tracks");

  useEffect(() => {
    setSearchVal(initialQuery);
  }, [initialQuery]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchVal.trim()) {
      router.push(`/explore?q=${encodeURIComponent(searchVal.trim())}`);
    } else {
      router.push("/explore");
    }
  };

  const clearSearch = () => {
    setSearchVal("");
    router.push("/explore");
  };

  // 1. RENDER GENRE BROWSE STATE
  if (selectedGenre) {
    return (
      <div className="p-6 max-w-7xl mx-auto space-y-6 animate-page">
        {/* Back navigation header */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push("/explore")}
            className="p-2 bg-white/5 border border-white/10 rounded-full hover:bg-white/10 hover:border-white/20 transition-all text-white/80 hover:text-white"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h2 className="text-3xs uppercase font-extrabold tracking-wider text-ekoro-gold">Browse Genre</h2>
            <h1 className="text-3xl font-extrabold tracking-tight text-white font-display">
              {selectedGenre}
            </h1>
          </div>
        </div>

        {/* Tracks List */}
        <div className="space-y-4 pt-4">
          <div className="flex items-center justify-between border-b border-white/5 pb-2">
            <h3 className="text-sm font-semibold text-white/50">Top Tracks in {selectedGenre}</h3>
            <span className="text-xs text-white/40">{genreTracks.length} tracks available</span>
          </div>

          {genreTracks.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {genreTracks.map((track) => (
                <TrackCard key={track.id} track={track} />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-center space-y-3 bg-white/5 rounded-2xl border border-white/5">
              <span className="text-4xl">🎵</span>
              <h3 className="text-lg font-semibold text-white/80">No tracks published yet</h3>
              <p className="text-xs text-white/40 max-w-xs">
                Be the first to upload and publish a track in the {selectedGenre} genre!
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // 2. RENDER SEARCH RESULTS STATE
  if (initialQuery) {
    return (
      <div className="p-6 max-w-7xl mx-auto space-y-6 animate-page">
        {/* Search header & input */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white font-display">
              Search Results
            </h1>
            <p className="text-sm text-white/60">
              Showing matches for &ldquo;<span className="text-ekoro-gold font-semibold">{initialQuery}</span>&rdquo;
            </p>
          </div>

          <form onSubmit={handleSearchSubmit} className="relative w-full md:w-80">
            <input
              type="text"
              placeholder="Refine search..."
              value={searchVal}
              onChange={(e) => setSearchVal(e.target.value)}
              className="w-full bg-white/5 border border-white/10 focus:border-white/20 rounded-full py-2 pl-4 pr-10 outline-none text-sm text-white transition-all"
            />
            <button type="submit" className="absolute right-3 top-2.5 text-white/40 hover:text-white transition-colors">
              <Search className="w-4.5 h-4.5" />
            </button>
          </form>
        </div>

        {/* Tab Selection */}
        <div className="flex border-b border-white/5 gap-6 text-sm">
          {(["tracks", "artists", "playlists", "albums"] as const).map((tab) => {
            const label = tab.charAt(0).toUpperCase() + tab.slice(1);
            const count = searchResults ? searchResults[tab]?.length || 0 : 0;
            const isActive = activeTab === tab;

            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`pb-3 font-semibold relative transition-colors ${
                  isActive ? "text-ekoro-gold" : "text-white/55 hover:text-white"
                }`}
              >
                {label} ({count})
                {isActive && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-ekoro-gold rounded-full" />
                )}
              </button>
            );
          })}
        </div>

        {/* Tab Contents */}
        <div className="pt-2">
          {activeTab === "tracks" && (
            <div className="space-y-2">
              {searchResults?.tracks && searchResults.tracks.length > 0 ? (
                <div className="space-y-1">
                  {searchResults.tracks.map((track, index) => (
                    <TrackRow key={track.id} track={track} index={index} />
                  ))}
                </div>
              ) : (
                <EmptySearchState type="tracks" query={initialQuery} />
              )}
            </div>
          )}

          {activeTab === "artists" && (
            <div>
              {searchResults?.artists && searchResults.artists.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                  {searchResults.artists.map((artist) => (
                    <Link
                      key={artist.id}
                      href={`/artist/${encodeURIComponent(artist.name)}`}
                      className="group flex flex-col items-center bg-white/5 border border-white/5 hover:border-white/10 hover:bg-white/10 rounded-2xl p-4 text-center transition-all duration-300"
                    >
                      <div className="w-24 h-24 rounded-full overflow-hidden mb-3 relative border-2 border-transparent group-hover:border-ekoro-gold/30 transition-all duration-300">
                        <Image
                          src={artist.image}
                          alt={artist.name}
                          fill
                          unoptimized
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                      <h4 className="font-bold text-sm text-white truncate max-w-full group-hover:text-ekoro-gold transition-colors">
                        {artist.name}
                      </h4>
                      <p className="text-3xs uppercase font-extrabold tracking-wider text-white/30 mt-1">
                        Artist
                      </p>
                    </Link>
                  ))}
                </div>
              ) : (
                <EmptySearchState type="artists" query={initialQuery} />
              )}
            </div>
          )}

          {activeTab === "playlists" && (
            <div>
              {searchResults?.playlists && searchResults.playlists.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                  {searchResults.playlists.map((playlist) => (
                    <Link
                      key={playlist.id}
                      href={`/playlist/${playlist.id}`}
                      className="group bg-white/5 border border-white/5 hover:border-white/10 rounded-2xl p-3 flex flex-col hover:shadow-lg hover:shadow-black/35 transition-all"
                    >
                      <div className="aspect-square w-full rounded-xl overflow-hidden mb-3 relative">
                        <Image
                          src={playlist.cover}
                          alt={playlist.title}
                          fill
                          unoptimized
                          className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-300"
                        />
                      </div>
                      <h4 className="font-bold text-sm text-white truncate group-hover:text-ekoro-gold transition-colors">
                        {playlist.title}
                      </h4>
                      <p className="text-xs text-white/50 truncate mt-1">
                        by {playlist.creator}
                      </p>
                    </Link>
                  ))}
                </div>
              ) : (
                <EmptySearchState type="playlists" query={initialQuery} />
              )}
            </div>
          )}

          {activeTab === "albums" && (
            <div>
              {searchResults?.albums && searchResults.albums.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                  {searchResults.albums.map((album) => (
                    <Link
                      key={album.id}
                      href={`/album/${album.id}`}
                      className="group bg-white/5 border border-white/5 hover:border-white/10 rounded-2xl p-3 flex flex-col hover:shadow-lg hover:shadow-black/35 transition-all"
                    >
                      <div className="aspect-square w-full rounded-xl overflow-hidden mb-3 relative">
                        <Image
                          src={album.cover}
                          alt={album.title}
                          fill
                          unoptimized
                          className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-300"
                        />
                      </div>
                      <h4 className="font-bold text-sm text-white truncate group-hover:text-ekoro-gold transition-colors">
                        {album.title}
                      </h4>
                      <p className="text-xs text-white/50 truncate mt-1">
                        {album.artist} &bull; {album.year}
                      </p>
                    </Link>
                  ))}
                </div>
              ) : (
                <EmptySearchState type="albums" query={initialQuery} />
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  // 3. RENDER DEFAULT EXPLORE STATE
  return (
    <div className="p-6 max-w-7xl mx-auto space-y-10 animate-page">
      {/* Editorial Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-white/5 pb-6">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight text-white font-display">
            Explore Music
          </h1>
          <p className="text-sm text-white/50 mt-1 max-w-md">
            Discover rising artists, browse music genres, and stream today&apos;s most popular releases.
          </p>
        </div>

        <form onSubmit={handleSearchSubmit} className="relative w-full md:w-80">
          <input
            type="text"
            placeholder="Search tracks, artists, playlists..."
            value={searchVal}
            onChange={(e) => setSearchVal(e.target.value)}
            className="w-full bg-white/5 border border-white/10 focus:border-white/20 rounded-full py-2.5 pl-4 pr-12 outline-none text-sm text-white transition-all shadow-inner focus:shadow-black/25"
          />
          <button type="submit" className="absolute right-3.5 top-3 text-white/40 hover:text-white transition-colors">
            <Search className="w-5 h-5" />
          </button>
        </form>
      </div>

      {/* Genres Grid */}
      <div className="space-y-4">
        <div>
          <h2 className="text-xs uppercase font-extrabold tracking-widest text-ekoro-gold">Curated Genres</h2>
          <h3 className="text-xl font-bold text-white mt-0.5">Explore by Genre</h3>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {GENRES.map((genre) => (
            <div
              key={genre.name}
              onClick={() => router.push(`/explore?genre=${genre.name}`)}
              className={`group relative overflow-hidden bg-gradient-to-br ${genre.gradient} rounded-2xl p-5 aspect-[16/10] cursor-pointer hover:-translate-y-1 transition-all duration-300 hover:shadow-lg hover:shadow-black/25`}
            >
              {/* Decorative circle glow */}
              <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-white/10 rounded-full blur-xl group-hover:scale-125 transition-transform duration-500" />
              
              <div className="flex flex-col justify-between h-full relative z-10">
                <span className="text-2xs font-extrabold tracking-widest text-white/60 uppercase">Genre</span>
                <div>
                  <h4 className="text-lg font-bold text-white tracking-tight flex items-center gap-1 group-hover:gap-2 transition-all">
                    {genre.name} <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </h4>
                  <p className="text-3xs text-white/80 line-clamp-2 mt-1 leading-normal">
                    {genre.desc}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Trending Tracks Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          <div>
            <h2 className="text-xs uppercase font-extrabold tracking-widest text-ekoro-gold">Popular Today</h2>
            <h3 className="text-xl font-bold text-white mt-0.5">Trending Tracks</h3>
          </div>

          <div className="bg-white/5 border border-white/5 rounded-2xl p-4 divide-y divide-white/5">
            {trendingTracks.length > 0 ? (
              trendingTracks.slice(0, 5).map((track, index) => (
                <div key={track.id} className={index > 0 ? "pt-2 mt-2" : ""}>
                  <TrackRow track={track} index={index} />
                </div>
              ))
            ) : (
              <div className="text-center py-10 text-white/40 text-sm">
                No trending tracks recorded yet.
              </div>
            )}
          </div>
        </div>

        {/* Visual promo sidebar banner */}
        <div className="relative overflow-hidden bg-gradient-to-br from-ekoro-gold/20 via-slate-900 to-black border border-white/5 rounded-2xl p-6 flex flex-col justify-between aspect-square lg:aspect-auto">
          <div className="absolute -left-12 -top-12 w-40 h-40 bg-ekoro-gold/10 rounded-full blur-3xl" />
          
          <div className="space-y-2 relative z-10">
            <span className="text-2xs bg-ekoro-gold/10 border border-ekoro-gold/30 text-ekoro-gold font-bold px-2 py-0.5 rounded-full uppercase">Community Pick</span>
            <h3 className="text-2xl font-extrabold text-white leading-tight font-display pt-2">
              Ekoro Waveform Lounge
            </h3>
            <p className="text-xs text-white/50 leading-relaxed">
              Listen to the community-wide live music pool and vote for the absolute best weekly releases. Support your favorite artists directly.
            </p>
          </div>

          <div className="relative z-10 pt-4">
            <button
              onClick={() => router.push("/")}
              className="w-full bg-ekoro-gold hover:bg-ekoro-gold/90 text-black text-xs font-bold py-2.5 px-4 rounded-lg transition-colors flex items-center justify-center gap-1"
            >
              Launch Community Player
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function EmptySearchState({ type, query }: { type: string; query: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center space-y-3 bg-white/5 rounded-2xl border border-white/5">
      <span className="text-4xl">🔍</span>
      <h3 className="text-lg font-semibold text-white/80">No {type} matches found</h3>
      <p className="text-xs text-white/40 max-w-xs leading-relaxed">
        We couldn&apos;t find any {type} matching &ldquo;<span className="font-semibold">{query}</span>&rdquo;. Check your spelling or try searching for another term.
      </p>
    </div>
  );
}
