import { NextResponse } from "next/server";
import { RecommendationService } from "@/services/RecommendationService";

export async function GET() {
  try {
    const tracks = await RecommendationService.getTrendingTracks(10);
    return NextResponse.json({ tracks });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to fetch trending tracks" },
      { status: 500 }
    );
  }
}

export async function POST() {
  return NextResponse.json(
    { error: "Track creation is currently disabled" },
    { status: 405 }
  );
}
