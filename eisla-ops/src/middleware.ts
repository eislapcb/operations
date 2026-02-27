import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

const PUBLIC_PATHS = ["/login", "/setup"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public paths
  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
    const { supabaseResponse } = await updateSession(request);
    return supabaseResponse;
  }

  // Allow API auth routes
  if (pathname.startsWith("/api/auth")) {
    const { supabaseResponse } = await updateSession(request);
    return supabaseResponse;
  }

  // Allow Stripe webhooks (no auth needed)
  if (pathname.startsWith("/api/webhooks")) {
    return NextResponse.next();
  }

  // Refresh session cookie
  const { supabaseResponse, user } = await updateSession(request);

  // Not authenticated → redirect to login
  if (!user) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // Role-based route protection is handled at the page/layout level
  // since we need DB access for the user's role which middleware can't
  // reliably do. The layouts will check roles and redirect accordingly.

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
