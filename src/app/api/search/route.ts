import { NextResponse } from "next/server";
import { SearchService } from "@/services/SearchService";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q") || "";

  if (!query) {
    return NextResponse.json({ artists: [], albums: [], tracks: [] });
  }

  try {
    const results = await SearchService.search(query);
    return NextResponse.json(results);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "An error occurred during search" },
      { status: 500 }
    );
  }
}
