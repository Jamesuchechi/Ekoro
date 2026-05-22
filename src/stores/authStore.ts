import { create } from "zustand";
import { User } from "@supabase/supabase-js";

interface AuthState {
  user: User | null;
  profile: any | null; // Corresponds to public.users record
  isLoading: boolean;
  setUser: (user: User | null) => void;
  setProfile: (profile: any | null) => void;
  setLoading: (isLoading: boolean) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  profile: null,
  isLoading: true,
  setUser: (user) => set({ user }),
  setProfile: (profile) => set({ profile }),
  setLoading: (isLoading) => set({ isLoading }),
  clearAuth: () => set({ user: null, profile: null }),
}));
