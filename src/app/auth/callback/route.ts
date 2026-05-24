import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);

  // Use a stable base URL — the request origin can differ when Supabase redirects
  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : origin);

  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type");
  const next = searchParams.get("next") ?? "/dashboard";

  const supabase = createClient();

  // PKCE flow — triggered by magic links and OAuth
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${baseUrl}${next}`);
    }
  }

  // Token hash flow — triggered by email confirmation links
  if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type: type as any });
    if (!error) {
      return NextResponse.redirect(`${baseUrl}${next}`);
    }
  }

  // Fallback: something went wrong
  return NextResponse.redirect(`${baseUrl}/login?error=auth_callback_failed`);
}
