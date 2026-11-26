/**
 * Stateless signed session tokens (HMAC-SHA256 via Web Crypto).
 * Works in both the Edge middleware runtime and Node route handlers.
 *
 * Token format: base64url(JSON payload) + "." + base64url(signature)
 */

export type SessionRole = "admin" | "desk";

export interface SessionPayload {
  role: SessionRole;
  /** Admin email, or "desk" for volunteer desk sessions */
  sub: string;
  /** Expiry as unix seconds */
  exp: number;
  /** Desk sessions: the published event they signed in to */
  eid?: number;
  /** Desk sessions: fingerprint of the PIN used (changing the PIN signs them out) */
  pv?: string;
}

export const SESSION_COOKIE = "nuzhai_session";
export const ADMIN_SESSION_TTL_SECONDS = 60 * 60 * 12; // 12 hours
export const DESK_SESSION_TTL_SECONDS = 60 * 60 * 16; // a full event day

const encoder = new TextEncoder();

function getSecret(): string {
  const secret = process.env.AUTH_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error(
      "AUTH_SECRET is missing or shorter than 32 characters. Set it in .env.local."
    );
  }
  return secret;
}

function toBase64Url(bytes: Uint8Array): string {
  let binary = "";
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64Url(input: string): Uint8Array<ArrayBuffer> {
  const padded = input.replace(/-/g, "+").replace(/_/g, "/");
  const binary = atob(padded + "=".repeat((4 - (padded.length % 4)) % 4));
  const out = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) out[i] = binary.charCodeAt(i);
  return out;
}

async function getKey(): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "raw",
    encoder.encode(getSecret()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
}

export async function signSession(
  role: SessionRole,
  sub: string,
  ttlSeconds: number,
  extra: Pick<SessionPayload, "eid" | "pv"> = {}
): Promise<string> {
  const payload: SessionPayload = {
    role,
    sub,
    exp: Math.floor(Date.now() / 1000) + ttlSeconds,
    ...extra,
  };
  const body = toBase64Url(encoder.encode(JSON.stringify(payload)));
  const sig = await crypto.subtle.sign("HMAC", await getKey(), encoder.encode(body));
  return `${body}.${toBase64Url(new Uint8Array(sig))}`;
}

export async function verifySession(
  token: string | undefined | null
): Promise<SessionPayload | null> {
  if (!token) return null;
  const [body, sig] = token.split(".");
  if (!body || !sig) return null;
  try {
    const valid = await crypto.subtle.verify(
      "HMAC",
      await getKey(),
      fromBase64Url(sig),
      encoder.encode(body)
    );
    if (!valid) return null;
    const payload = JSON.parse(
      new TextDecoder().decode(fromBase64Url(body))
    ) as SessionPayload;
    if (payload.role !== "admin" && payload.role !== "desk") return null;
    if (!payload.exp || payload.exp < Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch {
    return null;
  }
}

/** Constant-time string comparison (avoids leaking match length via timing). */
export function safeEqual(a: string, b: string): boolean {
  const aBytes = encoder.encode(a);
  const bBytes = encoder.encode(b);
  let diff = aBytes.length ^ bBytes.length;
  const len = Math.max(aBytes.length, bBytes.length);
  for (let i = 0; i < len; i++) {
    diff |= (aBytes[i] ?? 0) ^ (bBytes[i] ?? 0);
  }
  return diff === 0;
}

/** Short, non-reversible fingerprint of a desk PIN, stored in desk sessions. */
export async function pinFingerprint(pin: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", encoder.encode(`${getSecret()}:${pin}`));
  return toBase64Url(new Uint8Array(digest)).slice(0, 12);
}
