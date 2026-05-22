import { fetchCoverArtArchive, fetchLastFm } from "./apiClients";
import { CacheService } from "./CacheService";

const IMAGE_CACHE_TTL = 30 * 24 * 60 * 60; // 30 days in seconds

export class ImageService {
  /**
   * Resolve cover art for a MusicBrainz Release Group ID
   */
  public static async getAlbumCover(releaseGroupId: string): Promise<string> {
    const cacheKey = `image:album:${releaseGroupId}`;
    const cached = await CacheService.get<string>(cacheKey);
    if (cached) return cached;

    let imageUrl = "/images/default-album.png";

    try {
      const data = await fetchCoverArtArchive(releaseGroupId, true);
      if (data && data.images && data.images.length > 0) {
        // Find front image, otherwise take the first
        const frontImage = data.images.find((img: any) => img.front === true);
        imageUrl = frontImage ? frontImage.image : data.images[0].image;
      }
    } catch (error) {
      console.warn(`Cover Art Archive failed for release group ${releaseGroupId}:`, error);
    }

    await CacheService.set(cacheKey, imageUrl, IMAGE_CACHE_TTL);
    return imageUrl;
  }

  /**
   * Resolve image for an Artist using Last.fm
   */
  public static async getArtistImage(artistName: string, mbid?: string): Promise<string> {
    const cacheKey = `image:artist:${mbid || artistName}`;
    const cached = await CacheService.get<string>(cacheKey);
    if (cached) return cached;

    let imageUrl = "/images/default-artist.png";

    try {
      const params: Record<string, string> = {};
      if (mbid) params.mbid = mbid;
      else params.artist = artistName;

      const data = await fetchLastFm("artist.getinfo", params);
      if (data && data.artist && data.artist.image) {
        // Last.fm yields multiple sizes; pick the largest
        const images = data.artist.image;
        const mega = images.find((img: any) => img.size === "mega");
        const extralarge = images.find((img: any) => img.size === "extralarge");
        const large = images.find((img: any) => img.size === "large");

        imageUrl = mega?.["#text"] || extralarge?.["#text"] || large?.["#text"] || imageUrl;
      }
    } catch (error) {
      console.warn(`Last.fm artist image failed for ${artistName}:`, error);
    }

    await CacheService.set(cacheKey, imageUrl, IMAGE_CACHE_TTL);
    return imageUrl;
  }
}
