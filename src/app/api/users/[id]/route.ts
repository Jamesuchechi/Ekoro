import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withApiRoute, ApiError } from "@/lib/api-helpers";
import { getSessionUser, getSessionProfile } from "@/lib/auth-helpers";

export const dynamic = "force-dynamic";

export const GET = withApiRoute(
  async (request: Request, { params }: { params: { id: string } }) => {
    const { id } = params;

    if (!id) {
      throw new ApiError(400, "BAD_REQUEST", "User ID is required");
    }

    const fetchUser = () =>
      prisma.user.findUnique({
        where: { id },
        select: {
          id: true,
          username: true,
          displayName: true,
          avatarUrl: true,
          bio: true,
          role: true,
          plan: true,
          isVerified: true,
          createdAt: true,
          _count: {
            select: {
              tracks: true,
              followers: true,
              following: true,
            },
          },
        },
      });

    let user = await fetchUser();

    if (!user) {
      // Self-heal: if this is the session user, create their DB profile then retry
      const currentUser = await getSessionUser();
      if (currentUser && currentUser.id === id) {
        await getSessionProfile();
        user = await fetchUser();
      }
    }

    if (!user) {
      throw new ApiError(404, "USER_NOT_FOUND", "User profile not found");
    }

    return NextResponse.json({ success: true, data: user });
  }
);
