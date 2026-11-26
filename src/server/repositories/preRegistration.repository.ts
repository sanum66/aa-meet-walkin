import { fetchAllRows, supabaseAdmin, toIlikePattern } from "../config/supabase";
import { EventPreRegistration } from "@/types/database.types";
import { extractPhoneDigits, normalizeEmail } from "../utils/csv";

const client = supabaseAdmin;

export class PreRegistrationRepository {
  async listByEvent(
    eventId: number,
    filters?: { search?: string; responseStatus?: string; limit?: number }
  ): Promise<EventPreRegistration[]> {
    let query = client
      .from("event_pre_registrations")
      .select("*")
      .eq("event_id", eventId);

    if (filters?.responseStatus && filters.responseStatus !== "All") {
      query = query.eq("response_status", filters.responseStatus);
    }
    if (filters?.search && filters.search.trim()) {
      const term = toIlikePattern(filters.search);
      query = query.or(
        `full_name.ilike.${term},email.ilike.${term},mobile.ilike.${term}`
      );
    }

    query = query.order("full_name", { ascending: true });
    if (filters?.limit) {
      query = query.limit(filters.limit);
    }

    const { data, error } = await query;
    if (error) {
      console.error("Error listing pre-registrations:", error.message);
      return [];
    }
    return (data as EventPreRegistration[]) || [];
  }

  async getAllByEvent(eventId: number): Promise<EventPreRegistration[]> {
    return fetchAllRows<EventPreRegistration>(async (from, to) =>
      client
        .from("event_pre_registrations")
        .select("*")
        .eq("event_id", eventId)
        .order("full_name", { ascending: true })
        .range(from, to)
    );
  }

  async getCountByEvent(eventId: number): Promise<number> {
    const { count, error } = await client
      .from("event_pre_registrations")
      .select("*", { count: "exact", head: true })
      .eq("event_id", eventId);

    if (error) {
      console.error("Error counting pre-registrations:", error.message);
      return 0;
    }
    return count || 0;
  }

  async findByEventAndEmailOrMobile(
    eventId: number,
    emailOrMobile: string
  ): Promise<EventPreRegistration | null> {
    const trimmed = emailOrMobile.trim();
    if (!trimmed) return null;

    if (trimmed.includes("@")) {
      const { data, error } = await client
        .from("event_pre_registrations")
        .select("*")
        .eq("event_id", eventId)
        .eq("email", normalizeEmail(trimmed))
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error("Error finding pre-registration by email:", error.message);
        return null;
      }
      return (data as EventPreRegistration) || null;
    }

    const digits = extractPhoneDigits(trimmed);
    if (digits.length < 7) return null;

    const { data, error } = await client
      .from("event_pre_registrations")
      .select("*")
      .eq("event_id", eventId)
      .ilike("mobile", `%${digits}%`)
      .limit(10);

    if (error || !data) {
      if (error)
        console.error("Error finding pre-registration by mobile:", error.message);
      return null;
    }

    const exact = (data as EventPreRegistration[]).find(
      (r) => extractPhoneDigits(r.mobile) === digits
    );
    return exact || null;
  }

  async upsertPreRegistrations(
    records: Partial<EventPreRegistration>[]
  ): Promise<EventPreRegistration[]> {
    if (records.length === 0) return [];

    const { data, error } = await client
      .from("event_pre_registrations")
      .upsert(records, { onConflict: "event_id,email" })
      .select();

    if (error) {
      console.error("Error upserting pre-registrations:", error.message);
      throw new Error(error.message);
    }
    return (data as EventPreRegistration[]) || [];
  }
}

export const preRegistrationRepository = new PreRegistrationRepository();
