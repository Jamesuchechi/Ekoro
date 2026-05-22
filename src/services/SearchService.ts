import { fetchMusicBrainz, fetchLastFm, fetchDiscogs } from "./apiClients";
import { CacheService } from "./CacheService";
import { ImageService } from "./ImageService";

const SEARCH_CACHE_TTL = 24 * 60 * 60; // 24 hours in seconds

export interface ArtistSearchResult {
  id: string;
  name: string;
  image: string;
  genres: string[];
}

export interface AlbumSearchResult {
  id: string;
  title: string;
  cover: string;
  artist: string;
  year: number | string;
}

export interface TrackSearchResult {
  id: string;
  title: string;
  artist: string;
  duration: string;
  cover: string;
}

export interface UnifiedSearchResults {
  artists: ArtistSearchResult[];
  albums: AlbumSearchResult[];
  tracks: TrackSearchResult[];
}

export class SearchService {
  /**
   * Fallback: Query Last.fm search APIs
   */
  private static async searchLastFm(query: string, limit: number): Promise<UnifiedSearchResults> {
    const cleanQuery = query.trim();

    const [resArtists, resAlbums, resTracks] = await Promise.all([
      fetchLastFm("artist.search", { artist: cleanQuery, limit: limit.toString() }),
      fetchLastFm("album.search", { album: cleanQuery, limit: limit.toString() }),
      fetchLastFm("track.search", { track: cleanQuery, limit: limit.toString() }),
    ]);

    const artists: ArtistSearchResult[] = [];
    const albums: AlbumSearchResult[] = [];
    const tracks: TrackSearchResult[] = [];

    // Parse Artists
    const rawArtists = resArtists?.results?.artistmatches?.artist;
    if (Array.isArray(rawArtists)) {
      rawArtists.slice(0, limit).forEach((art: any) => {
        let image = "/images/default-artist.png";
        if (Array.isArray(art.image)) {
          const mega = art.image.find((img: any) => img.size === "mega");
          const extralarge = art.image.find((img: any) => img.size === "extralarge");
          const large = art.image.find((img: any) => img.size === "large");
          image = mega?.["#text"] || extralarge?.["#text"] || large?.["#text"] || image;
        }
        artists.push({
          id: art.mbid || `lf_art_${encodeURIComponent(art.name)}`,
          name: art.name || "Unknown Artist",
          image,
          genres: ["Artist"],
        });
      });
    }

    // Parse Albums
    const rawAlbums = resAlbums?.results?.albummatches?.album;
    if (Array.isArray(rawAlbums)) {
      rawAlbums.slice(0, limit).forEach((alb: any) => {
        let cover = "/images/default-album.png";
        if (Array.isArray(alb.image)) {
          const mega = alb.image.find((img: any) => img.size === "mega");
          const extralarge = alb.image.find((img: any) => img.size === "extralarge");
          const large = alb.image.find((img: any) => img.size === "large");
          cover = mega?.["#text"] || extralarge?.["#text"] || large?.["#text"] || cover;
        }
        albums.push({
          id: alb.mbid || `lf_alb_${encodeURIComponent(alb.artist)}:${encodeURIComponent(alb.name)}`,
          title: alb.name || "Unknown Album",
          cover,
          artist: alb.artist || "Unknown Artist",
          year: "Recent",
        });
      });
    }

    // Parse Tracks
    const rawTracks = resTracks?.results?.trackmatches?.track;
    if (Array.isArray(rawTracks)) {
      rawTracks.slice(0, limit).forEach((tr: any) => {
        let cover = "/images/default-album.png";
        if (Array.isArray(tr.image)) {
          const mega = tr.image.find((img: any) => img.size === "mega");
          const extralarge = tr.image.find((img: any) => img.size === "extralarge");
          const large = tr.image.find((img: any) => img.size === "large");
          cover = mega?.["#text"] || extralarge?.["#text"] || large?.["#text"] || cover;
        }
        tracks.push({
          id: tr.mbid || `lf_tr_${encodeURIComponent(tr.artist)}:${encodeURIComponent(tr.name)}`,
          title: tr.name || "Unknown Track",
          artist: tr.artist || "Unknown Artist",
          duration: "3:30",
          cover,
        });
      });
    }

    return { artists, albums, tracks };
  }

