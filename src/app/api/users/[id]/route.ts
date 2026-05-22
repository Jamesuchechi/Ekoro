import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withApiRoute, ApiError } from "@/lib/api-helpers";

export const GET = withApiRoute(
  async (request: Request, { params }: { params: { id: string } }) => {
    const { id } = params;

    if (!id) {
      throw new ApiError(400, "BAD_REQUEST", "User ID is required");
    }

    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            tracks: true,
            comments: true,
            likes: true,
          },
        },
      },
    });

    if (!user) {
      throw new ApiError(404, "USER_NOT_FOUND", "User profile not found");
    }

    return NextResponse.json({
      success: true,
      data: user,
    });
  }
);
