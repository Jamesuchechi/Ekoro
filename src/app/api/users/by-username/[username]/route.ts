import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/users/by-username/[username]
 * Retrieves a public user or artist profile by username.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { username: string } }
) {
  try {
    const { username } = params;

    if (!username) {
      return NextResponse.json({ error: "Username is required" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { username: username.toLowerCase() },
      include: {
        _count: {
          select: {
            tracks: true,
            playlists: true,
            likes: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User profile not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: user,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to query user profile" },
      { status: 500 }
    );
  }
}
