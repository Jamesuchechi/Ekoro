import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  return NextResponse.json(
    {
      error: "Track download link not configured",
      trackId: params.id,
    },
    { status: 400 }
  );
}
