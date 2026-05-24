import { NextResponse } from "next/server";
import { SearchService } from "@/services/SearchService";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q") || "";
  const type = searchParams.get("type") || undefined;
  const genre = searchParams.get("genre") || undefined;
  const limitParam = searchParams.get("limit");
  const limit = limitParam ? parseInt(limitParam, 10) : undefined;

  if (!query) {
    return NextResponse.json({ artists: [], albums: [], tracks: [], playlists: [] });
  }

  try {
    const results = await SearchService.search(query, { type, genre, limit });
    return NextResponse.json(results);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "An error occurred during search" },
      { status: 500 }
    );
  }
}