  /**
   * Fallback: Query Discogs search APIs
   */
  private static async searchDiscogs(query: string, limit: number): Promise<UnifiedSearchResults> {
    const cleanQuery = query.trim();

    const [resArtists, resReleases] = await Promise.all([
      fetchDiscogs("database/search", { q: cleanQuery, type: "artist", per_page: limit.toString() }),
      fetchDiscogs("database/search", { q: cleanQuery, type: "release", per_page: (limit * 2).toString() }),
    ]);

    const artists: ArtistSearchResult[] = [];
    const albums: AlbumSearchResult[] = [];
    const tracks: TrackSearchResult[] = [];

    // Parse Discogs Artists
    const rawArtists = resArtists?.results;
    if (Array.isArray(rawArtists)) {
      rawArtists.slice(0, limit).forEach((art: any) => {
        artists.push({
          id: `dc_art_${art.id}`,
          name: art.title || "Unknown Artist",
          image: art.cover_image || art.thumb || "/images/default-artist.png",
          genres: Array.isArray(art.genre) && art.genre.length > 0 ? art.genre : ["Artist"],
        });
      });
    }

    // Parse Discogs Releases (to Albums and Tracks)
    const rawReleases = resReleases?.results;
    if (Array.isArray(rawReleases)) {
      rawReleases.slice(0, limit).forEach((rel: any, idx: number) => {
        let artistName = "Unknown Artist";
        let titleText = rel.title || "Unknown Release";
        if (rel.title && rel.title.includes(" - ")) {
          const parts = rel.title.split(" - ");
          artistName = parts[0];
          titleText = parts.slice(1).join(" - ");
        }

        albums.push({
          id: `dc_alb_${rel.id}`,
          title: titleText,
          cover: rel.cover_image || rel.thumb || "/images/default-album.png",
          artist: artistName,
          year: rel.year || "Unknown",
        });

        if (idx < limit) {
          tracks.push({
            id: `dc_tr_${rel.id}`,
            title: titleText,
            artist: artistName,
            duration: "3:15",
            cover: rel.cover_image || rel.thumb || "/images/default-album.png",
          });
        }
      });
    }

    return { artists, albums, tracks };
  }

  /**
   * Search across Artists, Albums, and Tracks
   */
  public static async search(query: string, limit = 5): Promise<UnifiedSearchResults> {
    const cleanQuery = query.trim();
    if (!cleanQuery) {
      return { artists: [], albums: [], tracks: [] };
    }

    const cacheKey = `search:${cleanQuery}:${limit}`;
    const cached = await CacheService.get<UnifiedSearchResults>(cacheKey);
    if (cached) return cached;

    let artistsData: any;
    let albumsData: any;
    let tracksData: any;

    try {
      // 1. Search MusicBrainz (in parallel, respecting the throttle queue)
      const [resArtists, resAlbums, resTracks] = await Promise.all([
        fetchMusicBrainz("artist", { query: cleanQuery, limit: limit.toString() }),
        fetchMusicBrainz("release-group", { query: cleanQuery, limit: limit.toString() }),
        fetchMusicBrainz("recording", { query: cleanQuery, limit: limit.toString() }),
      ]);
      artistsData = resArtists;
      albumsData = resAlbums;
      tracksData = resTracks;
    } catch (mbError) {
      console.warn("MusicBrainz query failed, trying Last.fm fallback:", mbError);
      try {
        const lastFmResults = await this.searchLastFm(cleanQuery, limit);
        // Cache the fallback results temporarily (e.g. 5 minutes) instead of standard TTL
        await CacheService.set(cacheKey, lastFmResults, 5 * 60);
        return lastFmResults;
      } catch (lfError) {
        console.warn("Last.fm query failed, trying Discogs fallback:", lfError);
        try {
          const discogsResults = await this.searchDiscogs(cleanQuery, limit);
          // Cache the fallback results temporarily (e.g. 5 minutes) instead of standard TTL
          await CacheService.set(cacheKey, discogsResults, 5 * 60);
          return discogsResults;
        } catch (dcError) {
          console.error("All search sources (MusicBrainz, Last.fm, Discogs) failed!");
          throw new Error("All search sources are currently offline. Please check your network and try again.");
        }
      }
    }

    const artists: ArtistSearchResult[] = [];
    const albums: AlbumSearchResult[] = [];
    const tracks: TrackSearchResult[] = [];

    // 2. Parse and Enrich Artists
    const rawArtists = artistsData.artists || [];
    for (const a of rawArtists.slice(0, limit)) {
      const image = await ImageService.getArtistImage(a.name, a.id);
      const genres = a.tags ? a.tags.slice(0, 3).map((t: any) => t.name) : [];
      artists.push({
        id: a.id,
        name: a.name,
        image,
        genres,
      });
    }

    // 3. Parse and Enrich Albums (Release Groups)
    const rawAlbums = albumsData["release-groups"] || [];
    for (const al of rawAlbums.slice(0, limit)) {
      const cover = await ImageService.getAlbumCover(al.id);
      const year = al["first-release-date"]
        ? new Date(al["first-release-date"]).getFullYear()
        : "Unknown";

      albums.push({
        id: al.id,
        title: al.title,
        cover,
        artist: al["artist-credit"]?.[0]?.name || "Unknown Artist",
        year,
      });
    }

    // 4. Parse and Enrich Tracks (Recordings)
    const rawTracks = tracksData.recordings || [];
    for (const t of rawTracks.slice(0, limit)) {
      let cover = "/images/default-album.png";
      const releases = t.releases;
      if (Array.isArray(releases) && releases.length > 0) {
        const releaseGroupId = releases[0]["release-group"]?.id;
        if (releaseGroupId) {
          cover = await ImageService.getAlbumCover(releaseGroupId);
        }
      }

      const durationMs = t.length || 0;
      const mins = Math.floor(durationMs / 60000);
      const secs = Math.floor((durationMs % 60000) / 1000);
      const durationStr = `${mins}:${secs < 10 ? "0" : ""}${secs}`;

      tracks.push({
        id: t.id,
        title: t.title,
        artist: t["artist-credit"]?.[0]?.name || "Unknown Artist",
        duration: durationStr,
        cover,
      });
    }

    const results: UnifiedSearchResults = {
      artists,
      albums,
      tracks,
    };

    await CacheService.set(cacheKey, results, SEARCH_CACHE_TTL);
    return results;
  }
}
