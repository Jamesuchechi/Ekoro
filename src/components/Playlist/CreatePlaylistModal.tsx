"use client";

import React, { useState, useRef } from "react";
import Image from "next/image";
import Modal from "../UI/Modal";
import { createPlaylist, updatePlaylistWithFile } from "@/app/actions/playlist";
import { Image as ImageIcon, Loader2 } from "lucide-react";

interface CreatePlaylistModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (playlist: any) => void;
}

export default function CreatePlaylistModal({
  isOpen,
  onClose,
  onSuccess,
}: CreatePlaylistModalProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [isPublic, setIsPublic] = useState(true);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setCoverFile(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError("Title is required");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // 1. Create the playlist record first
      const createRes = await createPlaylist({
        title: title.trim(),
        description: description.trim() || null,
        isPublic,
      });

      if (!createRes.success || !createRes.data) {
        throw new Error(createRes.error || "Failed to create playlist");
      }

      const createdPlaylist = createRes.data;

      // 2. If a cover art file was selected, upload it
      if (coverFile) {
        const formData = new FormData();
        formData.append("title", title.trim());
        formData.append("description", description.trim());
        formData.append("isPublic", String(isPublic));
        formData.append("cover", coverFile);

        const uploadRes = await updatePlaylistWithFile(createdPlaylist.id, formData);
        if (!uploadRes.success) {
          console.error("Cover upload failed:", uploadRes.error);
        } else {
          createdPlaylist.coverArtUrl = uploadRes.data?.coverArtUrl || null;
        }
      }

      // Reset state and call callbacks
      setTitle("");
      setDescription("");
      setIsPublic(true);
      setCoverFile(null);
      setPreviewUrl(null);
      if (onSuccess) onSuccess(createdPlaylist);
      onClose();
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create Playlist">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-ek-red/10 border border-ek-red/20 rounded-xl text-xs text-ek-red">
            {error}
          </div>
        )}

        <div className="flex gap-4">
          {/* Cover Art Preview */}
          <div
            onClick={() => fileInputRef.current?.click()}
            className="w-24 h-24 rounded-xl bg-ek-void border border-white/5 hover:border-ek-gold/30 flex flex-col items-center justify-center cursor-pointer overflow-hidden group transition-all relative flex-shrink-0"
          >
            {previewUrl ? (
              <Image
                src={previewUrl}
                alt="Preview"
                fill
                unoptimized
                className="object-cover"
              />
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
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="My awesome playlist"
                disabled={loading}
                className="w-full px-3 py-2 bg-ek-void border border-white/5 rounded-xl text-sm text-ek-text-primary placeholder:text-ek-text-muted focus:outline-none focus:border-ek-gold/30 transition-colors"
                maxLength={100}
              />
            </div>

            <div className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="isPublic"
                checked={isPublic}
                onChange={(e) => setIsPublic(e.target.checked)}
                disabled={loading}
                className="w-4 h-4 rounded border-white/5 bg-ek-void text-ek-gold focus:ring-0 focus:ring-offset-0 cursor-pointer"
              />
              <label htmlFor="isPublic" className="text-xs text-ek-text-secondary cursor-pointer select-none">
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
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Add an optional description for your playlist"
            disabled={loading}
            rows={3}
            className="w-full px-3 py-2 bg-ek-void border border-white/5 rounded-xl text-sm text-ek-text-primary placeholder:text-ek-text-muted focus:outline-none focus:border-ek-gold/30 transition-colors resize-none"
            maxLength={300}
          />
        </div>

        <button
          type="submit"
          disabled={loading || !title.trim()}
          className="w-full py-2.5 px-4 bg-ek-gold hover:bg-ek-gold/90 text-ek-void text-sm font-semibold rounded-xl active:scale-[0.98] transition-all disabled:opacity-40 disabled:pointer-events-none flex items-center justify-center gap-2 mt-2"
        >
          {loading ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              <span>Creating...</span>
            </>
          ) : (
            <span>Create Playlist</span>
          )}
        </button>
      </form>
    </Modal>
  );
}
