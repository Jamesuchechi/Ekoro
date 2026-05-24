import { NextRequest, NextResponse } from "next/server";
import { ArtistService } from "@/services/ArtistService";

export const dynamic = "force-dynamic";


export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "10", 10);

    const result = await ArtistService.getArtistTracks(params.id, page, limit);

    return NextResponse.json({ success: true, data: result });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to load tracks" },
      { status: 500 }
    );
  }
}
