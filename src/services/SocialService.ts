import { prisma } from "@/lib/prisma";

export class SocialService {
  /**
   * Query paginated list of user followers.
   */
  public static async getUserFollowers(userId: string, page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;
    const [follows, total] = await Promise.all([
      prisma.follow.findMany({
        where: { followingId: userId },
        skip,
        take: limit,
        include: {
          follower: {
            select: {
              id: true,
              username: true,
              displayName: true,
              avatarUrl: true,
              isVerified: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.follow.count({
        where: { followingId: userId },
      }),
    ]);

    return {
      followers: follows.map((f) => f.follower),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Query paginated list of users followed by a user.
   */
  public static async getUserFollowing(userId: string, page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;
    const [follows, total] = await Promise.all([
      prisma.follow.findMany({
        where: { followerId: userId },
        skip,
        take: limit,
        include: {
          following: {
            select: {
              id: true,
              username: true,
              displayName: true,
              avatarUrl: true,
              isVerified: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.follow.count({
        where: { followerId: userId },
      }),
    ]);

    return {
      following: follows.map((f) => f.following),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Query user social feed (tracks published by followed artists, sorted by recency).
   */
  public static async getSocialFeed(userId: string, page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;

    // 1. Get list of user IDs followed by this user
    const followed = await prisma.follow.findMany({
      where: { followerId: userId },
      select: { followingId: true },
    });

    const followedIds = followed.map((f) => f.followingId);

    if (followedIds.length === 0) {
      return {
        tracks: [],
        total: 0,
        page,
        limit,
        totalPages: 0,
      };
    }

    // 2. Fetch tracks published by followed artists, sorted by recency
    const [tracks, total] = await Promise.all([
      prisma.track.findMany({
        where: {
          artistId: { in: followedIds },
          status: "published",
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
        include: {
          artist: {
            select: {
              id: true,
              username: true,
              displayName: true,
              avatarUrl: true,
              isVerified: true,
            },
          },
        },
      }),
      prisma.track.count({
        where: {
          artistId: { in: followedIds },
          status: "published",
        },
      }),
    ]);

    return {
      tracks,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Query suggested artists for a user.
   * If authenticated: suggest artists the user is not following yet, ordered by follower count.
   * If anonymous: suggest top artists ordered by follower count.
   */
  public static async getSuggestedArtists(userId?: string, limit: number = 5) {
    let excludeIds: string[] = [];
    if (userId) {
      excludeIds.push(userId);
      const followed = await prisma.follow.findMany({
        where: { followerId: userId },
        select: { followingId: true },
      });
      excludeIds.push(...followed.map((f) => f.followingId));
    }

    return await prisma.user.findMany({
      where: {
        role: "artist",
        id: { notIn: excludeIds.length > 0 ? excludeIds : undefined },
      },
      select: {
        id: true,
        username: true,
        displayName: true,
        avatarUrl: true,
        bio: true,
        isVerified: true,
        _count: {
          select: { followers: true },
        },
      },
      orderBy: {
        followers: {
          _count: "desc",
        },
      },
      take: limit,
    });
  }
}
