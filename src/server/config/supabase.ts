import { createClient } from "@supabase/supabase-js";

/**
 * Server-side Supabase client. Only import this from API routes / server code.
 *
 * All database access goes through the Next.js API layer, which enforces
 * organizer/desk authentication. The browser never talks to the tables directly,
 * so the database can deny the public (anon) role entirely
 * (see data/DataBase_design/002_security_hardening.sql).
 */
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !(serviceKey || anonKey)) {
  throw new Error(
    "Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local."
  );
}

const hasRealServiceKey = Boolean(serviceKey) && serviceKey !== anonKey;
if (!hasRealServiceKey) {
  console.warn(
    "[supabase] SUPABASE_SERVICE_ROLE_KEY is missing or equals the public key. " +
      "The app will only work while the database allows public access. " +
      "Set the secret/service_role key and apply 002_security_hardening.sql."
  );
}

export const supabaseAdmin = createClient(supabaseUrl, (serviceKey || anonKey)!, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

/** @deprecated kept for older imports; identical to supabaseAdmin */
export const supabase = supabaseAdmin;

/** Supabase/PostgREST returns at most 1000 rows per request; page through all. */
export async function fetchAllRows<T>(
  buildQuery: (from: number, to: number) => PromiseLike<{
    data: T[] | null;
    error: { message: string } | null;
  }>,
  pageSize = 1000
): Promise<T[]> {
  const all: T[] = [];
  for (let from = 0; ; from += pageSize) {
    const { data, error } = await buildQuery(from, from + pageSize - 1);
    if (error) throw new Error(error.message);
    const rows = data || [];
    all.push(...rows);
    if (rows.length < pageSize) break;
  }
  return all;
}

/**
 * Escapes user search text for use inside a PostgREST `.or()` ilike filter.
 * Commas, parentheses, quotes and backslashes would otherwise break the
 * filter syntax. (`_` is left in: as a wildcard it only widens a search.)
 */
export function toIlikePattern(search: string): string {
  const cleaned = search
    .trim()
    .slice(0, 100)
    .replace(/[,()"'\\%*]/g, " ")
    .trim();
  return `%${cleaned}%`;
}
