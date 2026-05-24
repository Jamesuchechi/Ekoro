import { prisma } from "@/lib/prisma";

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

export interface PlaylistSearchResult {
  id: string;
  title: string;
  description: string | null;
  cover: string;
  creator: string;
}

export interface UnifiedSearchResults {
  artists: ArtistSearchResult[];
  albums: AlbumSearchResult[];
  tracks: TrackSearchResult[];
  playlists: PlaylistSearchResult[];
}

export class SearchService {
  /**
   * Search across Artists, Albums, Tracks, and Playlists in the database
   */
  public static async search(
    query: string,
    options?: { type?: string; genre?: string; limit?: number }
  ): Promise<UnifiedSearchResults> {
    const cleanQuery = query.trim();
    if (!cleanQuery) {
      return { artists: [], albums: [], tracks: [], playlists: [] };
    }

    const limit = options?.limit ?? 10;
    const genre = options?.genre;
    const type = options?.type;

    let tracks: any[] = [];
    let artists: any[] = [];
    let playlists: any[] = [];
    let albums: any[] = [];

    // Format duration from ms to m:ss
    const formatDuration = (durationMs: number): string => {
      const mins = Math.floor(durationMs / 60000);
      const secs = Math.floor((durationMs % 60000) / 1000);
      return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
    };

    try {
      // 1. Query Tracks
      if (!type || type === "tracks" || type === "track") {
        if (genre) {
          tracks = await prisma.$queryRaw<any[]>`
            SELECT 
              t.id, 
              t.title, 
              t.cover_art_url AS "coverArtUrl", 
              t.genre, 
              t.mood,
              t.duration_ms AS "durationMs",
              t.play_count AS "playCount",
              u.display_name AS "artistName",
              u.username AS "artistUsername",
              ts_rank(to_tsvector('english', coalesce(t.title, '') || ' ' || coalesce(t.genre, '') || ' ' || coalesce(t.mood, '')), websearch_to_tsquery('english', ${cleanQuery})) AS rank,
              similarity(t.title, ${cleanQuery}) AS similarity
            FROM public.tracks t
            JOIN public.users u ON t.artist_id = u.id
            WHERE t.status = 'published'
              AND t.genre = ${genre}
              AND (
                to_tsvector('english', coalesce(t.title, '') || ' ' || coalesce(t.genre, '') || ' ' || coalesce(t.mood, '')) @@ websearch_to_tsquery('english', ${cleanQuery})
                OR t.title % ${cleanQuery}
                OR similarity(t.title, ${cleanQuery}) > 0.25
              )
            ORDER BY rank DESC, similarity DESC, t.play_count DESC
            LIMIT ${limit}
          `;
        } else {
          tracks = await prisma.$queryRaw<any[]>`
            SELECT 
              t.id, 
              t.title, 
              t.cover_art_url AS "coverArtUrl", 
              t.genre, 
              t.mood,
              t.duration_ms AS "durationMs",
              t.play_count AS "playCount",
              u.display_name AS "artistName",
              u.username AS "artistUsername",
              ts_rank(to_tsvector('english', coalesce(t.title, '') || ' ' || coalesce(t.genre, '') || ' ' || coalesce(t.mood, '')), websearch_to_tsquery('english', ${cleanQuery})) AS rank,
              similarity(t.title, ${cleanQuery}) AS similarity
            FROM public.tracks t
            JOIN public.users u ON t.artist_id = u.id
            WHERE t.status = 'published'
              AND (
                to_tsvector('english', coalesce(t.title, '') || ' ' || coalesce(t.genre, '') || ' ' || coalesce(t.mood, '')) @@ websearch_to_tsquery('english', ${cleanQuery})
                OR t.title % ${cleanQuery}
                OR similarity(t.title, ${cleanQuery}) > 0.25
              )
            ORDER BY rank DESC, similarity DESC, t.play_count DESC
            LIMIT ${limit}
          `;
        }
      }

      // 2. Query Artists (Users with role = 'artist')
      if (!type || type === "artists" || type === "artist") {
        artists = await prisma.$queryRaw<any[]>`
          SELECT 
            u.id, 
            u.username, 
            u.display_name AS "displayName", 
            u.avatar_url AS "avatarUrl", 
            u.bio,
            ts_rank(to_tsvector('english', coalesce(u.display_name, '') || ' ' || coalesce(u.username, '') || ' ' || coalesce(u.bio, '')), websearch_to_tsquery('english', ${cleanQuery})) AS rank,
            similarity(coalesce(u.display_name, u.username), ${cleanQuery}) AS similarity
          FROM public.users u
          WHERE u.role = 'artist' AND (
            to_tsvector('english', coalesce(u.display_name, '') || ' ' || coalesce(u.username, '') || ' ' || coalesce(u.bio, '')) @@ websearch_to_tsquery('english', ${cleanQuery})
            OR u.display_name % ${cleanQuery}
            OR u.username % ${cleanQuery}
            OR similarity(coalesce(u.display_name, u.username), ${cleanQuery}) > 0.25
          )
          ORDER BY rank DESC, similarity DESC
          LIMIT ${limit}
        `;
      }

      // 3. Query Playlists
      if (!type || type === "playlists" || type === "playlist") {
        playlists = await prisma.$queryRaw<any[]>`
          SELECT 
            p.id, 
            p.title, 
            p.description, 
            p.cover_art_url AS "coverArtUrl", 
            u.display_name AS "creatorName",
            u.username AS "creatorUsername",
            ts_rank(to_tsvector('english', coalesce(p.title, '') || ' ' || coalesce(p.description, '')), websearch_to_tsquery('english', ${cleanQuery})) AS rank,
            similarity(p.title, ${cleanQuery}) AS similarity
          FROM public.playlists p
          JOIN public.users u ON p.user_id = u.id
          WHERE p.is_public = true AND (
            to_tsvector('english', coalesce(p.title, '') || ' ' || coalesce(p.description, '')) @@ websearch_to_tsquery('english', ${cleanQuery})
            OR p.title % ${cleanQuery}
            OR similarity(p.title, ${cleanQuery}) > 0.25
          )
          ORDER BY rank DESC, similarity DESC
          LIMIT ${limit}
        `;
      }

      // 4. Query Albums
      if (!type || type === "albums" || type === "album") {
        albums = await prisma.$queryRaw<any[]>`
          SELECT 
            a.id, 
            a.title, 
            a.description, 
            a.cover_art_url AS "coverArtUrl", 
            u.display_name AS "artistName",
            u.username AS "artistUsername",
            a.release_date AS "releaseDate",
            ts_rank(to_tsvector('english', coalesce(a.title, '') || ' ' || coalesce(a.description, '')), websearch_to_tsquery('english', ${cleanQuery})) AS rank,
            similarity(a.title, ${cleanQuery}) AS similarity
          FROM public.albums a
          JOIN public.users u ON a.artist_id = u.id
          WHERE (
            to_tsvector('english', coalesce(a.title, '') || ' ' || coalesce(a.description, '')) @@ websearch_to_tsquery('english', ${cleanQuery})
            OR a.title % ${cleanQuery}
            OR similarity(a.title, ${cleanQuery}) > 0.25
          )
          ORDER BY rank DESC, similarity DESC
          LIMIT ${limit}
        `;
      }
    } catch (dbError) {
      console.error("Database search query failed:", dbError);
      throw new Error("Failed to query database for search results.");
    }

    const artistsMapped: ArtistSearchResult[] = artists.map((a) => ({
      id: a.id,
      name: a.displayName || a.username,
      image: a.avatarUrl || "/images/default-artist.png",
      genres: ["Artist"],
    }));

    const albumsMapped: AlbumSearchResult[] = albums.map((al) => ({
      id: al.id,
      title: al.title,
      cover: al.coverArtUrl || "/images/default-album.png",
      artist: al.artistName || al.artistUsername || "Unknown Artist",
      year: al.releaseDate ? new Date(al.releaseDate).getFullYear() : "Recent",
    }));

    const tracksMapped: TrackSearchResult[] = tracks.map((t) => ({
      id: t.id,
      title: t.title,
      artist: t.artistName || t.artistUsername || "Unknown Artist",
      duration: formatDuration(t.durationMs),
      cover: t.coverArtUrl || "/images/default-album.png",
    }));

    const playlistsMapped: PlaylistSearchResult[] = playlists.map((p) => ({
      id: p.id,
      title: p.title,
      description: p.description,
      cover: p.coverArtUrl || "/images/default-album.png",
      creator: p.creatorName || p.creatorUsername || "Unknown",
    }));

    return {
      artists: artistsMapped,
      albums: albumsMapped,
      tracks: tracksMapped,
      playlists: playlistsMapped,
    };
  }
}
