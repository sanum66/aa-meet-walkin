"use client";

import React, { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Event, EventRegistration } from "@/types/database.types";
import {
  AppHeader,
  Badge,
  Button,
  Card,
  DateTile,
  Notice,
  Page,
  Spinner,
  Tabs,
  api,
} from "@/components/ui";
import { SignOutButton } from "@/components/admin/SignOutButton";
import { EventOverview } from "@/components/admin/EventOverview";
import { EVENT_TYPE_LABELS, EventForm } from "@/components/admin/EventForm";
import { FeeEditor } from "@/components/admin/FeeEditor";
import { CsvUpload } from "@/components/admin/CsvUpload";
import { EditRegistrationSheet } from "@/components/admin/EditRegistrationSheet";
import { PeopleList } from "@/components/PeopleList";
import { DeskPinCard } from "@/components/admin/DeskPinCard";
import { NewAlumniList } from "@/components/admin/NewAlumniList";

type Tab = "overview" | "people" | "new" | "attendees" | "fees" | "settings";

const TABS: { id: Tab; label: string }[] = [
  { id: "overview", label: "Overview" },
  { id: "people", label: "People" },
  { id: "new", label: "New alumni" },
  { id: "attendees", label: "Attendees" },
  { id: "fees", label: "Fees" },
  { id: "settings", label: "Settings" },
];

