import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    tracks: [],
    message: "Tracks list endpoint (Mock)",
  });
}

export async function POST() {
  return NextResponse.json(
    { error: "Track creation is currently disabled" },
    { status: 405 }
  );
}
