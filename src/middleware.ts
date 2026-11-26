import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE, verifySession } from "@/server/auth/session";

/**
 * Route protection.
 * - admin (organizer): everything below
 * - desk (volunteer PIN): the desk, the check-in flow and the read-only lists
 *   it needs. API routes additionally check that the desk session belongs to
 *   the published event (src/server/auth/request.ts).
 * - everyone else: only the public event page (/) and sign-in
 */
const DESK_PAGES = [/^\/checkin(\/|$)/, /^\/register(\/|$)/];

const DESK_API = [
  { method: "GET", re: /^\/api\/admin\/registrations$/ },
  { method: "GET", re: /^\/api\/admin\/events\/\d+\/pre-registrations$/ },
  { method: "POST", re: /^\/api\/venue\/lookup$/ },
  { method: "GET", re: /^\/api\/venue\/fee$/ },
  { method: "GET", re: /^\/api\/venue\/members$/ },
  { method: "POST", re: /^\/api\/register$/ },
];

function isDeskAllowed(req: NextRequest): boolean {
  const { pathname } = req.nextUrl;
  if (DESK_PAGES.some((re) => re.test(pathname))) return true;
  return DESK_API.some((r) => r.method === req.method && r.re.test(pathname));
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (pathname === "/admin/login") return NextResponse.next();

  let session = null;
  try {
    session = await verifySession(req.cookies.get(SESSION_COOKIE)?.value);
  } catch (err) {
    console.error("Session verification failed:", err);
  }

  const allowed =
    session?.role === "admin" || (session?.role === "desk" && isDeskAllowed(req));

  if (allowed) return NextResponse.next();

  if (pathname.startsWith("/api/")) {
    return NextResponse.json(
      {
        success: false,
        error: session ? "You do not have access to this action." : "Please sign in.",
      },
      { status: session ? 403 : 401 }
    );
  }

  const loginUrl = req.nextUrl.clone();
  loginUrl.pathname = "/admin/login";
  loginUrl.search = `?next=${encodeURIComponent(pathname + req.nextUrl.search)}`;
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/api/admin/:path*",
    "/checkin/:path*",
    "/checkin",
    "/register/:path*",
    "/register",
    "/api/venue/:path*",
    "/api/register",
  ],
};
