import { NextRequest, NextResponse } from "next/server";
import { deskEventGuard, guardStatus } from "@/server/auth/request";
import { clientIp, rateLimit } from "@/server/auth/rateLimit";
import { registrationController } from "@/server/controllers/registration.controller";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const denied = await deskEventGuard(req);
  if (denied) {
    return NextResponse.json({ success: false, error: denied }, { status: guardStatus(denied) });
  }

  const limited = rateLimit(`register:${clientIp(req.headers)}`, 20, 60 * 1000);
  if (!limited.allowed) {
    return NextResponse.json(
      { success: false, error: "Too many requests. Please wait a minute and try again." },
      { status: 429 }
    );
  }

  try {
    const body = await req.json();
    const result = await registrationController.handleSubmitRegistration(body);
    if (!result.success) {
      return NextResponse.json(result, { status: 400 });
    }
    return NextResponse.json(result, { status: 201 });
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Failed to submit registration";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
