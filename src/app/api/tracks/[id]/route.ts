import { NextResponse } from "next/server";
import { TrackService } from "@/services/TrackService";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const id = params.id;

  if (!id) {
    return NextResponse.json({ error: "Track ID is required" }, { status: 400 });
  }

  try {
    const track = await TrackService.getTrack(id);
    if (!track) {
      return NextResponse.json({ error: "Track not found" }, { status: 404 });
    }
    return NextResponse.json(track);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to fetch track details" },
      { status: 500 }
    );
  }
}