function EventHero({
  event,
  publishedOther,
  onChange,
}: {
  event: Event;
  publishedOther: Event | null;
  onChange: (ev: Event) => void;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const setPublished = async (publish: boolean) => {
    if (
      publish &&
      publishedOther &&
      !confirm(`"${publishedOther.event_name}" is published now. Publishing this event will unpublish it. Continue?`)
    ) {
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const res = await api<{ data: Event }>(`/api/admin/events/${event.event_id}`, {
        method: "PATCH",
        json: { isActive: publish },
      });
      onChange(res.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="bg-white">
      <div className="max-w-5xl mx-auto px-4 pt-5 pb-4">
        <div className="flex items-start gap-4">
          <DateTile date={event.event_date} size="lg" />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              {event.is_active ? <Badge tone="green" dot>Published</Badge> : <Badge tone="amber" dot>Draft</Badge>}
              <span className="text-xs text-muted">{EVENT_TYPE_LABELS[event.event_type as keyof typeof EVENT_TYPE_LABELS] || ""}</span>
            </div>
            <h1 className="mt-1 text-xl sm:text-2xl font-semibold tracking-tight text-ink leading-tight">{event.event_name}</h1>
            <p className="mt-0.5 text-sm text-muted truncate">
              {[event.event_time, event.venue].filter(Boolean).join(" · ") || event.chapter_name}
            </p>
          </div>
        </div>

        <div className="mt-4 flex items-center gap-3 rounded-lg bg-canvas border border-line px-3.5 py-2.5">
          <p className="flex-1 text-sm text-muted">
            {event.is_active
              ? "Open for check-in. Desk volunteers see this event."
              : "Draft. Attendees and volunteers can't see it yet."}
          </p>
          {event.is_active ? (
            <Button size="sm" variant="secondary" onClick={() => setPublished(false)} loading={busy}>
              Unpublish
            </Button>
          ) : (
            <Button size="sm" onClick={() => setPublished(true)} loading={busy}>
              Publish
            </Button>
          )}
        </div>
        <DeskPinCard event={event} onChange={onChange} />
        {error && <Notice tone="error" className="mt-3">{error}</Notice>}
      </div>
    </div>
  );
}

export default function EventWorkspacePage() {
  const params = useParams<{ eventId: string }>();
  const router = useRouter();
  const eventId = Number(params.eventId);

  const [events, setEvents] = useState<Event[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>("overview");
  const [editing, setEditing] = useState<EventRegistration | null>(null);
  const [peopleKey, setPeopleKey] = useState(0);
  const [attendeeCount, setAttendeeCount] = useState<number | null>(null);

  const load = useCallback(() => {
    api<{ data: Event[] }>("/api/admin/events")
      .then((res) => setEvents(res.data))
      .catch((err) => setError(err.message));
  }, []);

  useEffect(load, [load]);

  const loadAttendeeCount = useCallback(() => {
    api<{ totalCount: number }>(`/api/admin/events/${eventId}/pre-registrations`)
      .then((res) => setAttendeeCount(res.totalCount))
      .catch(() => setAttendeeCount(null));
  }, [eventId]);

  useEffect(() => {
    if (tab === "attendees") loadAttendeeCount();
  }, [tab, loadAttendeeCount]);

  const event = events?.find((e) => e.event_id === eventId) || null;
  const publishedOther = events?.find((e) => e.is_active && e.event_id !== eventId) || null;

  const replaceEvent = (updated: Event) =>
    setEvents((list) =>
      (list || []).map((e) =>
        e.event_id === updated.event_id ? updated : updated.is_active ? { ...e, is_active: false } : e
      )
    );

  const deleteEvent = async () => {
    if (!event) return;
    const typed = prompt(
      `Deleting "${event.event_name}" also deletes its check-ins, attendee list and fees. This cannot be undone.\n\nType DELETE to confirm.`
    );
    if (typed !== "DELETE") return;
    try {
      await api(`/api/admin/events/${event.event_id}`, { method: "DELETE" });
      router.replace("/admin");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not delete the event.");
    }
  };

  const back = { href: "/admin", label: "Back to events" };

  if (!events && !error) {
    return (
      <>
        <AppHeader title="Event" back={back} wide />
        <Spinner />
      </>
    );
  }

  if (!event) {
    return (
      <>
        <AppHeader title="Event" back={back} wide />
        <Page wide>
          <Notice tone="error">{error || "This event does not exist or was deleted."}</Notice>
        </Page>
      </>
    );
  }

  return (
    <>
      <AppHeader wide back={back} title="Events" right={<SignOutButton />} />
      <EventHero event={event} publishedOther={publishedOther} onChange={replaceEvent} />
      <div className="sticky top-[59px] z-20">
        <Tabs wide tabs={TABS} value={tab} onChange={setTab} />
      </div>

      <Page wide>

        {tab === "overview" && <EventOverview eventId={event.event_id} />}

        {tab === "new" && (
          <NewAlumniList
            eventId={event.event_id}
            eventName={event.event_name}
            onSelect={setEditing}
            reloadKey={peopleKey}
          />
        )}

        {tab === "people" && (
          <PeopleList
            eventId={event.event_id}
            onSelect={setEditing}
            reloadKey={peopleKey}
            allowCheckIn={event.is_active}
          />
        )}

        {tab === "attendees" && (
          <Card title="Attendee list">
            <p className="text-sm text-muted">
              Upload the <span className="font-medium text-ink">event attendees</span> CSV exported
              from the association website. Uploading again updates existing rows and adds new ones.
              People are matched to the members list by email or mobile.
            </p>
            <p className="mt-3 text-sm text-ink">
              {attendeeCount === null ? "" : `${attendeeCount} people on the list.`}
            </p>
            <div className="mt-3">
              <CsvUpload
                endpoint={`/api/admin/events/${event.event_id}/pre-registrations`}
                buttonLabel="Upload attendees CSV"
                onDone={() => {
                  loadAttendeeCount();
                  setPeopleKey((k) => k + 1);
                }}
              />
            </div>
          </Card>
        )}

        {tab === "fees" && <FeeEditor eventId={event.event_id} />}

        {tab === "settings" && (
          <>
            <Card title="Event details">
              <EventForm event={event} submitLabel="Save changes" onSaved={replaceEvent} />
            </Card>
            <Card title="Delete event">
              <p className="text-sm text-muted mb-3">
                Removes the event with all its check-ins, attendee list and fees. Download the check-ins
                first if you need a record.
              </p>
              <Button variant="danger" onClick={deleteEvent}>
                Delete event
              </Button>
            </Card>
          </>
        )}
      </Page>

      <EditRegistrationSheet
        registration={editing}
        onClose={() => setEditing(null)}
        onSaved={() => {
          setEditing(null);
          setPeopleKey((k) => k + 1);
        }}
      />
    </>
  );
}
