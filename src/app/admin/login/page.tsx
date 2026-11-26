"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Button, Field, Input, Notice, Segmented, api } from "@/components/ui";

type Mode = "admin" | "desk";

function nextPath(mode: Mode): string {
  const fallback = mode === "admin" ? "/admin" : "/checkin";
  if (typeof window === "undefined") return fallback;
  const next = new URLSearchParams(window.location.search).get("next");
  if (!next || !next.startsWith("/") || next.startsWith("//")) return fallback;
  if (mode === "desk" && !next.startsWith("/checkin") && !next.startsWith("/register")) return "/checkin";
  return next;
}

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("admin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [pin, setPin] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await api("/api/auth/login", {
        method: "POST",
        json: mode === "admin" ? { mode, email: email.trim(), password } : { mode, pin: pin.trim() },
      });
      router.replace(nextPath(mode));
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign in failed.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-dvh flex flex-col">
      <div className="brand-stripe" />
      <main className="flex-1 flex flex-col justify-center px-4 py-10">
        <div className="w-full max-w-sm mx-auto">
          <div className="text-center mb-6">
            <Image src="/logo.png" alt="IRTT Alumni Association" width={64} height={64} className="mx-auto" priority />
            <h1 className="mt-4 text-2xl font-semibold tracking-tight text-ink">Staff sign in</h1>
            <p className="mt-1 text-sm text-muted">For event organizers and desk volunteers</p>
          </div>

          <div className="bg-white rounded-2xl border border-line shadow-[0_4px_16px_rgba(16,24,40,0.06)] p-5 sm:p-6 space-y-5">
            <Segmented
              label="Sign in as"
              value={mode}
              onChange={(m) => {
                setMode(m);
                setError(null);
              }}
              options={[
                { value: "admin", label: "Organizer" },
                { value: "desk", label: "Desk volunteer" },
              ]}
            />

            <form onSubmit={submit} className="space-y-4">
              {mode === "admin" ? (
                <>
                  <Field label="Email">
                    <Input
                      type="email"
                      required
                      autoComplete="username"
                      autoCapitalize="none"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </Field>
                  <Field label="Password">
                    <Input
                      type="password"
                      required
                      autoComplete="current-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                  </Field>
                </>
              ) : (
                <Field label="Desk PIN" hint="Ask an organizer for today's PIN. It opens the check-in desk only.">
                  <Input
                    type="password"
                    inputMode="numeric"
                    required
                    autoComplete="off"
                    value={pin}
                    onChange={(e) => setPin(e.target.value)}
                    className="tracking-[0.3em]"
                  />
                </Field>
              )}

              {error && <Notice tone="error">{error}</Notice>}

              <Button type="submit" size="lg" className="w-full" loading={loading}>
                {mode === "admin" ? "Sign in" : "Open check-in desk"}
              </Button>
            </form>
          </div>

          <p className="mt-6 text-center text-sm">
            <Link href="/" className="font-medium text-muted hover:text-ink">
              Back to event page
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}
