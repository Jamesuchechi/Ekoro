import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    { error: "Tipping endpoint is not yet implemented" },
    { status: 501 }
  );
}
