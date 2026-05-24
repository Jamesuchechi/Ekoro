import { NextRequest, NextResponse } from "next/server";
import { getSessionProfile } from "@/lib/auth-helpers";
import { SocialService } from "@/services/SocialService";

export const dynamic = "force-dynamic";


export async function GET(request: NextRequest) {
  try {
    const currentUser = await getSessionProfile();
    if (!currentUser) {
      return NextResponse.json(
        { success: false, error: "Not authenticated" },
        { status: 401 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "10", 10);

    const result = await SocialService.getSocialFeed(currentUser.id, page, limit);

    return NextResponse.json({ success: true, data: result });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to load feed" },
      { status: 500 }
    );
  }
}
