import { fetchAllRows, supabaseAdmin, toIlikePattern } from "../config/supabase";
import { AssociationMember } from "@/types/database.types";
import { extractPhoneDigits, normalizeEmail } from "../utils/csv";

const client = supabaseAdmin;

export class MemberRepository {
  async listMembers(filters?: {
    search?: string;
    membershipType?: string;
    limit?: number;
  }): Promise<AssociationMember[]> {
    let query = client.from("association_members").select("*");

    if (filters?.membershipType && filters.membershipType !== "All") {
      query = query.eq("membership_type", filters.membershipType);
    }
    if (filters?.search && filters.search.trim()) {
      const term = toIlikePattern(filters.search);
      query = query.or(
        `full_name.ilike.${term},email.ilike.${term},mobile.ilike.${term},member_login_id.ilike.${term}`
      );
    }

    query = query.order("full_name", { ascending: true });
    if (filters?.limit) {
      query = query.limit(filters.limit);
    }

    const { data, error } = await query;
    if (error) {
      console.error("Error listing association members:", error.message);
      return [];
    }
    return (data as AssociationMember[]) || [];
  }

  async getMemberCount(): Promise<number> {
    const { count, error } = await client
      .from("association_members")
      .select("*", { count: "exact", head: true });

    if (error) {
      console.error("Error counting association members:", error.message);
      return 0;
    }
    return count || 0;
  }

  async findByEmailOrMobile(
    emailOrMobile: string
  ): Promise<AssociationMember | null> {
    const trimmed = emailOrMobile.trim();
    if (!trimmed) return null;

    if (trimmed.includes("@")) {
      const { data, error } = await client
        .from("association_members")
        .select("*")
        .eq("email", normalizeEmail(trimmed))
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error("Error finding member by email:", error.message);
        return null;
      }
      return (data as AssociationMember) || null;
    }

    const digits = extractPhoneDigits(trimmed);
    if (digits.length < 7) return null;

    const { data, error } = await client
      .from("association_members")
      .select("*")
      .ilike("mobile", `%${digits}%`)
      .limit(10);

    if (error || !data) {
      if (error) console.error("Error finding member by mobile:", error.message);
      return null;
    }

    const exact = (data as AssociationMember[]).find(
      (m) => extractPhoneDigits(m.mobile) === digits
    );
    return exact || null;
  }

  /** All members (paged), used to link pre-registrations to the member master. */
  async getAllMembers(): Promise<AssociationMember[]> {
    return fetchAllRows<AssociationMember>(async (from, to) =>
      client
        .from("association_members")
        .select("*")
        .order("member_login_id", { ascending: true })
        .range(from, to)
    );
  }

  async upsertMembers(
    members: Partial<AssociationMember>[]
  ): Promise<AssociationMember[]> {
    if (members.length === 0) return [];

    const { data, error } = await client
      .from("association_members")
      .upsert(members, { onConflict: "member_login_id" })
      .select();

    if (error) {
      console.error("Error upserting association members:", error.message);
      throw new Error(error.message);
    }
    return (data as AssociationMember[]) || [];
  }
}

export const memberRepository = new MemberRepository();
