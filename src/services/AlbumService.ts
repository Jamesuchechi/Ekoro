import { prisma } from "@/lib/prisma";
import { AlbumType } from "@prisma/client";

export class AlbumService {
  /**
   * Create an album (artist only).
   */
  public static async createAlbum(data: {
    artistId: string;
    title: string;
    description?: string;
    genre?: string;
    coverArtUrl?: string;
    releaseDate?: Date;
    albumType?: AlbumType;
  }) {
    const baseSlug = data.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    let slug = baseSlug;
    let exists = await prisma.album.findUnique({ where: { slug } });
    let counter = 1;
    while (exists) {
      slug = `${baseSlug}-${counter}`;
      exists = await prisma.album.findUnique({ where: { slug } });
      counter++;
    }

    return await prisma.album.create({
      data: {
        artistId: data.artistId,
        title: data.title,
        slug,
        description: data.description,
        genre: data.genre,
        coverArtUrl: data.coverArtUrl,
        releaseDate: data.releaseDate || new Date(),
        albumType: data.albumType || AlbumType.album,
      },
    });
  }

  /**
   * Fetch album details and track list.
   */
  public static async getAlbumDetails(albumId: string) {
    return await prisma.album.findUnique({
      where: { id: albumId },
      include: {
        artist: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true,
            bio: true,
          },
        },
        albumTracks: {
          orderBy: { trackOrder: "asc" },
          include: {
            track: {
              include: {
                artist: {
                  select: {
                    id: true,
                    username: true,
                    displayName: true,
                    avatarUrl: true,
                  },
                },
              },
            },
          },
        },
      },
    });
  }

  /**
   * Fetch album details by slug.
   */
  public static async getAlbumBySlug(slug: string) {
    return await prisma.album.findUnique({
      where: { slug },
      include: {
        artist: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true,
            bio: true,
          },
        },
        albumTracks: {
          orderBy: { trackOrder: "asc" },
          include: {
            track: {
              include: {
                artist: {
                  select: {
                    id: true,
                    username: true,
                    displayName: true,
                    avatarUrl: true,
                  },
                },
              },
            },
          },
        },
      },
    });
  }

  /**
   * Update album metadata (artist only).
   */
  public static async updateAlbum(
    albumId: string,
    artistId: string,
    data: {
      title?: string;
      description?: string;
      genre?: string;
      coverArtUrl?: string;
      releaseDate?: Date;
      albumType?: AlbumType;
    }
  ) {
    // Check ownership
    const album = await prisma.album.findUnique({ where: { id: albumId } });
    if (!album || album.artistId !== artistId) {
      throw new Error("UNAUTHORIZED");
    }

    const updateData: any = { ...data };
    if (data.title && data.title !== album.title) {
      const baseSlug = data.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
      let slug = baseSlug;
      let exists = await prisma.album.findUnique({ where: { slug } });
      let counter = 1;
      while (exists) {
        slug = `${baseSlug}-${counter}`;
        exists = await prisma.album.findUnique({ where: { slug } });
        counter++;
      }
      updateData.slug = slug;
    }

    return await prisma.album.update({
      where: { id: albumId },
      data: updateData,
    });
  }

  /**
   * Add a track to an album.
   */
  public static async addTrackToAlbum(albumId: string, artistId: string, trackId: string) {
    // Check ownership of album
    const album = await prisma.album.findUnique({ where: { id: albumId } });
    if (!album || album.artistId !== artistId) {
      throw new Error("UNAUTHORIZED");
    }

    // Check ownership of track
    const track = await prisma.track.findUnique({ where: { id: trackId } });
    if (!track || track.artistId !== artistId) {
      throw new Error("UNAUTHORIZED");
    }

    // Get current maximum order
    const maxTrack = await prisma.albumTrack.findFirst({
      where: { albumId },
      orderBy: { trackOrder: "desc" },
    });
    const order = maxTrack ? maxTrack.trackOrder + 1 : 1;

    return await prisma.albumTrack.create({
      data: {
        albumId,
        trackId,
        trackOrder: order,
      },
    });
  }

  /**
   * Remove a track from an album.
   */
  public static async removeTrackFromAlbum(albumId: string, artistId: string, trackId: string) {
    // Check ownership of album
    const album = await prisma.album.findUnique({ where: { id: albumId } });
    if (!album || album.artistId !== artistId) {
      throw new Error("UNAUTHORIZED");
    }

    await prisma.albumTrack.delete({
      where: {
        albumId_trackId: { albumId, trackId },
      },
    });

    // Reorder remaining tracks
    const tracks = await prisma.albumTrack.findMany({
      where: { albumId },
      orderBy: { trackOrder: "asc" },
    });

    for (let i = 0; i < tracks.length; i++) {
      await prisma.albumTrack.update({
        where: {
          albumId_trackId: { albumId, trackId: tracks[i].trackId },
        },
        data: {
          trackOrder: i + 1,
        },
      });
    }

    return true;
  }
}
