import { fetchLrclib } from "./apiClients";
import { CacheService } from "./CacheService";

const LYRICS_CACHE_TTL = 30 * 24 * 60 * 60; // 30 days in seconds

export class LyricsService {
  /**
   * Fetch lyrics from LRCLIB for a given artist and track title
   */
  public static async getLyrics(artist: string, title: string, durationSeconds?: number): Promise<string> {
    const cleanArtist = artist.trim();
    const cleanTitle = title.trim();
    const cacheKey = `lyrics:${cleanArtist}:${cleanTitle}`;
    
    const cached = await CacheService.get<string>(cacheKey);
    if (cached !== null) return cached;

    let lyrics = "";

    try {
      const params: Record<string, string> = {
        artist: cleanArtist,
        track: cleanTitle,
      };

      if (durationSeconds) {
        params.duration = Math.round(durationSeconds).toString();
      }

      // Try direct lookup
      const data = await fetchLrclib("lookup", params);
      
      if (data && data.syncedLyrics) {
        lyrics = data.syncedLyrics;
      } else if (data && data.plainLyrics) {
        lyrics = data.plainLyrics;
      } else {
        // Fallback: search LRCLIB
        const searchResults = await fetchLrclib("search", { q: `${cleanArtist} ${cleanTitle}` });
        if (searchResults && searchResults.length > 0) {
          const match = searchResults[0];
          lyrics = match.syncedLyrics || match.plainLyrics || "";
        }
      }
    } catch (error) {
      console.warn(`LRCLIB lyrics lookup failed for "${cleanTitle}" by ${cleanArtist}:`, error);
    }

    // Cache the result (even if empty, to avoid refetching nonexistent lyrics)
    await CacheService.set(cacheKey, lyrics, LYRICS_CACHE_TTL);
    return lyrics;
  }
}
