"use client";

import { useState, useEffect, useCallback } from "react";
import { likeTrack, unlikeTrack, getUserLikedTrackIds } from "@/app/actions/likes";

/**
 * useLikes — syncs the current user's liked track IDs from the DB.
 * Provides optimistic toggle so the UI feels instant.
 */
export function useLikes() {
  const [likedIds, setLikedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  // Load from DB on mount
  useEffect(() => {
    getUserLikedTrackIds().then((ids) => {
      setLikedIds(new Set(ids));
      setLoading(false);
    });
  }, []);

  const isLiked = useCallback(
    (trackId: string) => likedIds.has(trackId),
    [likedIds]
  );

  const toggle = useCallback(
    async (trackId: string) => {
      const wasLiked = likedIds.has(trackId);

      // Optimistic update
      setLikedIds((prev) => {
        const next = new Set(prev);
        if (wasLiked) next.delete(trackId);
        else next.add(trackId);
        return next;
      });

      // Persist to DB
      const result = wasLiked
        ? await unlikeTrack(trackId)
        : await likeTrack(trackId);

      // Roll back on failure
      if (!result.success) {
        setLikedIds((prev) => {
          const next = new Set(prev);
          if (wasLiked) next.add(trackId);
          else next.delete(trackId);
          return next;
        });
      }

      return result;
    },
    [likedIds]
  );

  return { isLiked, toggle, likedIds, loading };
}
