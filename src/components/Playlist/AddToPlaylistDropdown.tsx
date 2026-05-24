"use client";

import React, { useState, useEffect, useRef } from "react";
import { Plus, Loader2, MoreHorizontal } from "lucide-react";
import { getUserPlaylistsAction, addTrackToPlaylist } from "@/app/actions/playlist";

interface AddToPlaylistDropdownProps {
  trackId: string;
}

export default function AddToPlaylistDropdown({ trackId }: AddToPlaylistDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [playlists, setPlaylists] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [addingTo, setAddingTo] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setMessage(null);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      fetchPlaylists();
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const fetchPlaylists = async () => {
    setLoading(true);
    try {
      const res = await getUserPlaylistsAction();
      if (res.success && res.data) {
        setPlaylists(res.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async (e: React.MouseEvent, playlistId: string) => {
    e.stopPropagation();
    setAddingTo(playlistId);
    setMessage(null);
    try {
      const res = await addTrackToPlaylist(playlistId, trackId);
      if (res.success) {
        setMessage("Added to playlist!");
        setTimeout(() => setIsOpen(false), 1200);
      } else {
        setMessage(res.error || "Failed to add track");
      }
    } catch (err: any) {
      setMessage(err.message || "Error adding track");
    } finally {
      setAddingTo(null);
    }
  };

  return (
    <div className="relative inline-block" ref={dropdownRef}>
      <button
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        className="p-1.5 rounded-full hover:bg-white/10 text-white/40 hover:text-white transition-colors flex items-center justify-center"
        title="Add to playlist"
      >
        <MoreHorizontal size={14} />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-52 rounded-xl border border-white/10 bg-ek-surface shadow-2xl p-2 z-50 text-left animate-[fadeIn_0.15s_ease-out]">
          <p className="text-[10px] font-mono uppercase tracking-wider text-ek-text-secondary px-2.5 py-1.5 border-b border-white/5 mb-1.5">
            Add to Playlist
          </p>

          {message && (
            <div className={`px-2 py-1.5 mb-1.5 rounded-lg text-xs font-semibold text-center ${
              message.includes("Added") ? "bg-ek-green-dim text-ek-green" : "bg-ek-red/10 text-ek-red"
            }`}>
              {message}
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center py-4 text-ek-text-muted">
              <Loader2 size={16} className="animate-spin text-ek-text-secondary" />
            </div>
          ) : playlists.length === 0 ? (
            <div className="px-2 py-3 text-center text-xs text-ek-text-muted">
              No playlists found.
            </div>
          ) : (
            <div className="max-h-48 overflow-y-auto space-y-0.5">
              {playlists.map((playlist) => (
                <button
                  key={playlist.id}
                  onClick={(e) => handleAdd(e, playlist.id)}
                  disabled={addingTo !== null}
                  className="w-full text-left px-2.5 py-1.5 hover:bg-white/5 rounded-lg text-xs text-white flex items-center justify-between transition-colors group"
                >
                  <span className="truncate group-hover:text-ek-gold transition-colors">
                    {playlist.title}
                  </span>
                  {addingTo === playlist.id ? (
                    <Loader2 size={12} className="animate-spin text-ek-gold" />
                  ) : (
                    <Plus size={12} className="text-ek-text-muted group-hover:text-ek-gold transition-colors" />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
