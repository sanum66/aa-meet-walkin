"use client";

import React, { useState } from "react";
import { KeyRound } from "lucide-react";
import { Event } from "@/types/database.types";
import { Button, Input, Notice, api } from "@/components/ui";

const randomPin = () => String(Math.floor(100000 + Math.random() * 900000));

/**
 * Organizer control for the event's desk PIN. Volunteers sign in with it while
 * the event is published. Changing it signs out everyone using the old PIN.
 */
export function DeskPinCard({ event, onChange }: { event: Event; onChange: (ev: Event) => void }) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const migrationMissing = event.desk_pin === undefined;

  const save = async (pin: string) => {
    if (!/^[0-9]{4,8}$/.test(pin)) {
      setError("Use 4 to 8 digits.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const res = await api<{ data: Event }>(`/api/admin/events/${event.event_id}`, {
        method: "PATCH",
        json: { deskPin: pin },
      });
      onChange(res.data);
      setEditing(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save the PIN.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mt-3 rounded-lg border border-line px-3.5 py-3">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 shrink-0 rounded-lg bg-brand-50 flex items-center justify-center">
          <KeyRound className="w-4 h-4 text-brand-600" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-xs font-medium text-muted">Desk PIN for volunteers</div>
          {migrationMissing ? (
            <div className="text-sm text-ink">Server PIN (DESK_PIN setting)</div>
          ) : event.desk_pin ? (
            <div className="text-lg font-semibold font-mono tracking-[0.25em] text-ink">{event.desk_pin}</div>
          ) : (
            <div className="text-sm text-ink">Not set</div>
          )}
        </div>
        {!migrationMissing && !editing && (
          <Button
            size="sm"
            variant={event.desk_pin ? "secondary" : "primary"}
            onClick={() => {
              setValue(randomPin());
              setEditing(true);
              setError(null);
            }}
          >
            {event.desk_pin ? "Change" : "Set PIN"}
          </Button>
        )}
      </div>

      {editing && (
        <div className="mt-3 space-y-2">
          <div className="flex gap-2">
            <Input
              inputMode="numeric"
              aria-label="New desk PIN"
              maxLength={8}
              value={value}
              onChange={(e) => setValue(e.target.value.replace(/\D/g, "").slice(0, 8))}
              className="font-mono tracking-[0.25em] flex-1"
            />
            <Button variant="secondary" onClick={() => setValue(randomPin())}>
              New
            </Button>
          </div>
          <p className="text-xs text-muted">
            Share this PIN with the volunteers. Changing it signs out anyone using the old PIN.
          </p>
          <div className="flex gap-2">
            <Button size="sm" onClick={() => save(value)} loading={saving}>
              Save PIN
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setEditing(false)} disabled={saving}>
              Cancel
            </Button>
          </div>
        </div>
      )}

      {migrationMissing && (
        <p className="mt-2 text-xs text-muted">
          To set a PIN per event, run <span className="font-mono">003_event_desk_pin.sql</span> in Supabase.
        </p>
      )}
      {error && <Notice tone="error" className="mt-2">{error}</Notice>}
    </div>
  );
}
