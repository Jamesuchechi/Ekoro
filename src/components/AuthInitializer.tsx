"use client";

import React, { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuthStore } from "@/stores/authStore";
import { usePlayerStore } from "@/stores/playerStore";
import { getUserLikedTrackIds } from "@/app/actions/likes";

export default function AuthInitializer({ children }: { children: React.ReactNode }) {
  const { setUser, setProfile, setLoading, clearAuth } = useAuthStore();
  const { setLikedTracks } = usePlayerStore();
  const supabase = createClient();

  useEffect(() => {
    const initializeAuth = async () => {
      setLoading(true);
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (session?.user) {
          setUser(session.user);
          try {
            const res = await fetch(`/api/users/${session.user.id}`);
            if (res.ok) {
              const data = await res.json();
              if (data.success) setProfile(data.data);
            }
          } catch {
            // profile fetch failing shouldn't break auth
          }
          try {
            const likedIds = await getUserLikedTrackIds();
            setLikedTracks(likedIds);
          } catch {
            setLikedTracks([]);
          }
        } else {
          clearAuth();
          setLikedTracks([]);
        }
      } catch (err) {
        console.error("Auth init failed:", err);
        clearAuth();
        setLikedTracks([]);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        setUser(session.user);
        try {
          const res = await fetch(`/api/users/${session.user.id}`);
          if (res.ok) {
            const data = await res.json();
            if (data.success) setProfile(data.data);
          }
        } catch {
          // non-fatal
        }
        try {
          const likedIds = await getUserLikedTrackIds();
          setLikedTracks(likedIds);
        } catch {
          setLikedTracks([]);
        }
      } else {
        clearAuth();
        setLikedTracks([]);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return <>{children}</>;
}
