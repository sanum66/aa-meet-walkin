import { eventRepository } from "../repositories/event.repository";
import { memberRepository } from "../repositories/member.repository";
import { preRegistrationRepository } from "../repositories/preRegistration.repository";
import {
  normalizeAssociationMembership,
  normalizeCourseEnum,
  normalizeCourseLabel,
  normalizeEmail,
  normalizeFoodPreference,
  normalizeMobile,
  normalizeResponseStatus,
  normalizeStreamEnum,
  normalizeStreamLabel,
  extractPhoneDigits,
  parseCsvRecords,
} from "../utils/csv";
import {
  AssociationMember,
  CsvImportSummary,
  EventPreRegistration,
} from "@/types/database.types";

function parseBatchYear(raw: string | undefined): number {
  const year = raw ? parseInt(raw.trim(), 10) : NaN;
  return year >= 1950 && year <= 2100 ? year : NaN;
}

/** Header sets that identify each CSV template. */
const MEMBER_HEADERS = ["Login Email Id", "Name", "Batch", "Membership Type"];
const PRE_REG_HEADERS = ["Name", "Email", "Year", "Status"];

function assertTemplate(
  records: Record<string, string>[],
  expected: string[],
  label: string
) {
  if (records.length === 0) {
    throw new Error(`No data rows found in the ${label} CSV.`);
  }
  const headers = Object.keys(records[0]);
  const missing = expected.filter((h) => !headers.includes(h));
  if (missing.length > 0) {
    throw new Error(
      `This does not look like the ${label} CSV. Missing column(s): ${missing.join(", ")}.`
    );
  }
}

export class ImportService {
  /**
   * Imports `IRTT_AA_Members.csv` into `association_members`.
   * Appends new unique records and updates existing members (e.g. membership upgrades).
   */
  async importAssociationMembersCsv(csvText: string): Promise<CsvImportSummary> {
    const rawRecords = parseCsvRecords(csvText);
    assertTemplate(rawRecords, MEMBER_HEADERS, "IRTT AA Members");
    const errors: string[] = [];
    const dedupMap = new Map<string, Partial<AssociationMember>>();
    const emailOwner = new Map<string, string>();

    const nowIso = new Date().toISOString();

    for (let idx = 0; idx < rawRecords.length; idx++) {
      const row = rawRecords[idx];
      const email = normalizeEmail(
        row["Email 1"] || row["Login Email Id"] || row["email"]
      );
      const memberLoginId = (
        row["Login Email Id"] ||
        row["member_login_id"] ||
        email
      )
        .trim()
        .toLowerCase();
      const fullName = (row["Name"] || row["full_name"] || "").trim();

      if (!memberLoginId || !email || !fullName) {
        errors.push(
          `Row ${idx + 2}: Missing required Login Email Id, Email, or Name.`
        );
        continue;
      }

      const yearRaw = row["Batch"] || row["graduating_year"];
      const parsedYear = parseBatchYear(yearRaw);

      // Ensure no duplicate email maps to two different member_login_id keys in same batch
      const prevOwner = emailOwner.get(email);
      if (prevOwner && prevOwner !== memberLoginId) {
        dedupMap.delete(prevOwner);
      }
      emailOwner.set(email, memberLoginId);

      dedupMap.set(memberLoginId, {
        member_login_id: memberLoginId,
        full_name: fullName,
        email,
        mobile: normalizeMobile(
          row["Phone 1"] || row["mobile"] || row["Phone 2"]
        ),
        course: normalizeCourseEnum(row["Course"] || row["course"]),
        stream: normalizeStreamEnum(row["Stream"] || row["stream"]),
        graduating_year: !isNaN(parsedYear) ? parsedYear : null,
        city: (row["City"] || row["city"] || "").trim() || null,
        state: (row["State"] || row["state"] || "").trim() || null,
        pincode: (row["Pin/Zip Code"] || row["pincode"] || "").trim() || null,
        membership_type: normalizeAssociationMembership(
          row["Membership Type"] || row["membership_type"]
        ),
        imported_at: nowIso,
      });
    }

    const batch = Array.from(dedupMap.values());
    let importedCount = 0;

    // Upsert in chunks of 200 to handle large CSVs safely
    const CHUNK_SIZE = 200;
    for (let i = 0; i < batch.length; i += CHUNK_SIZE) {
      const chunk = batch.slice(i, i + CHUNK_SIZE);
      const saved = await memberRepository.upsertMembers(chunk);
      importedCount += saved.length;
    }

    return {
      totalRows: rawRecords.length,
      importedCount,
      skippedCount: rawRecords.length - batch.length,
      errors: errors.slice(0, 20),
    };
  }

