import { fetchAllRows, supabaseAdmin, toIlikePattern } from "../config/supabase";
import { EventRegistration } from "@/types/database.types";
import { extractPhoneDigits, normalizeEmail } from "../utils/csv";

const client = supabaseAdmin;

export interface RegistrationFilters {
  eventId?: number;
  graduatingYear?: number;
  stream?: string;
  registrationSource?: string;
  paymentMode?: string;
  search?: string;
  limit?: number;
}

export class RegistrationRepository {
  async listRegistrations(
    filters: RegistrationFilters = {}
  ): Promise<EventRegistration[]> {
    const build = () => {
      let query = client.from("event_registrations").select("*");

      if (filters.eventId) {
        query = query.eq("event_id", filters.eventId);
      }
      if (filters.graduatingYear) {
        query = query.eq("graduating_year", filters.graduatingYear);
      }
      if (filters.stream && filters.stream !== "All") {
        query = query.eq("stream", filters.stream);
      }
      if (filters.registrationSource && filters.registrationSource !== "All") {
        query = query.eq("registration_source", filters.registrationSource);
      }
      if (filters.paymentMode && filters.paymentMode !== "All") {
        query = query.eq("payment_mode", filters.paymentMode);
      }
      if (filters.search && filters.search.trim()) {
        const term = toIlikePattern(filters.search);
        query = query.or(
          `full_name.ilike.${term},email.ilike.${term},mobile.ilike.${term},utr_last4.ilike.${term}`
        );
      }
      return query
        .order("checked_in_at", { ascending: false })
        .order("registration_id", { ascending: false });
    };

    try {
      if (filters.limit) {
        const { data, error } = await build().limit(filters.limit);
        if (error) throw new Error(error.message);
        return (data as EventRegistration[]) || [];
      }
      return await fetchAllRows<EventRegistration>((from, to) =>
        build().range(from, to)
      );
    } catch (err) {
      console.error(
        "Error listing event registrations:",
        err instanceof Error ? err.message : err
      );
      throw new Error("Could not load registrations. Please try again.");
    }
  }

  async findById(registrationId: number): Promise<EventRegistration | null> {
    const { data, error } = await client
      .from("event_registrations")
      .select("*")
      .eq("registration_id", registrationId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return (data as EventRegistration) || null;
  }

  async findByEventAndEmailOrMobile(
    eventId: number,
    emailOrMobile: string
  ): Promise<EventRegistration | null> {
    const trimmed = emailOrMobile.trim();
    if (!trimmed) return null;

    if (trimmed.includes("@")) {
      const { data, error } = await client
        .from("event_registrations")
        .select("*")
        .eq("event_id", eventId)
        .eq("email", normalizeEmail(trimmed))
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error("Error finding registration by email:", error.message);
        return null;
      }
      return (data as EventRegistration) || null;
    }

    const digits = extractPhoneDigits(trimmed);
    if (digits.length < 7) return null;

    const { data, error } = await client
      .from("event_registrations")
      .select("*")
      .eq("event_id", eventId)
      .ilike("mobile", `%${digits}%`)
      .limit(10);

    if (error || !data) {
      if (error)
        console.error("Error finding registration by mobile:", error.message);
      return null;
    }

    const exact = (data as EventRegistration[]).find(
      (r) => extractPhoneDigits(r.mobile) === digits
    );
    return exact || null;
  }

  async findByEventAndEmail(
    eventId: number,
    email: string
  ): Promise<EventRegistration | null> {
    const { data, error } = await client
      .from("event_registrations")
      .select("*")
      .eq("event_id", eventId)
      .eq("email", normalizeEmail(email))
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error("Error checking existing registration:", error.message);
      return null;
    }
    return (data as EventRegistration) || null;
  }

  async insertRegistration(
    payload: Partial<EventRegistration>
  ): Promise<EventRegistration> {
    const { data, error } = await client
      .from("event_registrations")
      .insert(payload)
      .select()
      .single();

    if (error) {
      console.error("Error creating registration:", error.message);
      if (error.code === "23505") {
        throw new Error("This email is already checked in for this event.");
      }
      throw new Error(error.message);
    }
    return data as EventRegistration;
  }

  async updateRegistration(
    registrationId: number,
    updates: Partial<EventRegistration>
  ): Promise<EventRegistration> {
    const { data, error } = await client
      .from("event_registrations")
      .update(updates)
      .eq("registration_id", registrationId)
      .select()
      .single();

    if (error) {
      console.error(`Error updating registration ${registrationId}:`, error.message);
      if (error.code === "23505") {
        throw new Error("Another check-in for this event already uses that email.");
      }
      throw new Error(error.message);
    }
    return data as EventRegistration;
  }

  async deleteRegistration(registrationId: number): Promise<boolean> {
    const { error } = await client
      .from("event_registrations")
      .delete()
      .eq("registration_id", registrationId);

    if (error) {
      console.error(`Error deleting registration ${registrationId}:`, error.message);
      return false;
    }
    return true;
  }
}

export const registrationRepository = new RegistrationRepository();
