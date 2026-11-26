import { NextRequest, NextResponse } from "next/server";
import { registrationController } from "@/server/controllers/registration.controller";
import { deskEventGuard, guardStatus } from "@/server/auth/request";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const eventIdParam = searchParams.get("eventId");
  const batchParam = searchParams.get("graduatingYear");

  const denied = await deskEventGuard(
    req,
    eventIdParam && eventIdParam !== "all" ? Number(eventIdParam) : undefined,
    true
  );
  if (denied) {
    return NextResponse.json({ success: false, error: denied }, { status: guardStatus(denied) });
  }

  const result = await registrationController.handleListRegistrations({
    eventId:
      eventIdParam && eventIdParam !== "all"
        ? Number(eventIdParam) || undefined
        : undefined,
    graduatingYear:
      batchParam && batchParam !== "All"
        ? Number(batchParam) || undefined
        : undefined,
    stream: searchParams.get("stream") || undefined,
    registrationSource: searchParams.get("registrationSource") || undefined,
    paymentMode: searchParams.get("paymentMode") || undefined,
    search: searchParams.get("search") || undefined,
  });

  if (!result.success) {
    return NextResponse.json(result, { status: 400 });
  }
  return NextResponse.json(result);
}
