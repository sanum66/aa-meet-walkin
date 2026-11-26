import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import {
  ADMIN_SESSION_TTL_SECONDS,
  DESK_SESSION_TTL_SECONDS,
  SESSION_COOKIE,
  pinFingerprint,
  safeEqual,
  signSession,
} from "@/server/auth/session";
import { currentDeskPin } from "@/server/auth/desk";
import { clientIp, rateLimit } from "@/server/auth/rateLimit";

export const dynamic = "force-dynamic";

const loginSchema = z.discriminatedUnion("mode", [
  z.object({
    mode: z.literal("admin"),
    email: z.string().trim().toLowerCase().email("Enter a valid email"),
    password: z.string().min(1, "Password is required"),
  }),
  z.object({
    mode: z.literal("desk"),
    pin: z.string().trim().min(4, "Enter the desk PIN"),
  }),
]);

function allowedAdminEmails(): string[] {
  return (process.env.ADMIN_EMAILS || "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

async function verifyAdmin(email: string, password: string): Promise<boolean> {
  // 1. Bootstrap organizer account from environment
  const envEmail = (process.env.ADMIN_EMAIL || "").trim().toLowerCase();
  const envPassword = process.env.ADMIN_PASSWORD || "";
  if (envEmail && envPassword.length >= 8 && email === envEmail) {
    return safeEqual(password, envPassword);
  }

  // 2. Supabase Auth users that are explicitly allow-listed as organizers
  if (!allowedAdminEmails().includes(email)) return false;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) return false;

  const client = createClient(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data, error } = await client.auth.signInWithPassword({
    email,
    password,
  });
  if (error || !data.user) return false;
  await client.auth.signOut().catch(() => undefined);
  return true;
}

export async function POST(req: NextRequest) {
  const ip = clientIp(req.headers);
  const limited = rateLimit(`login:${ip}`, 10, 10 * 60 * 1000);
  if (!limited.allowed) {
    return NextResponse.json(
      {
        success: false,
        error: `Too many attempts. Try again in ${Math.ceil(
          limited.retryAfterSeconds / 60
        )} minute(s).`,
      },
      { status: 429 }
    );
  }

  let parsed: z.infer<typeof loginSchema>;
  try {
    parsed = loginSchema.parse(await req.json());
  } catch {
    return NextResponse.json(
      { success: false, error: "Please fill in all required fields." },
      { status: 400 }
    );
  }

  let token: string;
  let ttl: number;
  try {
    if (parsed.mode === "admin") {
      const ok = await verifyAdmin(parsed.email, parsed.password);
      if (!ok) {
        return NextResponse.json(
          { success: false, error: "Invalid email or password." },
          { status: 401 }
        );
      }
      ttl = ADMIN_SESSION_TTL_SECONDS;
      token = await signSession("admin", parsed.email, ttl);
    } else {
      const current = await currentDeskPin();
      if (!current) {
        return NextResponse.json(
          { success: false, error: "No event is published right now." },
          { status: 401 }
        );
      }
      if (!current.pin) {
        return NextResponse.json(
          { success: false, error: "No desk PIN is set for today's event. Ask an organizer." },
          { status: 401 }
        );
      }
      if (!safeEqual(parsed.pin, current.pin)) {
        return NextResponse.json({ success: false, error: "Incorrect desk PIN." }, { status: 401 });
      }
      ttl = DESK_SESSION_TTL_SECONDS;
      token = await signSession("desk", "desk", ttl, {
        eid: current.eventId,
        pv: await pinFingerprint(current.pin),
      });
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Login failed";
    console.error("Login error:", message);
    return NextResponse.json(
      { success: false, error: "Login is not configured on the server." },
      { status: 500 }
    );
  }

  const res = NextResponse.json({ success: true, role: parsed.mode });
  res.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: ttl,
  });
  return res;
}
