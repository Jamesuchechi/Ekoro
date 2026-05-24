"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import PlaylistCover from "./PlaylistCover";
import CreatePlaylistModal from "./CreatePlaylistModal";
import { Plus, ListMusic, Music, Globe, Lock } from "lucide-react";

interface LibraryPlaylistsClientProps {
  userPlaylists: any[];
  followedPlaylists: any[];
}

export default function LibraryPlaylistsClient({
  userPlaylists,
  followedPlaylists,
}: LibraryPlaylistsClientProps) {
  const router = useRouter();
  const [createOpen, setCreateOpen] = useState(false);

  const handleCreateSuccess = (playlist: any) => {
    // Redirect to the newly created playlist page
    router.push(`/playlist/${playlist.id}`);
  };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-8 animate-page">
      {/* Header section */}
      <div className="flex items-center justify-between border-b border-white/5 pb-6">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight text-white">Your Playlists</h1>
          <p className="text-xs text-ek-text-secondary">
            Manage your custom playlists and follow public collections.
          </p>
        </div>
        <button
          onClick={() => setCreateOpen(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-ek-gold hover:bg-ek-gold/90 text-ek-void rounded-xl text-xs font-semibold transition-all active:scale-[0.97]"
        >
          <Plus size={14} />
          <span>Create Playlist</span>
        </button>
      </div>

      {/* Main Grid */}
      <div className="space-y-8">
        {/* User created playlists */}
        <div className="space-y-4">
          <h2 className="text-xs font-mono uppercase tracking-wider text-ek-text-secondary">
            Created by you ({userPlaylists.length})
          </h2>

          {userPlaylists.length === 0 ? (
            <div className="bg-white/5 border border-white/10 rounded-2xl p-12 text-center text-ek-text-secondary text-sm space-y-3">
              <ListMusic size={32} className="mx-auto text-ek-text-muted" />
              <p>You haven&apos;t created any playlists yet.</p>
              <button
                onClick={() => setCreateOpen(true)}
                className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs font-semibold text-white transition-colors"
              >
                Create Playlist
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {userPlaylists.map((playlist) => (
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
                  <div className="mt-3 min-w-0">
                    <div className="flex items-center justify-between gap-1.5">
                      <h3 className="font-semibold text-sm text-white group-hover:text-ek-gold truncate transition-colors">
                        {playlist.title}
                      </h3>
                      {playlist.isPublic ? (
                        <Globe size={11} className="text-ek-text-muted flex-shrink-0" />
                      ) : (
                        <Lock size={11} className="text-ek-gold flex-shrink-0" />
                      )}
                    </div>
                    <p className="text-xs text-ek-text-secondary mt-1">
                      {playlist._count?.playlistTracks || 0} tracks
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Followed playlists */}
        {followedPlaylists.length > 0 && (
          <div className="space-y-4 pt-4 border-t border-white/5">
            <h2 className="text-xs font-mono uppercase tracking-wider text-ek-text-secondary">
              Followed playlists ({followedPlaylists.length})
            </h2>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {followedPlaylists.map((playlist) => (
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
                  <div className="mt-3 min-w-0">
                    <h3 className="font-semibold text-sm text-white group-hover:text-ek-gold truncate transition-colors">
                      {playlist.title}
                    </h3>
                    <p className="text-xs text-ek-text-secondary mt-1">
                      by {playlist.user?.displayName || playlist.user?.username}
                    </p>
                    <p className="text-[10px] text-ek-text-tertiary mt-0.5">
                      {playlist._count?.playlistTracks || 0} tracks
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Creation Modal */}
      <CreatePlaylistModal
        isOpen={createOpen}
        onClose={() => setCreateOpen(false)}
        onSuccess={handleCreateSuccess}
      />
    </div>
  );
}
