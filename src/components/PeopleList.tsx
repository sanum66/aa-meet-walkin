"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ChevronRight, Search } from "lucide-react";
import { EventPreRegistration, EventRegistration } from "@/types/database.types";
import {
  Badge,
  Empty,
  Input,
  Notice,
  Segmented,
  Spinner,
  api,
  formatTime,
  inr,
  passNumber,
} from "@/components/ui";

type View = "in" | "waiting";

/**
 * Checked-in and not-yet-arrived lists for one event.
 * Used by the desk page and the organizer's event page.
 */
export function PeopleList({
  eventId,
  onSelect,
  reloadKey = 0,
  allowCheckIn = true,
}: {
  eventId: number;
  /** Organizers: tapping a checked-in person opens it for editing. */
  onSelect?: (reg: EventRegistration) => void;
  reloadKey?: number;
  /** Show "Check in" links (only valid for the published event). */
  allowCheckIn?: boolean;
}) {
  const [view, setView] = useState<View>("in");
  const [search, setSearch] = useState("");
  const [debounced, setDebounced] = useState("");
  const [checkedIn, setCheckedIn] = useState<EventRegistration[]>([]);
  const [waiting, setWaiting] = useState<EventPreRegistration[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(search.trim()), 300);
    return () => clearTimeout(t);
  }, [search]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const q = debounced ? `search=${encodeURIComponent(debounced)}` : "";
      const [regs, pre] = await Promise.all([
        api<{ data: EventRegistration[] }>(`/api/admin/registrations?eventId=${eventId}${q ? `&${q}` : ""}`),
        api<{ data: EventPreRegistration[] }>(`/api/admin/events/${eventId}/pre-registrations?${q}`),
      ]);
      const arrived = new Set(regs.data.map((r) => r.email.toLowerCase()));
      setCheckedIn(regs.data);
      setWaiting(
        pre.data.filter((p) => p.response_status !== "NOT_GOING" && !arrived.has(p.email.toLowerCase()))
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load the list.");
    } finally {
      setLoading(false);
    }
  }, [eventId, debounced]);

  useEffect(() => {
    load();
  }, [load, reloadKey]);

  const rowClass = "w-full text-left flex gap-3 px-4 py-3";

  return (
    <div className="space-y-3">
      <div className="relative">
        <Search className="w-4 h-4 text-muted/70 absolute left-3 top-3.5 pointer-events-none" />
        <Input
          type="search"
          aria-label="Search people"
          placeholder="Search by name, email or mobile"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      <Segmented
        label="List"
        value={view}
        onChange={setView}
        options={[
          { value: "in", label: `Checked in (${checkedIn.length})` },
          { value: "waiting", label: `Not arrived (${waiting.length})` },
        ]}
      />

      {error && <Notice tone="error">{error}</Notice>}

      {loading ? (
        <Spinner />
      ) : view === "in" ? (
        checkedIn.length === 0 ? (
          <Empty>{debounced ? "No matches." : "Nobody has checked in yet."}</Empty>
        ) : (
          <ul className="bg-white rounded-lg border border-line divide-y divide-line overflow-hidden">
            {checkedIn.map((r) => {
              const guests = r.accompanying_family_count + r.accompanying_alumni_count;
              const body = (
                <>
                  <div className="min-w-0 flex-1">
                    <div className="font-medium text-ink truncate">{r.full_name}</div>
                    <div className="text-sm text-muted truncate">
                      {[r.graduating_year, r.stream, passNumber(r.registration_id)].filter(Boolean).join(" · ")}
                    </div>
                    <div className="mt-1.5 flex flex-wrap gap-1.5">
                      {r.payment_required ? (
                        <Badge>
                          {inr(r.total_amount)} {r.payment_mode === "ONLINE" ? `UPI ${r.utr_last4 ?? ""}` : "cash"}
                        </Badge>
                      ) : (
                        <Badge>Free entry</Badge>
                      )}
                      {guests > 0 && <Badge>+{guests} family</Badge>}
                      {!r.payment_confirmed && <Badge tone="red">Payment not confirmed</Badge>}
                    </div>
                  </div>
                  <div className="text-xs text-muted shrink-0 text-right">
                    {formatTime(r.checked_in_at)}
                    {onSelect && <ChevronRight className="w-4 h-4 ml-auto mt-1 text-muted/70" />}
                  </div>
                </>
              );
              return (
                <li key={r.registration_id}>
                  {onSelect ? (
                    <button type="button" onClick={() => onSelect(r)} className={`${rowClass} hover:bg-canvas`}>
                      {body}
                    </button>
                  ) : (
                    <div className={rowClass}>{body}</div>
                  )}
                </li>
              );
            })}
          </ul>
        )
      ) : waiting.length === 0 ? (
        <Empty>{debounced ? "No matches." : "Everyone on the attendee list has arrived."}</Empty>
      ) : (
        <ul className="bg-white rounded-lg border border-line divide-y divide-line overflow-hidden">
          {waiting.map((p) => (
            <li key={p.pre_registration_id} className="flex items-center gap-3 px-4 py-3">
              <div className="min-w-0 flex-1">
                <div className="font-medium text-ink truncate">{p.full_name}</div>
                <div className="text-sm text-muted truncate">
                  {[p.graduating_year, p.stream, p.mobile].filter(Boolean).join(" · ")}
                  {p.response_status === "MAY_BE" ? " · maybe" : ""}
                </div>
              </div>
              {allowCheckIn && (
                <Link
                  href={`/register?q=${encodeURIComponent(p.email)}`}
                  className="shrink-0 h-9 px-3 rounded-lg border border-line text-sm font-medium text-ink hover:bg-canvas flex items-center"
                >
                  Check in
                </Link>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
