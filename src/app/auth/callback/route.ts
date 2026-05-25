import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);

  const baseUrl =
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : origin);

  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type");
  const next = searchParams.get("next") ?? "/";

  const supabase = createClient();

  // PKCE flow — OAuth and magic links
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      // Use a simple redirect to home; let the client-side auth state handle the rest
      return NextResponse.redirect(`${baseUrl}${next}`);
    }
    console.error("PKCE exchange error:", error.message);
    return NextResponse.redirect(`${baseUrl}/login?error=auth_failed&message=${encodeURIComponent(error.message)}`);
  }

  // Token hash flow — email confirmation links
  if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type: type as any,
    });
    if (!error) {
      return NextResponse.redirect(`${baseUrl}${next}`);
    }
    console.error("OTP verify error:", error.message);
    return NextResponse.redirect(`${baseUrl}/login?error=auth_failed&message=${encodeURIComponent(error.message)}`);
  }

  return NextResponse.redirect(`${baseUrl}/login?error=missing_params`);
}
