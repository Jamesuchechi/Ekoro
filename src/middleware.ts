import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

// Simple in-memory rate limiter cache (stores count and reset time per IP)
const rateLimitCache = new Map<string, { count: number; resetTime: number }>();

const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute window
const MAX_REQUESTS_PER_WINDOW = 120; // Allow 120 requests per minute

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const limitInfo = rateLimitCache.get(ip);

  if (!limitInfo) {
    rateLimitCache.set(ip, {
      count: 1,
      resetTime: now + RATE_LIMIT_WINDOW_MS,
    });
    return false;
  }

  // If window expired, reset
  if (now > limitInfo.resetTime) {
    rateLimitCache.set(ip, {
      count: 1,
      resetTime: now + RATE_LIMIT_WINDOW_MS,
    });
    return false;
  }

  // Increment count
  limitInfo.count += 1;
  rateLimitCache.set(ip, limitInfo);

  return limitInfo.count > MAX_REQUESTS_PER_WINDOW;
}

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // 1. Rate Limiting for API routes
  if (pathname.startsWith("/api")) {
    const ip = request.ip || request.headers.get("x-forwarded-for")?.split(",")[0] || "127.0.0.1";
    
    if (checkRateLimit(ip)) {
      return new NextResponse(
        JSON.stringify({
          success: false,
          error: {
            code: "RATE_LIMIT_EXCEEDED",
            message: "Too many requests. Please try again later.",
          },
        }),
        {
          status: 429,
          headers: { "Content-Type": "application/json" },
        }
      );
    }
  }

  // 2. Sync Supabase session
  return await updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public assets
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
