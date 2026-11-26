"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { CalendarPlus, ChevronRight, Plus, Users } from "lucide-react";
import { Event } from "@/types/database.types";
import {
  AppHeader,
  Badge,
  Card,
  DateTile,
  Empty,
  LinkButton,
  Notice,
  Page,
  PageTitle,
  Spinner,
  api,
} from "@/components/ui";
import { SignOutButton } from "@/components/admin/SignOutButton";

const today = () => new Date().toISOString().slice(0, 10);

function EventRow({ ev }: { ev: Event }) {
  const past = ev.event_date < today();
  return (
    <li>
      <Link href={`/admin/events/${ev.event_id}`} className="flex items-center gap-4 px-4 py-3.5 hover:bg-canvas transition-colors">
        <DateTile date={ev.event_date} />
        <div className="min-w-0 flex-1">
          <div className="font-semibold text-ink truncate">{ev.event_name}</div>
          <div className="text-sm text-muted truncate">{ev.venue || ev.chapter_name}</div>
          <div className="mt-1.5">
            {ev.is_active ? (
              <Badge tone="green" dot>Published</Badge>
            ) : past ? (
              <Badge>Finished</Badge>
            ) : (
              <Badge tone="amber" dot>Draft</Badge>
            )}
          </div>
        </div>
        <ChevronRight className="w-5 h-5 text-muted/60 shrink-0" />
      </Link>
    </li>
  );
}

function Section({ title, events }: { title: string; events: Event[] }) {
  if (events.length === 0) return null;
  return (
    <section>
      <h2 className="px-1 mb-2 text-xs font-semibold uppercase tracking-wider text-muted">{title}</h2>
      <Card padded={false}>
        <ul className="divide-y divide-line">
          {events.map((ev) => (
            <EventRow key={ev.event_id} ev={ev} />
          ))}
        </ul>
      </Card>
    </section>
  );
}

export default function AdminEventsPage() {
  const [events, setEvents] = useState<Event[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api<{ data: Event[] }>("/api/admin/events")
      .then((res) => setEvents(res.data))
      .catch((err) => setError(err.message));
  }, []);

  const t = today();
  const published = (events || []).filter((e) => e.is_active);
  const upcoming = (events || [])
    .filter((e) => !e.is_active && e.event_date >= t)
    .sort((a, b) => a.event_date.localeCompare(b.event_date));
  const past = (events || []).filter((e) => !e.is_active && e.event_date < t);

  return (
    <>
      <AppHeader right={<SignOutButton />} />
      <Page>
        <PageTitle
          description="Create events, upload attendee lists and publish the one that's happening."
          action={
            <LinkButton href="/admin/events/new" size="sm" className="shrink-0">
              <Plus className="w-4 h-4" /> New event
            </LinkButton>
          }
        >
          Events
        </PageTitle>

        {error && <Notice tone="error">{error}</Notice>}

        {!events && !error ? (
          <Spinner />
        ) : events && events.length === 0 ? (
          <Card>
            <Empty
              icon={CalendarPlus}
              title="No events yet"
              action={<LinkButton href="/admin/events/new">Create your first event</LinkButton>}
            >
              An event holds its own attendee list, fees and check-ins.
            </Empty>
          </Card>
        ) : (
          <div className="space-y-6">
            <Section title="Published" events={published} />
            <Section title="Upcoming" events={upcoming} />
            <Section title="Past" events={past} />
          </div>
        )}

        <section className="pt-2">
          <h2 className="px-1 mb-2 text-xs font-semibold uppercase tracking-wider text-muted">Association</h2>
          <Card padded={false}>
            <Link href="/admin/members" className="flex items-center gap-4 px-4 py-3.5 hover:bg-canvas transition-colors rounded-xl">
              <div className="w-12 h-12 shrink-0 rounded-xl bg-brand-50 flex items-center justify-center">
                <Users className="w-5 h-5 text-brand-600" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="font-semibold text-ink">Members list</div>
                <div className="text-sm text-muted">Recognises members at check-in. Shared by all events.</div>
              </div>
              <ChevronRight className="w-5 h-5 text-muted/60 shrink-0" />
            </Link>
          </Card>
        </section>
      </Page>
    </>
  );
}
