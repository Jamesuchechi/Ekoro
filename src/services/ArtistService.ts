import { fetchMusicBrainz, fetchLastFm, fetchDiscogs } from "./apiClients";
import { CacheService } from "./CacheService";
import { ImageService } from "./ImageService";

const ARTIST_CACHE_TTL = 24 * 60 * 60; // 24 hours in seconds

export interface UnifiedArtist {
  id: string;
  name: string;
  bio: string;
  image: string;
  genres: string[];
  albums: {
    id: string;
    title: string;
    cover: string;
    artist: string;
    year: number | string;
  }[];
}

export class ArtistService {
  /**
   * Fetch artist details by MusicBrainz Artist ID
   */
  public static async getArtist(id: string): Promise<UnifiedArtist | null> {
    const cacheKey = `artist:${id}`;
    const cached = await CacheService.get<UnifiedArtist>(cacheKey);
    if (cached) return cached;

    try {
      // 1. Fetch primary metadata from MusicBrainz
      const mbData = await fetchMusicBrainz(`artist/${id}`, {
        inc: "release-groups",
      });

      const name = mbData.name;
      let bio = mbData.disambiguation || "No biography available.";
      let genres: string[] = [];
      const albums: UnifiedArtist["albums"] = [];

      // 2. Fetch bio and similar artists from Last.fm
      try {
        const lastFmData = await fetchLastFm("artist.getinfo", { mbid: id });
        if (lastFmData && lastFmData.artist) {
          if (lastFmData.artist.bio && lastFmData.artist.bio.summary) {
            // Clean up Last.fm link formatting in summary
            bio = lastFmData.artist.bio.summary.replace(/<a\s+href="[^"]+">Read more on Last.fm<\/a>\.?/gi, "").trim();
          }
          if (lastFmData.artist.tags && Array.isArray(lastFmData.artist.tags.tag)) {
            genres = lastFmData.artist.tags.tag.map((tag: any) => tag.name);
          }
        }
      } catch (lastFmError) {
        console.warn(`Last.fm bio fetch failed for artist ID ${id}:`, lastFmError);
      }

      // 3. Secondary Enrichment with Discogs (if Last.fm genres are empty)
      if (genres.length === 0) {
        try {
          const discogsData = await fetchDiscogs("database/search", {
            q: name,
            type: "artist",
          });
          if (discogsData && discogsData.results && discogsData.results.length > 0) {
            const matchedArtist = discogsData.results[0];
            if (Array.isArray(matchedArtist.genre)) {
              genres = matchedArtist.genre;
            }
          }
        } catch (discogsError) {
          console.warn(`Discogs genre enrichment failed for artist ${name}:`, discogsError);
        }
      }

      // 4. Resolve Artist Image
      const image = await ImageService.getArtistImage(name, id);

      // 5. Parse and map release groups to Albums
      const releaseGroups = mbData["release-groups"] || [];
      const albumsToProcess = releaseGroups
        .filter((rg: any) => {
          const type = rg["primary-type"];
          return type === "Album" || type === "EP" || !type;
        })
        .slice(0, 8); // limit to top 8 to control parallel request overhead

      for (const rg of albumsToProcess) {
        const rgId = rg.id;
        const rgTitle = rg.title;
        const rgYear = rg["first-release-date"]
          ? new Date(rg["first-release-date"]).getFullYear()
          : "Unknown";

        // Fetch cover art (will fetch from cache or CAA)
        const cover = await ImageService.getAlbumCover(rgId);

        albums.push({
          id: rgId,
          title: rgTitle,
          cover,
          artist: name,
          year: rgYear,
        });
      }

      const artist: UnifiedArtist = {
        id,
        name,
        bio: bio || "No biography available.",
        image,
        genres: genres.slice(0, 5), // return top 5 genres
        albums,
      };

      await CacheService.set(cacheKey, artist, ARTIST_CACHE_TTL);
      return artist;
    } catch (error) {
      console.error(`ArtistService.getArtist failed for ${id}:`, error);
      return null;
    }
  }
}
