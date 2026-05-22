import { fetchMusicBrainz, fetchDiscogs } from "./apiClients";
import { CacheService } from "./CacheService";
import { ImageService } from "./ImageService";

const ALBUM_CACHE_TTL = 24 * 60 * 60; // 24 hours in seconds

export interface UnifiedTrack {
  id: string;
  title: string;
  artist: string;
  duration: string;
}

export interface UnifiedAlbum {
  id: string;
  title: string;
  cover: string;
  artist: string;
  tracks: UnifiedTrack[];
  year: number | string;
  genre?: string;
  label?: string;
}

export class AlbumService {
  /**
   * Fetch album details by MusicBrainz Release Group ID or Release ID
   */
  public static async getAlbum(id: string): Promise<UnifiedAlbum | null> {
    const cacheKey = `album:${id}`;
    const cached = await CacheService.get<UnifiedAlbum>(cacheKey);
    if (cached) return cached;

    try {
      let releaseGroupId = "";
      let releaseId = "";
      let title = "";
      let artistName = "";
      let year: number | string = "Unknown";
      const tracks: UnifiedTrack[] = [];

      // 1. Determine if this ID is a Release Group or a Release
      // We attempt to fetch as a release-group first
      let releaseGroupData: any = null;
      try {
        releaseGroupData = await fetchMusicBrainz(`release-group/${id}`, {
          inc: "releases+artists",
        });
        releaseGroupId = id;
      } catch (e) {
        // If release-group fetch fails, try fetching as a release
        try {
          const releaseData = await fetchMusicBrainz(`release/${id}`, {
            inc: "release-groups+artists+recordings",
          });
          releaseId = id;
          releaseGroupId = releaseData["release-group"]?.id || "";
          title = releaseData.title;
          artistName = releaseData["artist-credit"]?.[0]?.name || "Unknown Artist";
          year = releaseData.date ? new Date(releaseData.date).getFullYear() : "Unknown";

          // Parse tracks directly
          if (Array.isArray(releaseData.media)) {
            releaseData.media.forEach((medium: any) => {
              if (Array.isArray(medium.tracks)) {
                medium.tracks.forEach((t: any) => {
                  const durationMs = t.length || 0;
                  const mins = Math.floor(durationMs / 60000);
                  const secs = Math.floor((durationMs % 60000) / 1000);
                  const durationStr = `${mins}:${secs < 10 ? "0" : ""}${secs}`;

                  tracks.push({
                    id: t.recording?.id || t.id,
                    title: t.title,
                    artist: artistName,
                    duration: durationStr,
                  });
                });
              }
            });
          }
        } catch (err) {
          console.error(`Failed to fetch album by ID ${id} as either release-group or release:`, err);
          return null;
        }
      }

      // If we fetched a release group, we need to pick a release to get the tracks
      if (releaseGroupData) {
        title = releaseGroupData.title;
        artistName = releaseGroupData["artist-credit"]?.[0]?.name || "Unknown Artist";
        year = releaseGroupData["first-release-date"]
          ? new Date(releaseGroupData["first-release-date"]).getFullYear()
          : "Unknown";

        const releases = releaseGroupData.releases;
        if (Array.isArray(releases) && releases.length > 0) {
          // Sort or pick the primary release (e.g. official release)
          const official = releases.find((r: any) => r.status === "Official") || releases[0];
          releaseId = official.id;

          // Fetch the tracks for this release
          const releaseDetails = await fetchMusicBrainz(`release/${releaseId}`, {
            inc: "recordings",
          });

          if (Array.isArray(releaseDetails.media)) {
            releaseDetails.media.forEach((medium: any) => {
              if (Array.isArray(medium.tracks)) {
                medium.tracks.forEach((t: any) => {
                  const durationMs = t.length || 0;
                  const mins = Math.floor(durationMs / 60000);
                  const secs = Math.floor((durationMs % 60000) / 1000);
                  const durationStr = `${mins}:${secs < 10 ? "0" : ""}${secs}`;

                  tracks.push({
                    id: t.recording?.id || t.id,
                    title: t.title,
                    artist: artistName,
                    duration: durationStr,
                  });
                });
              }
            });
          }
        }
      }

      // 2. Fetch Album Cover
      const cover = releaseGroupId ? await ImageService.getAlbumCover(releaseGroupId) : "/images/default-album.png";

      // 3. Secondary Enrichment with Discogs
      let genre = "";
      let label = "";
      try {
        // Query after MusicBrainz data exists
        const discogsData = await fetchDiscogs("database/search", {
          q: `${artistName} - ${title}`,
          type: "release",
        });

        if (discogsData && discogsData.results && discogsData.results.length > 0) {
          const matchedRelease = discogsData.results[0];
          genre = matchedRelease.genre ? matchedRelease.genre.join(", ") : "";
          label = matchedRelease.label ? matchedRelease.label[0] : "";
        }
      } catch (discogsError) {
        console.warn(`Discogs enrichment failed for album ${title} by ${artistName}:`, discogsError);
      }

      const album: UnifiedAlbum = {
        id: releaseGroupId || releaseId,
        title,
        cover,
        artist: artistName,
        tracks,
        year,
        genre: genre || undefined,
        label: label || undefined,
      };

      await CacheService.set(cacheKey, album, ALBUM_CACHE_TTL);
      return album;
    } catch (error) {
      console.error(`AlbumService.getAlbum failed for ${id}:`, error);
      return null;
    }
  }
}
