"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { CalendarDays, Clock, MapPin, UserCheck } from "lucide-react";
import { Event } from "@/types/database.types";
import { BrandMark, DateTile, Spinner, formatLongDate } from "@/components/ui";


export default function HomePage() {
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/events/active")
      .then((r) => (r.ok ? r.json() : null))
      .then((json) => setEvent(json?.data || null))
      .catch(() => undefined)
      .finally(() => setLoading(false));
  }, []);

  const mapsUrl = event?.venue
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(event.venue)}`
    : null;

  return (
    <div className="min-h-dvh flex flex-col">
      <div className="brand-stripe" />
      <header className="bg-white border-b border-line">
        <div className="max-w-2xl mx-auto px-4 h-16 flex items-center justify-between gap-3">
          <BrandMark />
          <Link href="/admin/login" className="shrink-0 text-sm font-medium text-muted hover:text-ink">
            Staff sign in
          </Link>
        </div>
      </header>

      <main className="flex-1 max-w-2xl w-full mx-auto px-4 py-6 sm:py-10 space-y-6">
        {loading ? (
          <Spinner />
        ) : event ? (
          <>
            <section className="bg-white rounded-2xl border border-line shadow-[0_1px_3px_rgba(16,24,40,0.06)] overflow-hidden">
              <div className="p-5 sm:p-7">
                <div className="flex items-start gap-4">
                  <DateTile date={event.event_date} size="lg" />
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-brand-700">
                      {event.chapter_name
                        ? /chapter/i.test(event.chapter_name)
                          ? event.chapter_name
                          : `${event.chapter_name} chapter`
                        : "Alumni meet"}
                    </div>
                    <h1 className="mt-0.5 text-2xl sm:text-3xl font-semibold tracking-tight text-ink leading-tight">
                      {event.event_name}
                    </h1>
                  </div>
                </div>

                {event.description && <p className="mt-4 text-[15px] text-muted leading-relaxed">{event.description}</p>}

                <ul className="mt-5 space-y-3 text-[15px] text-ink">
                  <li className="flex items-center gap-3">
                    <CalendarDays className="w-5 h-5 text-muted shrink-0" />
                    {formatLongDate(event.event_date)}
                  </li>
                  {event.event_time && (
                    <li className="flex items-center gap-3">
                      <Clock className="w-5 h-5 text-muted shrink-0" />
                      {event.event_time}
                    </li>
                  )}
                  {event.venue && (
                    <li className="flex items-start gap-3">
                      <MapPin className="w-5 h-5 text-muted shrink-0 mt-0.5" />
                      <span>
                        {event.venue}
                        {mapsUrl && (
                          <a
                            href={mapsUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block text-sm font-medium text-brand-700 hover:underline mt-0.5"
                          >
                            Open in Maps
                          </a>
                        )}
                      </span>
                    </li>
                  )}
                </ul>
              </div>
              <div className="px-5 sm:px-7 py-4 bg-canvas/60 border-t border-line flex items-start gap-3">
                <UserCheck className="w-5 h-5 text-brand-600 shrink-0 mt-0.5" />
                <p className="text-sm text-ink">
                  Check-in is at the registration desk at the venue. Please bring the email or mobile
                  number you registered with.
                </p>
              </div>
            </section>

          </>
        ) : (
          <section className="bg-white rounded-2xl border border-line p-8 text-center">
            <div className="mx-auto w-12 h-12 rounded-full bg-brand-50 flex items-center justify-center">
              <CalendarDays className="w-6 h-6 text-brand-600" />
            </div>
            <h1 className="mt-4 text-xl font-semibold text-ink">No event open for check-in</h1>
            <p className="mt-1 text-muted">Check-in opens on the day of the event.</p>
          </section>
        )}
      </main>

      <footer className="py-6 text-center text-xs text-muted">
        Institute of Road and Transport Technology Alumni Association
      </footer>
    </div>
  );
}
