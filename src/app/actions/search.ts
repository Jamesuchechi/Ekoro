"use server";

import { SearchService } from "@/services/SearchService";

/**
 * Server Action: Search database for tracks, artists, playlists, and albums.
 */
export async function searchDatabase(
  query: string,
  options?: { type?: string; genre?: string; limit?: number }
) {
  try {
    const results = await SearchService.search(query, options);
    return {
      success: true,
      ...results,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || "An error occurred during search",
      artists: [],
      albums: [],
      tracks: [],
      playlists: [],
    };
  }
}
