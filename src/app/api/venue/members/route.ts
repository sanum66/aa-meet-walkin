import { NextRequest, NextResponse } from "next/server";
import { deskEventGuard, guardStatus } from "@/server/auth/request";
import { memberRepository } from "@/server/repositories/member.repository";

export const dynamic = "force-dynamic";

/**
 * Desk search of the association members list (by name, email or mobile),
 * used to check in alumni who did not register for the event online.
 * Returns only what a volunteer needs to identify the person.
 */
export async function GET(req: NextRequest) {
  const denied = await deskEventGuard(req);
  if (denied) {
    return NextResponse.json({ success: false, error: denied }, { status: guardStatus(denied) });
  }

  const search = (new URL(req.url).searchParams.get("search") || "").trim();
  if (search.length < 2) {
    return NextResponse.json({ success: true, data: [] });
  }

  const members = await memberRepository.listMembers({ search, limit: 15 });
  const maskMobile = (m: string | null) => {
    const digits = (m || "").replace(/\D/g, "");
    return digits.length >= 4 ? `•••• ${digits.slice(-4)}` : null;
  };

  return NextResponse.json({
    success: true,
    data: members.map((m) => ({
      member_login_id: m.member_login_id,
      full_name: m.full_name,
      email: m.email,
      mobile_hint: maskMobile(m.mobile),
      graduating_year: m.graduating_year,
      course: m.course,
      stream: m.stream,
      city: m.city,
      membership_type: m.membership_type,
    })),
  });
}
