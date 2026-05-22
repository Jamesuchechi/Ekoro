import { fetchLastFm } from "./apiClients";
import { CacheService } from "./CacheService";

const REC_CACHE_TTL = 6 * 60 * 60; // 6 hours in seconds

export interface RecommendedTrack {
  id: string;
  title: string;
  artist: string;
  duration: string;
  emoji?: string;
  color?: string;
}

export class RecommendationService {
  /**
   * Get similar tracks from Last.fm by track name/artist or MBID
   */
  public static async getSimilarTracks(
    artist: string,
    title: string,
    mbid?: string,
    limit = 5
  ): Promise<RecommendedTrack[]> {
    const cacheKey = `rec:tracks:${mbid || `${artist}:${title}`}:${limit}`;
    const cached = await CacheService.get<RecommendedTrack[]>(cacheKey);
    if (cached) return cached;

    const tracks: RecommendedTrack[] = [];

    try {
      const params: Record<string, string> = { limit: limit.toString() };
      if (mbid) {
        params.mbid = mbid;
      } else {
        params.artist = artist;
        params.track = title;
      }

      const data = await fetchLastFm("track.getsimilar", params);
      const trackList = data?.similartracks?.track;

      if (Array.isArray(trackList)) {
        trackList.slice(0, limit).forEach((t: any, index: number) => {
          const durationSec = parseInt(t.duration, 10) || 180;
          const mins = Math.floor(durationSec / 60);
          const secs = durationSec % 60;
          const durationStr = `${mins}:${secs < 10 ? "0" : ""}${secs}`;

          tracks.push({
            id: t.mbid || `rec_t_${index}_${Date.now()}`,
            title: t.name,
            artist: t.artist?.name || "Unknown Artist",
            duration: durationStr,
          });
        });
      }
    } catch (error) {
      console.warn(`Last.fm similar tracks failed for "${title}" by ${artist}:`, error);
    }

    await CacheService.set(cacheKey, tracks, REC_CACHE_TTL);
    return tracks;
  }

  /**
   * Get similar artists from Last.fm by artist name or MBID
   */
  public static async getSimilarArtists(
    artistName: string,
    mbid?: string,
    limit = 5
  ): Promise<string[]> {
    const cacheKey = `rec:artists:${mbid || artistName}:${limit}`;
    const cached = await CacheService.get<string[]>(cacheKey);
    if (cached) return cached;

    let artists: string[] = [];

    try {
      const params: Record<string, string> = { limit: limit.toString() };
      if (mbid) {
        params.mbid = mbid;
      } else {
        params.artist = artistName;
      }

      const data = await fetchLastFm("artist.getsimilar", params);
      const artistList = data?.similarartists?.artist;

      if (Array.isArray(artistList)) {
        artists = artistList.slice(0, limit).map((a: any) => a.name);
      }
    } catch (error) {
      console.warn(`Last.fm similar artists failed for ${artistName}:`, error);
    }

    await CacheService.set(cacheKey, artists, REC_CACHE_TTL);
    return artists;
  }

  /**
   * Fetch top trending tracks
   */
  public static async getTrendingTracks(limit = 10): Promise<RecommendedTrack[]> {
    const cacheKey = `rec:trending:tracks:${limit}`;
    const cached = await CacheService.get<RecommendedTrack[]>(cacheKey);
    if (cached) return cached;

    const tracks: RecommendedTrack[] = [];

    try {
      const data = await fetchLastFm("chart.gettoptracks", { limit: limit.toString() });
      const trackList = data?.tracks?.track;

      if (Array.isArray(trackList)) {
        const emojis = ["🔥", "⚡", "🌟", "🎸", "🎵", "🌊", "🎙️", "✨", "❤️", "⚡"];
        const colors = [
          "from-blue-600 to-indigo-800",
          "from-emerald-600 to-teal-800",
          "from-amber-600 to-orange-800",
          "from-purple-600 to-fuchsia-800",
          "from-red-500 to-rose-700",
          "from-green-500 to-emerald-700",
          "from-cyan-500 to-blue-700",
          "from-yellow-500 to-amber-600",
        ];

        trackList.slice(0, limit).forEach((t: any, index: number) => {
          tracks.push({
            id: t.mbid || `trending_t_${index}`,
            title: t.name,
            artist: t.artist?.name || "Unknown Artist",
            duration: "3:30", // default placeholder since global top tracks don't always yield durations
            emoji: emojis[index % emojis.length],
            color: colors[index % colors.length],
          });
        });
      }
    } catch (error) {
      console.warn("Last.fm get top tracks failed:", error);
    }

    await CacheService.set(cacheKey, tracks, REC_CACHE_TTL);
    return tracks;
  }
}
