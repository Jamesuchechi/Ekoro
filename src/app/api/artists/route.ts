import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  try {
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
      },
      take: 6,
    });

    return NextResponse.json({ success: true, data: artists });
  } catch (error) {
    console.error("Failed to fetch featured artists:", error);
    return NextResponse.json(
      { success: false, error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
