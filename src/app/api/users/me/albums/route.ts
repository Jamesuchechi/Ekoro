import { NextResponse } from "next/server";
import { getSessionProfile } from "@/lib/auth-helpers";
import { ArtistService } from "@/services/ArtistService";

export const dynamic = "force-dynamic";

export async function GET() {
  const profile = await getSessionProfile();
  if (!profile) {
    return NextResponse.json({ success: false, error: "UNAUTHORIZED" }, { status: 401 });
  }

  try {
    const albums = await ArtistService.getArtistAlbums(profile.id);
    return NextResponse.json({ success: true, albums });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
