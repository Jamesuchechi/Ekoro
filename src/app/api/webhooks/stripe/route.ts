import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json({
    message: "Stripe webhook received successfully (Mock)",
    received: true,
  });
}