  /**
   * Imports `event_pre_registrations.csv` for a specific event.
   * Automatically attaches `event_id`, maps accompanying counts into `accompanying_family_count`,
   * sets `membership_type = 'UNREGISTERED_MEMBER'` without cross-populating from association_members,
   * and upserts cleanly on `(event_id, email)`.
   */
  async importPreRegistrationsCsv(
    eventId: number,
    csvText: string
  ): Promise<CsvImportSummary> {
    const event = await eventRepository.getEventById(eventId);
    if (!event) {
      throw new Error(`Event ID ${eventId} not found.`);
    }

    const rawRecords = parseCsvRecords(csvText);
    assertTemplate(rawRecords, PRE_REG_HEADERS, "event attendees");
    const errors: string[] = [];
    const dedupMap = new Map<string, Partial<EventPreRegistration>>();
    const nowIso = new Date().toISOString();

    // Link each pre-registration to the association member master (by email,
    // then by mobile) so membership type and fee are correct at the venue.
    const members = await memberRepository.getAllMembers();
    const memberByEmail = new Map(members.map((m) => [normalizeEmail(m.email), m]));
    const memberByPhone = new Map<string, AssociationMember>();
    for (const m of members) {
      const digits = extractPhoneDigits(m.mobile);
      if (digits.length === 10 && !memberByPhone.has(digits)) memberByPhone.set(digits, m);
    }
    let linkedCount = 0;

    for (let idx = 0; idx < rawRecords.length; idx++) {
      const row = rawRecords[idx];
      const fullName = (row["Name"] || row["full_name"] || "").trim();
      const email = normalizeEmail(row["Email"] || row["email"]);

      if (!fullName || !email) {
        errors.push(`Row ${idx + 2}: Missing required Name or Email.`);
        continue;
      }

      const yearRaw = row["Year"] || row["Batch"] || row["graduating_year"];
      const parsedYear = parseBatchYear(yearRaw);

      const familyRaw =
        row["No of Accompanying members (Alumni/Family)"] ||
        row["accompanying_family_count"] ||
        "0";
      const familyCount = Math.min(50, Math.max(0, parseInt(familyRaw, 10) || 0));

      const mobile = normalizeMobile(row["Mobile"] || row["mobile"]);
      const phoneDigits = extractPhoneDigits(mobile);
      const member =
        memberByEmail.get(email) ||
        (phoneDigits.length === 10 ? memberByPhone.get(phoneDigits) : undefined);
      if (member && !dedupMap.has(email)) linkedCount += 1;

      dedupMap.set(email, {
        event_id: eventId,
        member_login_id: member ? member.member_login_id : null,
        full_name: fullName,
        course: normalizeCourseLabel(row["Course"] || row["course"]),
        stream: normalizeStreamLabel(row["Stream"] || row["stream"]),
        graduating_year: !isNaN(parsedYear) ? parsedYear : null,
        email,
        mobile,
        membership_type: member ? member.membership_type : "UNREGISTERED_MEMBER",
        food_preference: normalizeFoodPreference(
          row["Your Food Preference?"] ||
            row["Food Preference"] ||
            row["food_preference"]
        ),
        accompanying_alumni_count: 0,
        accompanying_family_count: familyCount,
        response_status: normalizeResponseStatus(
          row["Status"] || row["response_status"]
        ),
        imported_at: nowIso,
      });
    }

    const batch = Array.from(dedupMap.values());
    let importedCount = 0;

    const CHUNK_SIZE = 200;
    for (let i = 0; i < batch.length; i += CHUNK_SIZE) {
      const chunk = batch.slice(i, i + CHUNK_SIZE);
      const saved = await preRegistrationRepository.upsertPreRegistrations(chunk);
      importedCount += saved.length;
    }

    return {
      totalRows: rawRecords.length,
      importedCount,
      skippedCount: rawRecords.length - batch.length,
      linkedMembersCount: linkedCount,
      errors: errors.slice(0, 20),
    };
  }
}

export const importService = new ImportService();
