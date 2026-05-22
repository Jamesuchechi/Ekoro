import { NextResponse } from "next/server";
import { ArtistService } from "@/services/ArtistService";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const id = params.id;

  if (!id) {
    return NextResponse.json({ error: "Artist ID is required" }, { status: 400 });
  }

  try {
    const artist = await ArtistService.getArtist(id);
    if (!artist) {
      return NextResponse.json({ error: "Artist not found" }, { status: 404 });
    }
    return NextResponse.json(artist);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to fetch artist details" },
      { status: 500 }
    );
  }
}
