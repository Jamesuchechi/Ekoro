import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    { error: "Subscription endpoint is not yet implemented" },
    { status: 501 }
  );
}
