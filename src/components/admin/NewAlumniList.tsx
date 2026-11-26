"use client";

import React, { useEffect, useState } from "react";
import { ChevronRight, Download, UserPlus } from "lucide-react";
import { EventRegistration } from "@/types/database.types";
import { toCsv } from "@/server/utils/csvExport";
import { Badge, Button, Card, Empty, Notice, Spinner, api, formatTime, inr, passNumber } from "@/components/ui";

/**
 * Alumni added at the desk for this event: not on the attendee list and not
 * on the association members list. Useful for updating the members list later.
 */
export function NewAlumniList({
  eventId,
  eventName,
  onSelect,
  reloadKey = 0,
}: {
  eventId: number;
  eventName: string;
  onSelect: (reg: EventRegistration) => void;
  reloadKey?: number;
}) {
  const [rows, setRows] = useState<EventRegistration[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    api<{ data: EventRegistration[] }>(`/api/admin/registrations?eventId=${eventId}`)
      .then((res) => {
        if (cancelled) return;
        setRows(res.data.filter((r) => !r.recognized_member && r.registration_source === "ON_SPOT"));
      })
      .catch((err) => !cancelled && setError(err.message));
    return () => {
      cancelled = true;
    };
  }, [eventId, reloadKey]);

  const download = () => {
    if (!rows) return;
    const cols: [string, (r: EventRegistration) => unknown][] = [
      ["Name", (r) => r.full_name],
      ["Email", (r) => r.email],
      ["Mobile", (r) => r.mobile],
      ["Batch", (r) => r.graduating_year],
      ["Course", (r) => r.course],
      ["Branch", (r) => r.stream],
      ["Pass", (r) => passNumber(r.registration_id)],
      ["Checked in", (r) => r.checked_in_at],
    ];
    const csv = toCsv(cols.map(([header, value]) => ({ header, value: value as (row: never) => unknown })), rows);
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `${eventName.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}-new-alumni.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (error) return <Notice tone="error">{error}</Notice>;
  if (!rows) return <Spinner />;

  return (
    <Card
      padded={false}
      title={`New alumni (${rows.length})`}
      description="Checked in at the desk but not on the alumni list. Add them to the association website later."
      action={
        rows.length > 0 ? (
          <Button size="sm" variant="secondary" onClick={download}>
            <Download className="w-4 h-4" /> CSV
          </Button>
        ) : undefined
      }
    >
      {rows.length === 0 ? (
        <Empty icon={UserPlus} title="No new alumni yet">
          People added with &ldquo;Add new&rdquo; at the desk appear here.
        </Empty>
      ) : (
        <ul className="divide-y divide-line border-t border-line">
          {rows.map((r) => (
            <li key={r.registration_id}>
              <button
                type="button"
                onClick={() => onSelect(r)}
                className="w-full text-left flex items-center gap-3 px-4 sm:px-5 py-3 hover:bg-canvas"
              >
                <div className="min-w-0 flex-1">
                  <div className="font-medium text-ink truncate">{r.full_name}</div>
                  <div className="text-sm text-muted truncate">
                    {[r.graduating_year, r.course, r.stream].filter(Boolean).join(" · ")}
                  </div>
                  <div className="text-sm text-muted truncate">
                    {[r.mobile, r.email].filter(Boolean).join(" · ")}
                  </div>
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    <Badge>{passNumber(r.registration_id)}</Badge>
                    <Badge>{r.payment_required ? inr(r.total_amount) : "No fee"}</Badge>
                  </div>
                </div>
                <div className="text-xs text-muted text-right shrink-0">
                  {formatTime(r.checked_in_at)}
                  <ChevronRight className="w-4 h-4 ml-auto mt-1 text-muted/60" />
                </div>
              </button>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
