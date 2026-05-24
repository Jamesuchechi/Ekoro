import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionProfile } from "@/lib/auth-helpers";

/**
 * GET /api/users/me
 * Retrieves the full profile of the currently authenticated user.
 */
export async function GET() {
  try {
    const profile = await getSessionProfile();
    
    if (!profile) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const userDetails = await prisma.user.findUnique({
      where: { id: profile.id },
      include: {
        _count: {
          select: {
            tracks: true,
            playlists: true,
            likes: true,
            purchases: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      data: userDetails,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to retrieve user profile" },
      { status: 500 }
    );
  }
}
