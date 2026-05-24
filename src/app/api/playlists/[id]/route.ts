import { NextResponse } from "next/server";
import { PlaylistService } from "@/services/PlaylistService";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const id = params.id;

  if (!id) {
    return NextResponse.json({ error: "Playlist ID is required" }, { status: 400 });
  }

  try {
    const playlist = await PlaylistService.getPlaylist(id);
    if (!playlist) {
      return NextResponse.json({ error: "Playlist not found" }, { status: 404 });
    }
    return NextResponse.json(playlist);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to fetch playlist details" },
      { status: 500 }
    );
  }
}
