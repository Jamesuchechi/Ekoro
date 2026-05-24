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
          // Fetch public user profile
          const res = await fetch(`/api/users/${session.user.id}`);
          if (res.ok) {
            const data = await res.json();
            if (data.success) {
              setProfile(data.data);
            }
          }
          // Fetch liked track IDs
          const likedIds = await getUserLikedTrackIds();
          setLikedTracks(likedIds);
        } else {
          clearAuth();
          setLikedTracks([]);
        }
      } catch (err) {
        console.error("Failed to initialize authentication:", err);
        clearAuth();
        setLikedTracks([]);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();

    // Listen for real-time authentication events (login, logout, token refresh)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        setUser(session.user);
        try {
          const res = await fetch(`/api/users/${session.user.id}`);
          if (res.ok) {
            const data = await res.json();
            if (data.success) {
              setProfile(data.data);
            }
          }
          const likedIds = await getUserLikedTrackIds();
          setLikedTracks(likedIds);
        } catch (err) {
          console.error("Failed to refresh user profile:", err);
        }
      } else {
        clearAuth();
        setLikedTracks([]);
      }
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase, setUser, setProfile, setLoading, clearAuth, setLikedTracks]);

  return <>{children}</>;
}
