"use client";

import React, { useState } from "react";
import { Event } from "@/types/database.types";
import { EVENT_TYPES } from "@/server/constants";
import { Button, Field, Input, Notice, Select, Textarea, api } from "@/components/ui";

export const EVENT_TYPE_LABELS: Record<(typeof EVENT_TYPES)[number], string> = {
  CHAPTER_EVENT: "Chapter meet",
  ANNUAL_MEET: "Annual meet",
  SPECIAL_EVENT: "Special event",
};

interface Draft {
  eventName: string;
  eventType: (typeof EVENT_TYPES)[number];
  chapterName: string;
  eventDate: string;
  eventTime: string;
  venue: string;
  description: string;
}

/** Create (no `event`) or edit an event's details. */
export function EventForm({
  event,
  onSaved,
  submitLabel,
}: {
  event?: Event;
  onSaved: (event: Event) => void;
  submitLabel: string;
}) {
  const [draft, setDraft] = useState<Draft>({
    eventName: event?.event_name ?? "",
    eventType: (event?.event_type as Draft["eventType"]) ?? "CHAPTER_EVENT",
    chapterName: event?.chapter_name ?? "",
    eventDate: event?.event_date ?? "",
    eventTime: event?.event_time ?? "",
    venue: event?.venue ?? "",
    description: event?.description ?? "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => {
    setSaved(false);
    setDraft((d) => ({ ...d, [k]: v }));
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const body = {
        ...draft,
        venue: draft.venue.trim() || null,
        eventTime: draft.eventTime.trim() || null,
        description: draft.description.trim() || null,
      };
      const res = event
        ? await api<{ data: Event }>(`/api/admin/events/${event.event_id}`, { method: "PATCH", json: body })
        : await api<{ data: Event }>("/api/admin/events", {
            method: "POST",
            json: { ...body, isActive: false },
          });
      setSaved(true);
      onSaved(res.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <Field label="Event name">
        <Input required minLength={3} value={draft.eventName} onChange={(e) => set("eventName", e.target.value)} />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Type">
          <Select value={draft.eventType} onChange={(e) => set("eventType", e.target.value as Draft["eventType"])}>
            {EVENT_TYPES.map((t) => (
              <option key={t} value={t}>{EVENT_TYPE_LABELS[t]}</option>
            ))}
          </Select>
        </Field>
        <Field label="Chapter">
          <Input required value={draft.chapterName} onChange={(e) => set("chapterName", e.target.value)} />
        </Field>
        <Field label="Date">
          <Input required type="date" value={draft.eventDate} onChange={(e) => set("eventDate", e.target.value)} />
        </Field>
        <Field label="Time" hint="Optional">
          <Input placeholder="9:30 am to 5 pm" value={draft.eventTime} onChange={(e) => set("eventTime", e.target.value)} />
        </Field>
      </div>
      <Field label="Venue">
        <Input value={draft.venue} onChange={(e) => set("venue", e.target.value)} />
      </Field>
      <Field label="Description" hint="Optional. Shown on the public page.">
        <Textarea rows={2} value={draft.description} onChange={(e) => set("description", e.target.value)} />
      </Field>

      {error && <Notice tone="error">{error}</Notice>}
      {saved && event && <Notice tone="success">Saved.</Notice>}

      <Button type="submit" loading={saving} className="w-full sm:w-auto">
        {submitLabel}
      </Button>
    </form>
  );
}
