import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionProfile } from "@/lib/auth-helpers";

/**
 * GET /api/tracks/[id]
 * Query single track details.
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
      track = await prisma.track.findUnique({
        where: { id },
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
      });
    }

    if (!track) {
      track = await prisma.track.findUnique({
        where: { slug: id },
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
      });
    }

    if (!track) {
      return NextResponse.json({ error: "Track not found" }, { status: 404 });
    }

    // Format BigInt values for JSON response
    const formattedTrack = {
      ...track,
      playCount: track.playCount.toString(),
      downloadCount: track.downloadCount.toString(),
    };

    return NextResponse.json(formattedTrack);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to fetch track" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/tracks/[id]
 * Update track metadata (artist only, own tracks).
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    // 1. Authenticate user
    const profile = await getSessionProfile();
    if (!profile) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    // 2. Fetch track
    const track = await prisma.track.findUnique({
      where: { id },
    });

    if (!track) {
      return NextResponse.json({ error: "Track not found" }, { status: 404 });
    }

    // 3. Authorize: Only the owning artist or an admin can update
    if (track.artistId !== profile.id && profile.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized to update this track" }, { status: 403 });
    }

    // 4. Parse fields to update
    const body = await request.json();
    const {
      title,
      description,
      genre,
      mood,
      bpm,
      isDownloadable,
      downloadType,
      downloadPrice,
    } = body;

    const updateData: any = {};
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (genre !== undefined) updateData.genre = genre;
    if (mood !== undefined) updateData.mood = mood;
    if (bpm !== undefined) updateData.bpm = bpm ? parseInt(bpm, 10) : null;
    if (isDownloadable !== undefined) updateData.isDownloadable = isDownloadable;
    if (downloadType !== undefined) updateData.downloadType = downloadType;
    if (downloadPrice !== undefined) updateData.downloadPrice = downloadPrice ? parseFloat(downloadPrice) : null;

    // 5. Update DB record
    const updatedTrack = await prisma.track.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({
      ...updatedTrack,
      playCount: updatedTrack.playCount.toString(),
      downloadCount: updatedTrack.downloadCount.toString(),
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to update track" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/tracks/[id]
 * Soft delete (artist or admin).
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    // 1. Authenticate user
    const profile = await getSessionProfile();
    if (!profile) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    // 2. Fetch track
    const track = await prisma.track.findUnique({
      where: { id },
    });

    if (!track) {
      return NextResponse.json({ error: "Track not found" }, { status: 404 });
    }

    // 3. Authorize: Only owning artist or admin
    if (track.artistId !== profile.id && profile.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized to delete this track" }, { status: 403 });
    }

    // 4. Soft delete: set status to 'removed'
    const deletedTrack = await prisma.track.update({
      where: { id },
      data: { status: "removed" },
    });

    return NextResponse.json({
      message: "Track soft-deleted successfully",
      trackId: deletedTrack.id,
      status: deletedTrack.status,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to delete track" },
      { status: 500 }
    );
  }
}
