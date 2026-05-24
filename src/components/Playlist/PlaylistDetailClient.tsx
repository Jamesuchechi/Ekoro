"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import PlaylistCover from "./PlaylistCover";
import Modal from "../UI/Modal";
import { usePlayerStore } from "@/stores/playerStore";
import {
  Play,
  Pause,
  Trash2,
  Edit,
  ArrowUp,
  ArrowDown,
  Globe,
  Lock,
  Music,
  Loader2,
  Calendar,
  User as UserIcon,
  X,
  Image as ImageIcon,
} from "lucide-react";
import {
  updatePlaylistWithFile,
  deletePlaylist,
  removeTrackFromPlaylist,
  reorderTracksInPlaylist,
  followPlaylist,
  unfollowPlaylist,
} from "@/app/actions/playlist";

interface PlaylistDetailClientProps {
  playlist: any;
  currentUser: any;
  isFollowing: boolean;
}

// Format duration helper
function formatDuration(ms: number) {
  const seconds = Math.floor(ms / 1000);
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export default function PlaylistDetailClient({
  playlist,
  currentUser,
  isFollowing: initialIsFollowing,
}: PlaylistDetailClientProps) {
  const router = useRouter();
  const { setTrack, currentTrack, isPlaying, togglePlay } = usePlayerStore();
  const [tracks, setTracks] = useState(playlist.playlistTracks || []);
  const [isFollowing, setIsFollowing] = useState(initialIsFollowing);
  
  // Edit Modal State
  const [editOpen, setEditOpen] = useState(false);
  const [editTitle, setEditTitle] = useState(playlist.title);
  const [editDesc, setEditDesc] = useState(playlist.description || "");
  const [editPublic, setEditPublic] = useState(playlist.isPublic);
  const [editCover, setEditCover] = useState<File | null>(null);
  const [editPreview, setEditPreview] = useState<string | null>(playlist.coverArtUrl);
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // General State
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    setTracks(playlist.playlistTracks || []);
  }, [playlist.playlistTracks]);

  const isOwner = currentUser?.id === playlist.userId;

  const handlePlayPlaylist = () => {
    if (tracks.length === 0) return;
    
    // Check if the current track is already from this playlist
    const currentTrackInPlaylist = tracks.find((pt: any) => pt.track.id === currentTrack?.id);
    if (currentTrackInPlaylist) {
      togglePlay();
    } else {
      // Play the first track in the playlist
      const firstTrack = tracks[0].track;
      setTrack({
        id: firstTrack.id,
        title: firstTrack.title,
        artist: firstTrack.artist?.displayName || firstTrack.artist?.username || "Unknown Artist",
        duration: formatDuration(firstTrack.durationMs),
        coverArtUrl: firstTrack.coverArtUrl || undefined,
      });
    }
  };

  const handlePlayTrack = (track: any) => {
    if (currentTrack?.id === track.id) {
      togglePlay();
    } else {
      setTrack({
        id: track.id,
        title: track.title,
        artist: track.artist?.displayName || track.artist?.username || "Unknown Artist",
        duration: formatDuration(track.durationMs),
        coverArtUrl: track.coverArtUrl || undefined,
      });
    }
  };

  const handleFollowToggle = async () => {
    if (!currentUser) {
      router.push("/login");
      return;
    }
    setActionLoading(true);
    try {
      if (isFollowing) {
        await unfollowPlaylist(playlist.id);
        setIsFollowing(false);
      } else {
        await followPlaylist(playlist.id);
        setIsFollowing(true);
      }
      router.refresh();
    } catch (err) {
      console.error("Failed to toggle follow status:", err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeletePlaylist = async () => {
    if (!confirm("Are you sure you want to delete this playlist? This action cannot be undone.")) return;
    setActionLoading(true);
    try {
      const res = await deletePlaylist(playlist.id);
      if (res.success) {
        router.push("/library/playlists");
      } else {
        alert(res.error || "Failed to delete playlist");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleRemoveTrack = async (trackId: string) => {
    // Optimistic update
    const updated = tracks.filter((pt: any) => pt.track.id !== trackId);
    setTracks(updated);

    try {
      const res = await removeTrackFromPlaylist(playlist.id, trackId);
      if (!res.success) {
        setTracks(playlist.playlistTracks || []);
        alert(res.error || "Failed to remove track");
      } else {
        router.refresh();
      }
    } catch (err) {
      setTracks(playlist.playlistTracks || []);
      console.error(err);
    }
  };

  const handleMoveUp = async (index: number) => {
    if (index === 0) return;
    const newTracks = [...tracks];
    const temp = newTracks[index];
    newTracks[index] = newTracks[index - 1];
    newTracks[index - 1] = temp;
    setTracks(newTracks);

    try {
      const trackIds = newTracks.map((pt: any) => pt.track.id);
      const res = await reorderTracksInPlaylist(playlist.id, trackIds);
      if (!res.success) {
        setTracks(playlist.playlistTracks || []);
        alert(res.error || "Failed to reorder tracks");
      } else {
        router.refresh();
      }
    } catch (err) {
      setTracks(playlist.playlistTracks || []);
      console.error(err);
    }
  };

  const handleMoveDown = async (index: number) => {
    if (index === tracks.length - 1) return;
    const newTracks = [...tracks];
    const temp = newTracks[index];
    newTracks[index] = newTracks[index + 1];
    newTracks[index + 1] = temp;
    setTracks(newTracks);

    try {
      const trackIds = newTracks.map((pt: any) => pt.track.id);
      const res = await reorderTracksInPlaylist(playlist.id, trackIds);
      if (!res.success) {
        setTracks(playlist.playlistTracks || []);
        alert(res.error || "Failed to reorder tracks");
      } else {
        router.refresh();
      }
    } catch (err) {
      setTracks(playlist.playlistTracks || []);
      console.error(err);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setEditCover(file);
      setEditPreview(URL.createObjectURL(file));
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editTitle.trim()) {
      setEditError("Title is required");
      return;
    }

    setEditLoading(true);
    setEditError(null);

    try {
      const formData = new FormData();
      formData.append("title", editTitle.trim());
      formData.append("description", editDesc.trim());
      formData.append("isPublic", String(editPublic));
      if (editCover) {
        formData.append("cover", editCover);
      }

      const res = await updatePlaylistWithFile(playlist.id, formData);
      if (res.success) {
        setEditOpen(false);
        setEditCover(null);
        router.refresh();
      } else {
        throw new Error(res.error || "Failed to update playlist");
      }
    } catch (err: any) {
      setEditError(err.message || "An unexpected error occurred");
    } finally {
      setEditLoading(false);
    }
  };

  const isCurrentPlaylistPlaying = isPlaying && tracks.some((pt: any) => pt.track.id === currentTrack?.id);

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-8 animate-page">
      {/* Header section */}
      <div className="flex flex-col md:flex-row gap-6 items-start md:items-end">
        <PlaylistCover coverArtUrl={playlist.coverArtUrl} tracks={tracks} size={200} className="shadow-xl" />

        <div className="flex-1 space-y-3">
          <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-ek-text-secondary">
            {playlist.isPublic ? (
              <span className="flex items-center gap-1"><Globe size={12} /> Public Playlist</span>
            ) : (
              <span className="flex items-center gap-1 text-ek-gold"><Lock size={12} /> Private Playlist</span>
            )}
          </div>

          <h1 className="text-3xl md:text-5xl font-bold tracking-tight text-white">{playlist.title}</h1>
          
          {playlist.description && (
            <p className="text-sm text-ek-text-secondary max-w-2xl">{playlist.description}</p>
          )}

          <div className="flex flex-wrap items-center gap-y-2 gap-x-4 text-xs text-ek-text-tertiary">
            <span className="flex items-center gap-1">
              <UserIcon size={12} /> Created by <strong className="text-white ml-0.5">{playlist.user?.displayName || playlist.user?.username}</strong>
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Calendar size={12} /> {new Date(playlist.createdAt).toLocaleDateString()}
            </span>
            <span>•</span>
            <span>{tracks.length} tracks</span>
            {playlist._count?.follows > 0 && (
              <>
                <span>•</span>
                <span>{playlist._count.follows} followers</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Actions row */}
      <div className="flex items-center gap-4 border-t border-white/5 pt-6">
        {tracks.length > 0 && (
          <button
            onClick={handlePlayPlaylist}
            className="flex items-center gap-2 px-5 py-2.5 bg-ek-gold hover:bg-ek-gold/90 text-ek-void rounded-full text-sm font-semibold transition-all active:scale-[0.97]"
          >
            {isCurrentPlaylistPlaying ? (
              <>
                <Pause size={16} fill="currentColor" />
                <span>Pause</span>
              </>
            ) : (
              <>
                <Play size={16} fill="currentColor" />
                <span>Play</span>
              </>
            )}
          </button>
        )}

        {!isOwner ? (
          <button
            onClick={handleFollowToggle}
            disabled={actionLoading}
            className="px-5 py-2.5 bg-white/5 border border-white/10 hover:border-white/20 text-white rounded-full text-sm font-medium transition-all active:scale-[0.97] disabled:opacity-50"
          >
            {actionLoading ? (
              <Loader2 size={16} className="animate-spin" />
            ) : isFollowing ? (
              "Following"
            ) : (
              "Follow"
            )}
          </button>
        ) : (
          <div className="flex items-center gap-3">
            <button
              onClick={() => setEditOpen(true)}
              className="flex items-center gap-1.5 px-4 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-full text-xs font-medium transition-colors"
            >
              <Edit size={13} />
              <span>Edit Details</span>
            </button>
            <button
              onClick={handleDeletePlaylist}
              disabled={actionLoading}
              className="flex items-center gap-1.5 px-4 py-2.5 bg-ek-red/10 hover:bg-ek-red/20 border border-ek-red/20 text-ek-red rounded-full text-xs font-medium transition-colors disabled:opacity-50"
            >
              {actionLoading ? (
                <Loader2 size={13} className="animate-spin" />
              ) : (
                <>
                  <Trash2 size={13} />
                  <span>Delete</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Tracks table */}
      <div className="space-y-4">
        {tracks.length === 0 ? (
          <div className="bg-white/5 border border-white/10 rounded-2xl p-12 text-center text-ek-text-secondary text-sm space-y-3">
            <Music size={32} className="mx-auto text-ek-text-muted" />
            <p>This playlist is empty.</p>
            <Link
              href="/explore"
              className="inline-block px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs font-semibold text-white transition-colors"
            >
              Browse Music
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-white/5 text-xs font-mono uppercase tracking-wider text-ek-text-muted">
                  <th className="pb-3 pl-3 w-12 text-center">#</th>
                  <th className="pb-3 pl-4">Title</th>
                  <th className="pb-3 pr-4 text-right w-20">Duration</th>
                  {isOwner && <th className="pb-3 text-center w-28">Order</th>}
                  {isOwner && <th className="pb-3 text-center w-16">Remove</th>}
                </tr>
              </thead>
              <tbody>
                {tracks.map((pt: any, index: number) => {
                  const t = pt.track;
                  const isCurrent = currentTrack?.id === t.id;
                  const isTrackPlaying = isCurrent && isPlaying;

                  return (
                    <tr
                      key={t.id}
                      className={`group border-b border-white/5 hover:bg-white/5 transition-colors ${
                        isCurrent ? "bg-ek-gold-glow/20" : ""
                      }`}
                    >
                      <td className="py-3.5 pl-3 text-center align-middle font-mono text-ek-text-secondary">
                        <button
                          onClick={() => handlePlayTrack(t)}
                          className="w-7 h-7 flex items-center justify-center rounded-full bg-white/0 group-hover:bg-white/10 text-ek-text-secondary hover:text-white transition-all mx-auto"
                        >
                          {isTrackPlaying ? (
                            <span className="w-2.5 h-2.5 bg-ek-gold rounded-sm animate-pulse" />
                          ) : (
                            <span className="block group-hover:hidden">{index + 1}</span>
                          )}
                          <Play
                            size={12}
                            fill="currentColor"
                            className="hidden group-hover:block text-ek-gold"
                          />
                        </button>
                      </td>
                      <td className="py-3.5 pl-4 align-middle">
                        <div className="flex items-center gap-3">
                          {t.coverArtUrl ? (
                            <div className="relative w-10 h-10 rounded-lg overflow-hidden border border-white/5 flex-shrink-0 bg-white/5">
                              <Image src={t.coverArtUrl} alt={t.title} fill unoptimized className="object-cover" />
                            </div>
                          ) : (
                            <div className="w-10 h-10 rounded-lg border border-white/5 flex items-center justify-center bg-white/5 text-ek-text-muted flex-shrink-0">
                              <Music size={16} />
                            </div>
                          )}
                          <div className="min-w-0">
                            <p className={`font-medium truncate ${isCurrent ? "text-ek-gold" : "text-white"}`}>
                              {t.title}
                            </p>
                            <p className="text-xs text-ek-text-secondary truncate mt-0.5">
                              {t.artist?.displayName || t.artist?.username || "Unknown Artist"}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 pr-4 text-right align-middle font-mono text-ek-text-secondary">
                        {formatDuration(t.durationMs)}
                      </td>
                      {isOwner && (
                        <td className="py-3.5 align-middle text-center">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => handleMoveUp(index)}
                              disabled={index === 0}
                              className="p-1 rounded bg-white/0 hover:bg-white/10 text-ek-text-secondary hover:text-white disabled:opacity-20 disabled:pointer-events-none transition-colors"
                            >
                              <ArrowUp size={14} />
                            </button>
                            <button
                              onClick={() => handleMoveDown(index)}
                              disabled={index === tracks.length - 1}
                              className="p-1 rounded bg-white/0 hover:bg-white/10 text-ek-text-secondary hover:text-white disabled:opacity-20 disabled:pointer-events-none transition-colors"
                            >
                              <ArrowDown size={14} />
                            </button>
                          </div>
                        </td>
                      )}
                      {isOwner && (
                        <td className="py-3.5 align-middle text-center">
                          <button
                            onClick={() => handleRemoveTrack(t.id)}
                            className="p-1.5 rounded-full text-ek-text-secondary hover:text-ek-red hover:bg-ek-red/10 transition-all"
                            title="Remove from playlist"
                          >
                            <X size={14} />
                          </button>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Edit Details Modal */}
      <Modal isOpen={editOpen} onClose={() => setEditOpen(false)} title="Edit Playlist Details">
        <form onSubmit={handleEditSubmit} className="space-y-4">
          {editError && (
            <div className="p-3 bg-ek-red/10 border border-ek-red/20 rounded-xl text-xs text-ek-red">
              {editError}
            </div>
          )}

          <div className="flex gap-4">
            <div
              onClick={() => fileInputRef.current?.click()}
              className="w-24 h-24 rounded-xl bg-ek-void border border-white/5 hover:border-ek-gold/30 flex flex-col items-center justify-center cursor-pointer overflow-hidden group transition-all relative flex-shrink-0"
            >
              {editPreview ? (
                <Image src={editPreview} alt="Preview" fill unoptimized className="object-cover" />
              ) : (
                <>
                  <ImageIcon size={20} className="text-ek-text-secondary group-hover:text-ek-gold transition-colors mb-1" />
                  <span className="text-[10px] text-ek-text-muted">Upload cover</span>
                </>
              )}
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/*"
                className="hidden"
              />
            </div>

            <div className="flex-1 space-y-3">
              <div>
                <label className="text-[10px] font-mono uppercase tracking-wider text-ek-text-secondary mb-1 block">
                  Title
                </label>
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  disabled={editLoading}
                  className="w-full px-3 py-2 bg-ek-void border border-white/5 rounded-xl text-sm text-ek-text-primary focus:outline-none focus:border-ek-gold/30 transition-colors"
                  maxLength={100}
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="editPublic"
                  checked={editPublic}
                  onChange={(e) => setEditPublic(e.target.checked)}
                  disabled={editLoading}
                  className="w-4 h-4 rounded border-white/5 bg-ek-void text-ek-gold focus:ring-0 focus:ring-offset-0 cursor-pointer"
                />
                <label htmlFor="editPublic" className="text-xs text-ek-text-secondary cursor-pointer select-none">
                  Make playlist public
                </label>
              </div>
            </div>
          </div>

          <div>
            <label className="text-[10px] font-mono uppercase tracking-wider text-ek-text-secondary mb-1 block">
              Description
            </label>
            <textarea
              value={editDesc}
              onChange={(e) => setEditDesc(e.target.value)}
              disabled={editLoading}
              rows={3}
              className="w-full px-3 py-2 bg-ek-void border border-white/5 rounded-xl text-sm text-ek-text-primary focus:outline-none focus:border-ek-gold/30 transition-colors resize-none"
              maxLength={300}
            />
          </div>

          <button
            type="submit"
            disabled={editLoading || !editTitle.trim()}
            className="w-full py-2.5 px-4 bg-ek-gold hover:bg-ek-gold/90 text-ek-void text-sm font-semibold rounded-xl active:scale-[0.98] transition-all disabled:opacity-40 disabled:pointer-events-none flex items-center justify-center gap-2 mt-2"
          >
            {editLoading ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                <span>Saving...</span>
              </>
            ) : (
              <span>Save Changes</span>
            )}
          </button>
        </form>
      </Modal>
    </div>
  );
}
