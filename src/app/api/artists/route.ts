import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { SocialService } from "@/services/SocialService";
import { getSessionProfile } from "@/lib/auth-helpers";

// Always render on-demand — reads query params and session
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const isSuggested = searchParams.get("suggested") === "true";
    const limit = parseInt(searchParams.get("limit") || "6", 10);

    if (isSuggested) {
      const currentUser = await getSessionProfile();
      const suggested = await SocialService.getSuggestedArtists(currentUser?.id, limit);
      return NextResponse.json({ success: true, data: suggested });
    }

    const artists = await prisma.user.findMany({
      where: {
        role: "artist",
      },
      select: {
        id: true,
        displayName: true,
        username: true,
        avatarUrl: true,
        bio: true,
        isVerified: true,
        _count: {
          select: { followers: true },
        },
      },
      take: limit,
    });

    return NextResponse.json({ success: true, data: artists });
  } catch (error) {
    console.error("Failed to fetch artists:", error);
    return NextResponse.json(
      { success: false, error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
