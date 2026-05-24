import { create } from "zustand";
import { Track } from "@/types";
import { likeTrack, unlikeTrack } from "@/app/actions/likes";

interface PlayerState {
  currentTrack: Track | null;
  isPlaying: boolean;
  isBuffering: boolean;
  volume: number;
  progress: number;
  currentTime: number;
  likedTracks: string[];
  setTrack: (track: Track) => void;
  togglePlay: () => void;
  setIsPlaying: (isPlaying: boolean) => void;
  setIsBuffering: (isBuffering: boolean) => void;
  setVolume: (volume: number) => void;
  setProgress: (progress: number) => void;
  setCurrentTime: (currentTime: number) => void;
  toggleLikeTrack: (trackId: string) => void;
  setLikedTracks: (likedTracks: string[]) => void;
}

export const usePlayerStore = create<PlayerState>((set, get) => ({
  currentTrack: {
    id: "1",
    title: "Essence",
    artist: "Wizkid ft. Tems",
    plays: "14.2M",
    genre: "Afrobeats",
    color: "from-blue-600 to-indigo-800",
    emoji: "🔥",
    duration: "3:38",
  }, // Initialize with default track
  isPlaying: false,
  isBuffering: false,
  volume: 75,
  progress: 38,
  currentTime: 84,
  likedTracks: [],
  setTrack: (track) =>
    set({
      currentTrack: track,
      isPlaying: true,
      isBuffering: true, // Auto-buffer on track change
      progress: 0,
      currentTime: 0,
    }),
  togglePlay: () => set((state) => ({ isPlaying: !state.isPlaying })),
  setIsPlaying: (isPlaying) => set({ isPlaying }),
  setIsBuffering: (isBuffering) => set({ isBuffering }),
  setVolume: (volume) => set({ volume }),
  setProgress: (progress) => set({ progress }),
  setCurrentTime: (currentTime) => set({ currentTime }),
  toggleLikeTrack: async (trackId) => {
    const state = get();
    const isLiked = state.likedTracks.includes(trackId);
    
    // Optimistic update
    set((state) => ({
      likedTracks: isLiked
        ? state.likedTracks.filter((id) => id !== trackId)
        : [...state.likedTracks, trackId],
    }));

    try {
      const res = isLiked ? await unlikeTrack(trackId) : await likeTrack(trackId);
      if (!res.success) {
        // Rollback
        set((state) => ({
          likedTracks: isLiked
            ? [...state.likedTracks, trackId]
            : state.likedTracks.filter((id) => id !== trackId),
        }));
      }
    } catch (err) {
      console.error("Failed to sync like status:", err);
      // Rollback
      set((state) => ({
        likedTracks: isLiked
          ? [...state.likedTracks, trackId]
          : state.likedTracks.filter((id) => id !== trackId),
      }));
    }
  },
  setLikedTracks: (likedTracks) => set({ likedTracks }),
}));
