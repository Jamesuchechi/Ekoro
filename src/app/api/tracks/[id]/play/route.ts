import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionProfile } from "@/lib/auth-helpers";
import crypto from "crypto";

/**
 * POST /api/tracks/[id]/play
 * Records a playback event and increments the track play count.
 * Typically invoked by the client player after 30 seconds of continuous playback.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    // 1. Verify track exists
    const track = await prisma.track.findUnique({
      where: { id },
    });

    if (!track) {
      return NextResponse.json({ error: "Track not found" }, { status: 404 });
    }

    // 2. Fetch authenticated user (optional, anonymous plays allowed)
    const profile = await getSessionProfile();

    // 3. Extract and hash IP address to prevent spam/abuse while maintaining privacy
    const ip = request.headers.get("x-forwarded-for") || "127.0.0.1";
    const ipHash = crypto.createHash("sha256").update(ip).digest("hex");

    // Parse body parameters
    let durationPlayedMs = 30000; // Default to 30 seconds
    try {
      const body = await request.json();
      if (body.durationPlayedMs) {
        durationPlayedMs = parseInt(body.durationPlayedMs, 10);
      }
    } catch {
      // Body empty or invalid JSON, ignore and use default
    }

    // 4. Record play event and update track count within a transaction
    await prisma.$transaction([
      prisma.playEvent.create({
        data: {
          trackId: id,
          userId: profile?.id || null,
          ipHash,
          durationPlayedMs,
          completed: true,
        },
      }),
      prisma.track.update({
        where: { id },
        data: {
          playCount: {
            increment: 1,
          },
        },
      }),
    ]);

    return NextResponse.json({
      success: true,
      message: "Play event recorded successfully",
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to record play event" },
      { status: 500 }
    );
  }
}
