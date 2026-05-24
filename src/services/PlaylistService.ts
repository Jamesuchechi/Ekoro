import { prisma } from "@/lib/prisma";

export class PlaylistService {
  /**
   * Fetch a single playlist by ID, including its tracks (ordered by trackOrder) and owner.
   */
  static async getPlaylist(playlistId: string) {
    return prisma.playlist.findUnique({
      where: { id: playlistId },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true,
          },
        },
        playlistTracks: {
          orderBy: {
            trackOrder: "asc",
          },
          include: {
            track: {
              include: {
                artist: {
                  select: {
                    id: true,
                    username: true,
                    displayName: true,
                  },
                },
              },
            },
          },
        },
        _count: {
          select: {
            playlistTracks: true,
            follows: true,
          },
        },
      },
    });
  }

  /**
   * Fetch all playlists created by a specific user.
   */
  static async getUserPlaylists(userId: string) {
    return prisma.playlist.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      include: {
        _count: {
          select: {
            playlistTracks: true,
          },
        },
      },
    });
  }

  /**
   * Fetch all public playlists in the system (e.g. for explore/landing pages).
   */
  static async getPublicPlaylists(limit = 10) {
    return prisma.playlist.findMany({
      where: { isPublic: true },
      orderBy: { createdAt: "desc" },
      take: limit,
      include: {
        user: {
          select: {
            username: true,
            displayName: true,
          },
        },
        _count: {
          select: {
            playlistTracks: true,
          },
        },
      },
    });
  }

  /**
   * Fetch all playlists followed by a user.
   */
  static async getFollowedPlaylists(userId: string) {
    const follows = await prisma.playlistFollow.findMany({
      where: { userId },
      include: {
        playlist: {
          include: {
            user: {
              select: {
                username: true,
                displayName: true,
              },
            },
            _count: {
              select: {
                playlistTracks: true,
              },
            },
          },
        },
      },
    });

    return follows.map((f: any) => f.playlist);
  }
}
