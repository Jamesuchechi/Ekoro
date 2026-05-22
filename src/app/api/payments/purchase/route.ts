import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    { error: "Purchase endpoint is not yet implemented" },
    { status: 501 }
  );
}
