import { NextRequest, NextResponse } from "next/server";
import { eventRepository } from "@/server/repositories/event.repository";
import { registrationRepository } from "@/server/repositories/registration.repository";
import { preRegistrationRepository } from "@/server/repositories/preRegistration.repository";
import { toCsv } from "@/server/utils/csvExport";
import { EventPreRegistration, EventRegistration } from "@/types/database.types";

export const dynamic = "force-dynamic";

const REGISTRATION_COLUMNS = [
  { header: "Pass No", value: (r: EventRegistration) => `IRTTAA-${String(r.registration_id).padStart(4, "0")}` },
  { header: "Name", value: (r: EventRegistration) => r.full_name },
  { header: "Email", value: (r: EventRegistration) => r.email },
  { header: "Mobile", value: (r: EventRegistration) => r.mobile },
  { header: "Course", value: (r: EventRegistration) => r.course },
  { header: "Stream", value: (r: EventRegistration) => r.stream },
  { header: "Batch", value: (r: EventRegistration) => r.graduating_year },
  { header: "Membership", value: (r: EventRegistration) => r.membership_type_used },
  { header: "Member Login Id", value: (r: EventRegistration) => r.member_login_id },
  { header: "Source", value: (r: EventRegistration) => r.registration_source },
  { header: "Recognized Member", value: (r: EventRegistration) => (r.recognized_member ? "Yes" : "No") },
  { header: "Food Preference", value: (r: EventRegistration) => r.food_preference },
  { header: "Accompanying Alumni", value: (r: EventRegistration) => r.accompanying_alumni_count },
  { header: "Accompanying Family", value: (r: EventRegistration) => r.accompanying_family_count },
  { header: "Registration Fee", value: (r: EventRegistration) => r.registration_fee },
  { header: "Voluntary Contribution", value: (r: EventRegistration) => r.voluntary_contribution },
  { header: "Total Amount", value: (r: EventRegistration) => r.total_amount },
  { header: "Payment Mode", value: (r: EventRegistration) => r.payment_mode },
  { header: "Payment Confirmed", value: (r: EventRegistration) => (r.payment_confirmed ? "Yes" : "No") },
  { header: "UTR Last 4", value: (r: EventRegistration) => r.utr_last4 },
  { header: "Checked In At", value: (r: EventRegistration) => r.checked_in_at },
];

const PRE_REGISTRATION_COLUMNS = [
  { header: "Name", value: (r: EventPreRegistration) => r.full_name },
  { header: "Email", value: (r: EventPreRegistration) => r.email },
  { header: "Mobile", value: (r: EventPreRegistration) => r.mobile },
  { header: "Course", value: (r: EventPreRegistration) => r.course },
  { header: "Stream", value: (r: EventPreRegistration) => r.stream },
  { header: "Batch", value: (r: EventPreRegistration) => r.graduating_year },
  { header: "Membership", value: (r: EventPreRegistration) => r.membership_type },
  { header: "Member Login Id", value: (r: EventPreRegistration) => r.member_login_id },
  { header: "Response", value: (r: EventPreRegistration) => r.response_status },
  { header: "Food Preference", value: (r: EventPreRegistration) => r.food_preference },
  { header: "Accompanying Alumni", value: (r: EventPreRegistration) => r.accompanying_alumni_count },
  { header: "Accompanying Family", value: (r: EventPreRegistration) => r.accompanying_family_count },
];

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ eventId: string }> }
) {
  const { eventId } = await context.params;
  const numericId = Number(eventId);
  if (!numericId || isNaN(numericId)) {
    return NextResponse.json({ success: false, error: "Invalid event ID" }, { status: 400 });
  }

  const type = new URL(req.url).searchParams.get("type") || "registrations";

  try {
    const event = await eventRepository.getEventById(numericId);
    if (!event) {
      return NextResponse.json({ success: false, error: "Event not found" }, { status: 404 });
    }

    let csv: string;
    if (type === "pre-registrations") {
      const rows = await preRegistrationRepository.getAllByEvent(numericId);
      csv = toCsv(PRE_REGISTRATION_COLUMNS, rows);
    } else {
      const rows = await registrationRepository.listRegistrations({ eventId: numericId });
      csv = toCsv(REGISTRATION_COLUMNS, rows);
    }

    const slug = event.event_name.replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "").toLowerCase();
    const filename = `${slug || "event"}-${type}-${new Date().toISOString().slice(0, 10)}.csv`;

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Export failed";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
