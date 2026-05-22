import { NextResponse } from "next/server";
import { AlbumService } from "@/services/AlbumService";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const id = params.id;

  if (!id) {
    return NextResponse.json({ error: "Album ID is required" }, { status: 400 });
  }

  try {
    const album = await AlbumService.getAlbum(id);
    if (!album) {
      return NextResponse.json({ error: "Album not found" }, { status: 404 });
    }
    return NextResponse.json(album);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to fetch album details" },
      { status: 500 }
    );
  }
}
