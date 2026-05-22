import { fetchMusicBrainz } from "./apiClients";
import { CacheService } from "./CacheService";
import { LyricsService } from "./LyricsService";
import { RecommendationService, RecommendedTrack } from "./RecommendationService";
import { ImageService } from "./ImageService";

const TRACK_CACHE_TTL = 24 * 60 * 60; // 24 hours in seconds

export interface UnifiedTrackDetails {
  id: string;
  title: string;
  artist: string;
  duration: string;
  cover: string;
  lyrics: string;
  similarTracks: RecommendedTrack[];
}

export class TrackService {
  /**
   * Fetch track details by MusicBrainz Recording ID
   */
  public static async getTrack(id: string): Promise<UnifiedTrackDetails | null> {
    const cacheKey = `track:details:${id}`;
    const cached = await CacheService.get<UnifiedTrackDetails>(cacheKey);
    if (cached) return cached;

    try {
      // 1. Fetch primary metadata from MusicBrainz
      const mbData = await fetchMusicBrainz(`recording/${id}`, {
        inc: "releases+artists",
      });

      const title = mbData.title;
      const artistName = mbData["artist-credit"]?.[0]?.name || "Unknown Artist";
      
      const durationMs = mbData.length || 0;
      const durationSeconds = durationMs / 1000;
      const mins = Math.floor(durationMs / 60000);
      const secs = Math.floor((durationMs % 60000) / 1000);
      const durationStr = `${mins}:${secs < 10 ? "0" : ""}${secs}`;

      // Find first release for cover art resolution
      let cover = "/images/default-album.png";
      const releases = mbData.releases;
      if (Array.isArray(releases) && releases.length > 0) {
        const releaseGroupId = releases[0]["release-group"]?.id;
        if (releaseGroupId) {
          cover = await ImageService.getAlbumCover(releaseGroupId);
        }
      }

      // 2. Fetch lyrics from LRCLIB
      const lyrics = await LyricsService.getLyrics(artistName, title, durationSeconds);

      // 3. Fetch similar tracks from Last.fm
      const similarTracks = await RecommendationService.getSimilarTracks(artistName, title, id);

      const track: UnifiedTrackDetails = {
        id,
        title,
        artist: artistName,
        duration: durationStr,
        cover,
        lyrics,
        similarTracks,
      };

      await CacheService.set(cacheKey, track, TRACK_CACHE_TTL);
      return track;
    } catch (error) {
      console.error(`TrackService.getTrack failed for ${id}:`, error);
      return null;
    }
  }
}
