import { NextRequest, NextResponse } from "next/server";
import { deskEventGuard, guardStatus } from "@/server/auth/request";
import { eventController } from "@/server/controllers/event.controller";
import { RegistrationMembershipType } from "@/server/constants";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const denied = await deskEventGuard(req);
  if (denied) {
    return NextResponse.json({ success: false, error: denied }, { status: guardStatus(denied) });
  }

  const { searchParams } = new URL(req.url);
  const eventId = Number(searchParams.get("eventId"));
  const graduatingYear = Number(searchParams.get("graduatingYear"));
  const membershipType =
    (searchParams.get("membershipType") as RegistrationMembershipType) ||
    "UNREGISTERED_MEMBER";

  if (!eventId || isNaN(eventId) || !graduatingYear || isNaN(graduatingYear)) {
    return NextResponse.json(
      { success: false, error: "Valid eventId and graduatingYear are required" },
      { status: 400 }
    );
  }

  const result = await eventController.handleCalculateFee({
    eventId,
    graduatingYear,
    membershipType,
  });
  if (!result.success) {
    return NextResponse.json(result, { status: 400 });
  }
  return NextResponse.json(result);
}
