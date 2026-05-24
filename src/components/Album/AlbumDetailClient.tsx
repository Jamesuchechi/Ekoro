"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Play,
  Pause,
  Edit,
  Plus,
  Trash2,
  Calendar,
  Music,
  Disc,
  Clock,
  Heart,
  Loader2
} from "lucide-react";
import { usePlayerStore } from "@/stores/playerStore";
import { updateAlbumAction, addTrackToAlbumAction, removeTrackFromAlbumAction } from "@/app/actions/albums";
import Modal from "../UI/Modal";

interface AlbumDetailClientProps {
  album: any;
  currentUser: any;
}

export default function AlbumDetailClient({
  album: initialAlbum,
  currentUser
}: AlbumDetailClientProps) {
  const router = useRouter();
  const { currentTrack, isPlaying, setTrack, togglePlay, setQueue } = usePlayerStore();
  const [album, setAlbum] = useState(initialAlbum);
  
  // Modals / Edit state
  const [editOpen, setEditOpen] = useState(false);
  const [editTitle, setEditTitle] = useState(album.title);
  const [editDesc, setEditDesc] = useState(album.description || "");
  const [editGenre, setEditGenre] = useState(album.genre || "");
  const [editType, setEditType] = useState(album.albumType);
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  // Track management states
  const [availableTracks, setAvailableTracks] = useState<any[]>([]);
  const [addTrackLoading, setAddTrackLoading] = useState<string | null>(null);
  const [removeTrackLoading, setRemoveTrackLoading] = useState<string | null>(null);

  const isArtistOwner = currentUser?.id === album.artist.id;

  // Format Duration Helper
  const formatDuration = (ms: number) => {
    const totSec = Math.floor(ms / 1000);
    const mins = Math.floor(totSec / 60);
    const secs = totSec % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  // Maps a DB track to frontend player store type
  const mapTrackToPlayerType = (t: any) => {
    const artistName = t.artist?.displayName || t.artist?.username || "Unknown Artist";
    const coverUrl = t.coverArtUrl
      ? t.coverArtUrl.startsWith("http") || t.coverArtUrl.startsWith("/")
        ? t.coverArtUrl
        : `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/tracks/${t.coverArtUrl}`
      : album.coverArtUrl
      ? album.coverArtUrl.startsWith("http") || album.coverArtUrl.startsWith("/")
        ? album.coverArtUrl
        : `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/covers/${album.coverArtUrl}`
      : "/images/default-cover.jpg";

    const playCountNum = parseInt(t.playCount || "0", 10);
    let playsStr = `${playCountNum}`;
    if (playCountNum >= 1000000) playsStr = `${(playCountNum / 1000000).toFixed(1)}M`;
    else if (playCountNum >= 1000) playsStr = `${(playCountNum / 1000).toFixed(1)}K`;

    return {
      id: t.id,
      title: t.title,
      artist: artistName,
      duration: formatDuration(t.durationMs || 0),
      cover: coverUrl,
      plays: playsStr,
      genre: t.genre || "Alternative",
      color: "from-amber-600 to-amber-900",
      emoji: "💿",
    };
  };

  // Convert all album tracks to player store type
  const frontendTracks = album.albumTracks.map((at: any) => mapTrackToPlayerType(at.track));

  const handlePlayAlbum = () => {
    if (frontendTracks.length === 0) return;
    
    const isCurrentInAlbum = frontendTracks.some((t: any) => t.id === currentTrack?.id);
    if (isCurrentInAlbum) {
      togglePlay();
    } else {
      setQueue(frontendTracks, 0);
    }
  };

  const handlePlayTrack = (track: any) => {
    const mapped = mapTrackToPlayerType(track);
    const index = frontendTracks.findIndex((ft: any) => ft.id === track.id);
    
    if (currentTrack?.id === track.id) {
      togglePlay();
    } else {
      // Set the full album queue and start from the clicked track index
      setQueue(frontendTracks, index >= 0 ? index : 0);
    }
  };

  // Fetch artist's other tracks to add to the album
  useEffect(() => {
    if (!isArtistOwner || !editOpen) return;
    async function fetchArtistTracks() {
      try {
        const res = await fetch(`/api/users/me/tracks`);
        if (res.ok) {
          const data = await res.json();
          if (data.success && Array.isArray(data.tracks)) {
            // Filter out tracks that are already in this album
            const currentTrackIds = album.albumTracks.map((at: any) => at.track.id);
            const filtered = data.tracks.filter((t: any) => !currentTrackIds.includes(t.id));
            setAvailableTracks(filtered);
          }
        }
      } catch (err) {
        console.error("Failed to fetch artist tracks:", err);
      }
    }
    fetchArtistTracks();
  }, [isArtistOwner, editOpen, album.albumTracks]);

  // Handle Edit Submit
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEditLoading(true);
    setEditError(null);

    const res = await updateAlbumAction(album.id, {
      title: editTitle,
      description: editDesc,
      genre: editGenre,
      albumType: editType,
    });

    setEditLoading(false);
    if (res.success) {
      setAlbum((prev: any) => ({
        ...prev,
        title: res.album?.title,
        description: res.album?.description,
        genre: res.album?.genre,
        albumType: res.album?.albumType,
        slug: res.album?.slug,
      }));
      setEditOpen(false);
      // Redirect to the new slug if it changed
      if (res.album?.slug && res.album.slug !== album.slug) {
        router.push(`/album/${res.album.slug}`);
      }
    } else {
      setEditError(res.error || "Failed to update album metadata");
    }
  };

  // Add Track
  const handleAddTrack = async (trackId: string) => {
    setAddTrackLoading(trackId);
    const res = await addTrackToAlbumAction(album.id, trackId);
    setAddTrackLoading(null);

    if (res.success && res.albumTrack) {
      // Re-fetch album from database to stay fully synchronized
      router.refresh();
      // Temporarily update local UI state until refresh is completed
      const added = availableTracks.find((t) => t.id === trackId);
      if (added) {
        setAlbum((prev: any) => {
          const newTracks = [
            ...prev.albumTracks,
            {
              trackOrder: prev.albumTracks.length + 1,
              track: {
                ...added,
                playCount: added.playCount?.toString() || "0",
                downloadCount: added.downloadCount?.toString() || "0",
              },
            },
          ];
          return { ...prev, albumTracks: newTracks };
        });
        setAvailableTracks((prev) => prev.filter((t) => t.id !== trackId));
      }
    }
  };

  // Remove Track
  const handleRemoveTrack = async (trackId: string) => {
    setRemoveTrackLoading(trackId);
    const res = await removeTrackFromAlbumAction(album.id, trackId);
    setRemoveTrackLoading(null);

    if (res.success) {
      router.refresh();
      setAlbum((prev: any) => {
        const filtered = prev.albumTracks.filter((at: any) => at.track.id !== trackId);
        // Re-calculate orders
        const mapped = filtered.map((at: any, index: number) => ({
          ...at,
          trackOrder: index + 1,
        }));
        return { ...prev, albumTracks: mapped };
      });
    }
  };

  const isAlbumPlaying = frontendTracks.some((t: any) => t.id === currentTrack?.id) && isPlaying;
  const albumCover = album.coverArtUrl
    ? album.coverArtUrl.startsWith("http") || album.coverArtUrl.startsWith("/")
      ? album.coverArtUrl
      : `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/covers/${album.coverArtUrl}`
    : "/images/default-cover.jpg";

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-8 animate-page relative">
      <div className="absolute -top-24 -left-24 w-80 h-80 rounded-full bg-amber-500/5 blur-3xl pointer-events-none z-0" />

      {/* Album Header Block */}
      <div className="flex flex-col md:flex-row gap-6 items-start md:items-end relative z-10">
        <div className="w-48 h-48 md:w-56 md:h-56 relative rounded-2xl overflow-hidden shadow-2xl border border-white/5 bg-ekoro-dark-paper flex items-center justify-center text-6xl">
          {album.coverArtUrl ? (
            <Image
              src={albumCover}
              alt={album.title}
              fill
              unoptimized
              className="object-cover"
            />
          ) : (
            "💿"
          )}
        </div>

        <div className="flex-1 space-y-3 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-4xs px-2.5 py-0.5 bg-amber-500/10 border border-amber-500/20 text-amber-500 rounded-full font-bold uppercase tracking-wider">
              {album.albumType}
            </span>
            {album.genre && (
              <span className="text-4xs px-2.5 py-0.5 bg-white/5 border border-white/10 text-white/60 rounded-full font-bold uppercase tracking-wider">
                {album.genre}
              </span>
            )}
          </div>

          <h1 className="text-3xl md:text-5xl font-bold tracking-tight text-white leading-tight truncate">
            {album.title}
          </h1>

          <p className="text-xs text-white/50 leading-relaxed max-w-2xl">
            {album.description || `No description provided for this ${album.albumType}.`}
          </p>

          <div className="flex flex-wrap items-center gap-4 text-xs text-ek-text-secondary pt-2">
            <Link
              href={`/artist/${album.artist.username}`}
              className="font-bold text-white hover:text-ek-gold flex items-center gap-1.5 transition-colors"
            >
              <Disc size={13} className="text-ek-gold animate-spin-slow" />
              <span>{album.artist.displayName || album.artist.username}</span>
            </Link>

            <span className="text-white/20">•</span>

            <span className="flex items-center gap-1.5 font-mono">
              <Calendar size={13} />
              <span>
                {album.releaseDate
                  ? new Date(album.releaseDate).toLocaleDateString(undefined, {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })
                  : "Released recently"}
              </span>
            </span>

            <span className="text-white/20">•</span>

            <span className="flex items-center gap-1.5 font-mono">
              <Music size={13} />
              <span>{album.albumTracks.length} tracks</span>
            </span>
          </div>

          {/* Action Row */}
          <div className="flex items-center gap-3 pt-4">
            {album.albumTracks.length > 0 && (
              <button
                onClick={handlePlayAlbum}
                className="flex items-center justify-center gap-2 px-6 py-3 bg-ek-gold hover:bg-ek-gold/90 text-ek-void rounded-xl text-xs font-bold transition-all active:scale-[0.97] shadow-lg shadow-ek-gold/10"
              >
                {isAlbumPlaying ? (
                  <Pause size={14} fill="currentColor" />
                ) : (
                  <Play size={14} fill="currentColor" className="ml-0.5" />
                )}
                <span>{isAlbumPlaying ? "Pause" : "Play Full Album"}</span>
              </button>
            )}

            {isArtistOwner && (
              <button
                onClick={() => setEditOpen(true)}
                className="flex items-center justify-center gap-1.5 px-4 py-3 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-xl text-xs font-bold transition-all active:scale-[0.97]"
              >
                <Edit size={14} />
                <span>Manage Album</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Album Tracks Grid */}
      <div className="relative z-10">
        {album.albumTracks.length === 0 ? (
          <div className="bg-white/5 border border-white/10 rounded-2xl p-16 text-center text-ek-text-secondary text-sm space-y-4 max-w-xl mx-auto mt-8">
            <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mx-auto text-white/40">
              <Music size={22} />
            </div>
            <div className="space-y-1">
              <p className="font-semibold text-white">No tracks in this album</p>
              {isArtistOwner ? (
                <p className="text-xs">Click &apos;Manage Album&apos; to add tracks you have published.</p>
              ) : (
                <p className="text-xs">The artist hasn&apos;t added any tracks to this album yet.</p>
              )}
            </div>
          </div>
        ) : (
          <div className="bg-ekoro-dark-paper border border-white/5 rounded-2xl p-4 md:p-6 space-y-2">
            <div className="text-4xs font-mono uppercase tracking-wider text-white/30 px-2 pb-2 border-b border-white/5 flex items-center justify-between">
              <span>Track Title & Artist</span>
              <span className="mr-12">Duration</span>
            </div>

            <div className="space-y-1 pt-2">
              {album.albumTracks.map((at: any) => {
                const tr = at.track;
                const isCurrent = currentTrack?.id === tr.id;
                const isPlayingThis = isCurrent && isPlaying;
                
                return (
                  <div
                    key={tr.id}
                    onClick={() => handlePlayTrack(tr)}
                    className={`flex items-center justify-between p-3 rounded-xl hover:bg-white/5 cursor-pointer group transition-all duration-200 ${
                      isCurrent ? "bg-white/5 text-ek-gold" : "text-white"
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="text-xs font-mono text-white/40 w-4 text-right">
                        {at.trackOrder}
                      </span>
                      <div className="flex items-center justify-center w-8 h-8 rounded bg-white/5 text-white/40 flex-shrink-0 relative">
                        {isCurrent && isPlaying ? (
                          <Pause size={14} className="text-ek-gold" />
                        ) : (
                          <Play size={14} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                        )}
                        {(!isCurrent || !isPlaying) && (
                          <span className="group-hover:opacity-0 transition-opacity text-xs">🎵</span>
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className={`text-xs font-semibold truncate ${isCurrent ? "text-ek-gold" : "text-white"}`}>
                          {tr.title}
                        </p>
                        <p className="text-4xs text-white/50 truncate mt-0.5">
                          {tr.artist.displayName || tr.artist.username}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-6 text-xs text-white/40 font-mono">
                      <span>{formatDuration(tr.durationMs || 0)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Manage Album Modal */}
      <Modal isOpen={editOpen} onClose={() => setEditOpen(false)} title="Manage Album">
        <form onSubmit={handleEditSubmit} className="space-y-6">
          {editError && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-xs text-red-500">
              {editError}
            </div>
          )}

          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-4xs font-mono uppercase tracking-wider text-white/50">Album Title</label>
              <input
                type="text"
                required
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-ek-gold/50"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-4xs font-mono uppercase tracking-wider text-white/50">Genre</label>
                <input
                  type="text"
                  value={editGenre}
                  onChange={(e) => setEditGenre(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-ek-gold/50"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-4xs font-mono uppercase tracking-wider text-white/50">Type</label>
                <select
                  value={editType}
                  onChange={(e: any) => setEditType(e.target.value)}
                  className="w-full bg-ekoro-dark-paper border border-white/10 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-ek-gold/50"
                >
                  <option value="album">Album</option>
                  <option value="ep">EP</option>
                  <option value="single">Single</option>
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-4xs font-mono uppercase tracking-wider text-white/50">Description</label>
              <textarea
                value={editDesc}
                onChange={(e) => setEditDesc(e.target.value)}
                rows={3}
                className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-ek-gold/50 resize-none"
              />
            </div>
          </div>

          <div className="border-t border-white/5 pt-4 space-y-4">
            <h4 className="text-3xs font-mono uppercase tracking-wider text-ek-gold">Album Tracks</h4>

            {/* Tracks currently in the album */}
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {album.albumTracks.length === 0 ? (
                <p className="text-[11px] text-white/40 italic">No tracks in this album yet.</p>
              ) : (
                album.albumTracks.map((at: any) => (
                  <div key={at.track.id} className="flex items-center justify-between bg-white/5 p-2.5 rounded-lg border border-white/5">
                    <span className="text-xs text-white truncate max-w-xs">{at.track.title}</span>
                    <button
                      type="button"
                      disabled={removeTrackLoading !== null}
                      onClick={() => handleRemoveTrack(at.track.id)}
                      className="text-red-500 hover:text-red-400 p-1 transition-colors"
                    >
                      {removeTrackLoading === at.track.id ? (
                        <Loader2 size={13} className="animate-spin" />
                      ) : (
                        <Trash2 size={13} />
                      )}
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* Add more tracks section */}
            {availableTracks.length > 0 && (
              <div className="space-y-2">
                <label className="text-4xs font-mono uppercase tracking-wider text-white/50">Add tracks to album</label>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {availableTracks.map((tr) => (
                    <div key={tr.id} className="flex items-center justify-between bg-white/0 hover:bg-white/5 p-2.5 rounded-lg border border-dashed border-white/10">
                      <span className="text-xs text-white truncate max-w-xs">{tr.title}</span>
                      <button
                        type="button"
                        disabled={addTrackLoading !== null}
                        onClick={() => handleAddTrack(tr.id)}
                        className="text-ek-gold hover:text-ek-gold/80 p-1 flex items-center gap-1 text-[10px] font-bold tracking-tight uppercase"
                      >
                        {addTrackLoading === tr.id ? (
                          <Loader2 size={13} className="animate-spin" />
                        ) : (
                          <>
                            <Plus size={12} />
                            <span>Add</span>
                          </>
                        )}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/5">
            <button
              type="button"
              onClick={() => setEditOpen(false)}
              className="px-4 py-2 text-xs font-bold text-white/60 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={editLoading}
              className="flex items-center justify-center gap-1.5 px-5 py-2 bg-ek-gold hover:bg-ek-gold/90 text-ek-void rounded-xl text-xs font-bold transition-all active:scale-[0.97] disabled:opacity-50"
            >
              {editLoading && <Loader2 size={14} className="animate-spin" />}
              <span>Save Metadata</span>
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
