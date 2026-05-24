import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionProfile } from "@/lib/auth-helpers";

/**
 * GET /api/tracks/[id]/comments
 * Fetch all comments for a track.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
    let track = null;

    if (isUuid) {
      track = await prisma.track.findUnique({ where: { id } });
    }

    if (!track) {
      track = await prisma.track.findUnique({ where: { slug: id } });
    }

    if (!track) {
      return NextResponse.json({ error: "Track not found" }, { status: 404 });
    }

    const comments = await prisma.comment.findMany({
      where: { trackId: track.id },
      orderBy: { createdAt: "desc" },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true,
          },
        },
      },
    });

    return NextResponse.json({ success: true, comments });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch comments" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/tracks/[id]/comments
 * Add a new comment to a track.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const profile = await getSessionProfile();
    if (!profile) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
    let track = null;

    if (isUuid) {
      track = await prisma.track.findUnique({ where: { id } });
    }

    if (!track) {
      track = await prisma.track.findUnique({ where: { slug: id } });
    }

    if (!track) {
      return NextResponse.json({ error: "Track not found" }, { status: 404 });
    }

    const body = await request.json();
    const { text, timestampMs } = body;

    if (!text || !text.trim()) {
      return NextResponse.json({ error: "Comment text is required" }, { status: 400 });
    }

    const newComment = await prisma.comment.create({
      data: {
        userId: profile.id,
        trackId: track.id,
        body: text.trim(),
        timestampMs: timestampMs || null,
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true,
          },
        },
      },
    });

    return NextResponse.json({ success: true, comment: newComment });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to post comment" },
      { status: 500 }
    );
  }
}
