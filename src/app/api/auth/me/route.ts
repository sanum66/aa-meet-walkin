import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE, verifySession } from "@/server/auth/session";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const session = await verifySession(req.cookies.get(SESSION_COOKIE)?.value).catch(
    () => null
  );
  if (!session) {
    return NextResponse.json({ success: false, error: "Not signed in" }, { status: 401 });
  }
  return NextResponse.json({
    success: true,
    data: { role: session.role, email: session.role === "admin" ? session.sub : null },
  });
}
