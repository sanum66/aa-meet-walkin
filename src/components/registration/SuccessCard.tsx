"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { CheckCircle2, Printer, RotateCcw } from "lucide-react";
import { Event, EventRegistration } from "@/types/database.types";
import { Badge, Button, formatDate, inr, passNumber } from "@/components/ui";

interface SuccessCardProps {
  registration: EventRegistration;
  event: Event;
  onReset: () => void;
}

/** Ticket-style event pass shown after check-in (and printable). */
export function SuccessCard({ registration: r, event, onReset }: SuccessCardProps) {

  const details: [string, string][] = [
    ["Batch", [r.graduating_year, r.course, r.stream].filter(Boolean).join(" · ") || "—"],
    ["Food", r.food_preference || "—"],
    ["Family", r.accompanying_family_count > 0 ? String(r.accompanying_family_count) : "None"],
    ["Checked in", new Date(r.checked_in_at.endsWith("Z") ? r.checked_in_at : `${r.checked_in_at}Z`).toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" })],
  ];

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3 no-print">
        <CheckCircle2 className="w-8 h-8 text-green-600 shrink-0" />
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-ink">Checked in</h1>
          <p className="text-sm text-muted">Show this pass to the person, or print it.</p>
        </div>
      </div>

      <article className="relative bg-white rounded-2xl border border-line shadow-[0_4px_16px_rgba(16,24,40,0.08)] overflow-hidden print:shadow-none">
        <div className="brand-stripe" />
        <header className="bg-brand-700 text-white px-5 py-4 flex items-center gap-3">
          <div className="w-11 h-11 shrink-0 rounded-full bg-white flex items-center justify-center">
            <Image src="/logo.png" alt="" width={38} height={38} />
          </div>
          <div className="min-w-0">
            <div className="font-semibold truncate">{event.event_name}</div>
            <div className="text-sm text-brand-100 truncate">
              {formatDate(event.event_date)}
              {event.venue ? ` · ${event.venue}` : ""}
            </div>
          </div>
        </header>

        <div className="px-5 pt-5 pb-4">
          <div className="text-xs font-medium uppercase tracking-wider text-muted">Attendee</div>
          <div className="mt-0.5 text-xl font-semibold text-ink">{r.full_name}</div>
        </div>

        {/* Perforation */}
        <div className="relative h-6" aria-hidden="true">
          <div className="absolute -left-3 top-0 w-6 h-6 rounded-full bg-canvas border border-line" />
          <div className="absolute -right-3 top-0 w-6 h-6 rounded-full bg-canvas border border-line" />
          <div className="absolute left-5 right-5 top-1/2 border-t-2 border-dashed border-line" />
        </div>

        <div className="px-5 pt-3 pb-5 space-y-4">
          <div className="flex items-end justify-between gap-3">
            <div>
              <div className="text-xs font-medium uppercase tracking-wider text-muted">Pass number</div>
              <div className="mt-0.5 text-2xl font-semibold font-mono tracking-wide text-brand-800">
                {passNumber(r.registration_id)}
              </div>
            </div>
            {r.payment_required ? (
              <Badge tone="green" dot>
                Paid {inr(r.total_amount)}
              </Badge>
            ) : (
              <Badge tone="blue" dot>
                No fee
              </Badge>
            )}
          </div>

          <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
            {details.map(([k, v]) => (
              <div key={k}>
                <dt className="text-muted">{k}</dt>
                <dd className="font-medium text-ink">{v}</dd>
              </div>
            ))}
          </dl>

          {r.payment_required && (
            <div className="text-sm text-muted pt-3 border-t border-line">
              {r.payment_mode === "ONLINE"
                ? `Paid by UPI${r.utr_last4 ? `, reference ending ${r.utr_last4}` : ""}.`
                : "Paid in cash."}
              {Number(r.voluntary_contribution) > 0 &&
                ` Includes a contribution of ${inr(r.voluntary_contribution)}. Thank you.`}
            </div>
          )}
        </div>
      </article>

      <div className="grid grid-cols-2 gap-3 no-print">
        <Button variant="secondary" onClick={() => window.print()}>
          <Printer className="w-4 h-4" />
          Print
        </Button>
        <Button onClick={onReset}>
          <RotateCcw className="w-4 h-4" />
          Next check-in
        </Button>
      </div>
      <div className="text-center no-print">
        <Link href="/checkin" className="text-sm font-medium text-muted hover:text-ink">
          Back to desk
        </Link>
      </div>
    </div>
  );
}
