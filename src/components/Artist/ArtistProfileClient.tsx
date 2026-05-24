"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import TrackRow from "../Track/TrackRow";
import PlaylistCover from "../Playlist/PlaylistCover";
import { followUser, unfollowUser } from "@/app/actions/follow";
import {
  Check,
  UserPlus,
  UserMinus,
  Music,
  Disc,
  ListMusic,
  Loader2,
} from "lucide-react";
import { Track } from "@/types";

interface ArtistProfileClientProps {
  artist: any;
  popularTracks: any[];
  tracksResult: {
    tracks: any[];
    total: number;
    totalPages: number;
    page: number;
  };
  albums: any[];
  playlists: any[];
  currentUser: any;
  isFollowing: boolean;
}

// Helpers
function formatCount(count: bigint | number) {
  const num = Number(count);
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num.toString();
}

function formatDuration(ms: number) {
  const seconds = Math.floor(ms / 1000);
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function mapDbTrackToTrack(dbTrack: any): Track {
  return {
    id: dbTrack.id,
    title: dbTrack.title,
    artist: dbTrack.artist?.displayName || dbTrack.artist?.username || "Unknown",
    plays: dbTrack.playCount ? formatCount(dbTrack.playCount) : "0",
    genre: dbTrack.genre || undefined,
    duration: formatDuration(dbTrack.durationMs),
    coverArtUrl: dbTrack.coverArtUrl || undefined,
  };
}

export default function ArtistProfileClient({
  artist,
  popularTracks,
  tracksResult,
  albums,
  playlists,
  currentUser,
  isFollowing: initialIsFollowing,
}: ArtistProfileClientProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"tracks" | "albums" | "playlists">("tracks");
  const [isFollowing, setIsFollowing] = useState(initialIsFollowing);
  const [followerCount, setFollowerCount] = useState(artist._count?.followers || 0);
  const [actionLoading, setActionLoading] = useState(false);

  // Pagination for Discography
  const [discography, setDiscography] = useState(tracksResult.tracks);
  const [currentPage, setCurrentPage] = useState(tracksResult.page);
  const [totalPages, setTotalPages] = useState(tracksResult.totalPages);
  const [pageLoading, setPageLoading] = useState(false);

  const isSelf = currentUser?.id === artist.id;

  const handleFollowToggle = async () => {
    if (!currentUser) {
      router.push("/login");
      return;
    }
    setActionLoading(true);
    try {
      if (isFollowing) {
        const res = await unfollowUser(artist.id);
        if (res.success) {
          setIsFollowing(false);
          setFollowerCount((prev: number) => Math.max(0, prev - 1));
        }
      } else {
        const res = await followUser(artist.id);
        if (res.success) {
          setIsFollowing(true);
          setFollowerCount((prev: number) => prev + 1);
        }
      }
      router.refresh();
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  };

  const handlePageChange = async (newPage: number) => {
    if (newPage < 1 || newPage > totalPages || pageLoading) return;
    setPageLoading(true);
    try {
      const res = await fetch(`/api/artists/${artist.id}/tracks?page=${newPage}&limit=10`);
      const data = await res.json();
      if (data.success) {
        setDiscography(data.data.tracks);
        setCurrentPage(data.data.page);
        setTotalPages(data.data.totalPages);
      }
    } catch (err) {
      console.error("Failed to fetch tracks page:", err);
    } finally {
      setPageLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-8 animate-page">
      {/* Tall Premium Banner / Header */}
      <div className="relative rounded-3xl overflow-hidden bg-gradient-to-b from-ek-raised to-ek-surface border border-white/5 p-6 md:p-8 flex flex-col md:flex-row items-center md:items-end gap-6 shadow-2xl">
        <div className="relative w-32 h-32 md:w-40 md:h-40 rounded-full overflow-hidden border-2 border-white/10 bg-white/5 flex-shrink-0 shadow-lg">
          {artist.avatarUrl ? (
            <Image
              src={artist.avatarUrl}
              alt={artist.displayName || artist.username}
              fill
              unoptimized
              className="object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-white/20 text-5xl bg-white/5">
              {artist.displayName?.[0]?.toUpperCase() || artist.username?.[0]?.toUpperCase()}
            </div>
          )}
        </div>

        <div className="flex-1 text-center md:text-left space-y-3 min-w-0">
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
            <span className="text-[10px] font-mono uppercase tracking-wider text-ek-text-secondary bg-white/5 px-2 py-0.5 rounded-full border border-white/5">
              Artist
            </span>
            {artist.isVerified && (
              <span className="flex items-center gap-1 text-[10px] font-semibold text-ek-blue bg-ek-blue/10 px-2 py-0.5 rounded-full border border-ek-blue/20">
                <Check size={10} strokeWidth={4} />
                <span>Verified</span>
              </span>
            )}
          </div>

          <h1 className="text-3xl md:text-5xl font-bold tracking-tight text-white truncate">
            {artist.displayName || artist.username}
          </h1>

          {artist.bio && (
            <p className="text-sm text-ek-text-secondary max-w-2xl line-clamp-2 md:line-clamp-none">
              {artist.bio}
            </p>
          )}

          <div className="flex items-center justify-center md:justify-start gap-4 text-xs font-mono text-ek-text-tertiary">
            <span>{formatCount(followerCount)} followers</span>
            <span>•</span>
            <span>{artist._count?.tracks || 0} tracks</span>
          </div>
        </div>

        {/* Action Button */}
        {!isSelf && (
          <div className="flex-shrink-0">
            <button
              onClick={handleFollowToggle}
              disabled={actionLoading}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-full text-xs font-semibold tracking-wider uppercase transition-all active:scale-[0.97] disabled:opacity-50 ${
                isFollowing
                  ? "bg-white/5 border border-white/10 hover:border-white/20 text-white"
                  : "bg-ek-gold text-ek-void hover:bg-ek-gold/90"
              }`}
            >
              {actionLoading ? (
                <Loader2 size={12} className="animate-spin" />
              ) : isFollowing ? (
                <>
                  <UserMinus size={12} />
                  <span>Unfollow</span>
                </>
              ) : (
                <>
                  <UserPlus size={12} />
                  <span>Follow</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Popular Tracks Section */}
      {popularTracks.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xs font-mono uppercase tracking-wider text-ek-text-secondary">
            Popular
          </h2>
          <div className="bg-white/5 border border-white/10 rounded-2xl p-2.5 divide-y divide-white/5">
            {popularTracks.map((dbTrack, idx) => (
              <TrackRow
                key={dbTrack.id}
                track={mapDbTrackToTrack(dbTrack)}
                index={idx}
              />
            ))}
          </div>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="border-b border-white/5">
        <nav className="flex gap-6 text-sm font-medium">
          <button
            onClick={() => setActiveTab("tracks")}
            className={`pb-4 relative text-xs font-mono uppercase tracking-wider transition-colors ${
              activeTab === "tracks" ? "text-ek-gold" : "text-ek-text-secondary hover:text-white"
            }`}
          >
            Discography
            {activeTab === "tracks" && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-ek-gold rounded-full" />
            )}
          </button>
          <button
            onClick={() => setActiveTab("albums")}
            className={`pb-4 relative text-xs font-mono uppercase tracking-wider transition-colors ${
              activeTab === "albums" ? "text-ek-gold" : "text-ek-text-secondary hover:text-white"
            }`}
          >
            Albums
            {activeTab === "albums" && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-ek-gold rounded-full" />
            )}
          </button>
          <button
            onClick={() => setActiveTab("playlists")}
            className={`pb-4 relative text-xs font-mono uppercase tracking-wider transition-colors ${
              activeTab === "playlists" ? "text-ek-gold" : "text-ek-text-secondary hover:text-white"
            }`}
          >
            Playlists
            {activeTab === "playlists" && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-ek-gold rounded-full" />
            )}
          </button>
        </nav>
      </div>

      {/* Tab Panels */}
      <div className="min-h-[200px]">
        {activeTab === "tracks" && (
          <div className="space-y-6">
            {discography.length === 0 ? (
              <div className="text-center py-12 text-ek-text-secondary text-sm space-y-2">
                <Music size={24} className="mx-auto text-ek-text-muted" />
                <p>No tracks published yet.</p>
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  {discography.map((dbTrack, idx) => (
                    <TrackRow
                      key={dbTrack.id}
                      track={mapDbTrackToTrack(dbTrack)}
                      index={(currentPage - 1) * 10 + idx}
                    />
                  ))}
                </div>

                {/* Discography Pagination */}
                {totalPages > 1 && (
                  <div className="flex justify-center items-center gap-4 pt-4">
                    <button
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1 || pageLoading}
                      className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 hover:border-white/20 text-xs font-medium transition-colors disabled:opacity-30"
                    >
                      Previous
                    </button>
                    <span className="text-xs font-mono text-ek-text-secondary">
                      Page {currentPage} of {totalPages}
                    </span>
                    <button
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages || pageLoading}
                      className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 hover:border-white/20 text-xs font-medium transition-colors disabled:opacity-30"
                    >
                      Next
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {activeTab === "albums" && (
          <div className="space-y-4">
            {albums.length === 0 ? (
              <div className="text-center py-12 text-ek-text-secondary text-sm space-y-2">
                <Disc size={24} className="mx-auto text-ek-text-muted" />
                <p>No albums released yet.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {albums.map((album) => (
                  <Link
                    key={album.id}
                    href={`/album/${album.id}`}
                    className="group block bg-white/0 hover:bg-white/5 border border-transparent hover:border-white/10 rounded-2xl p-3 transition-all duration-300"
                  >
                    <div className="relative w-full h-auto aspect-square rounded-xl overflow-hidden border border-white/5 bg-white/5 shadow-lg group-hover:scale-[1.02] transition-transform duration-300">
                      {album.coverArtUrl ? (
                        <Image
                          src={album.coverArtUrl}
                          alt={album.title}
                          fill
                          unoptimized
                          className="object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-white/20">
                          <Disc size={32} />
                        </div>
                      )}
                    </div>
                    <h3 className="font-semibold text-sm text-white group-hover:text-ek-gold truncate mt-3 transition-colors">
                      {album.title}
                    </h3>
                    <p className="text-xs text-ek-text-secondary mt-1">
                      {album._count?.albumTracks || 0} tracks
                    </p>
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === "playlists" && (
          <div className="space-y-4">
            {playlists.length === 0 ? (
              <div className="text-center py-12 text-ek-text-secondary text-sm space-y-2">
                <ListMusic size={24} className="mx-auto text-ek-text-muted" />
                <p>No public playlists available.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {playlists.map((playlist) => (
                  <Link
                    key={playlist.id}
                    href={`/playlist/${playlist.id}`}
                    className="group block bg-white/0 hover:bg-white/5 border border-transparent hover:border-white/10 rounded-2xl p-3 transition-all duration-300"
                  >
                    <PlaylistCover
                      coverArtUrl={playlist.coverArtUrl}
                      tracks={playlist.playlistTracks || []}
                      size={160}
                      className="w-full h-auto aspect-square rounded-xl shadow-lg transition-transform duration-300 group-hover:scale-[1.02]"
                    />
                    <h3 className="font-semibold text-sm text-white group-hover:text-ek-gold truncate mt-3 transition-colors">
                      {playlist.title}
                    </h3>
                    <p className="text-xs text-ek-text-secondary mt-1">
                      {playlist.playlistTracks?.length || 0} tracks
                    </p>
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
