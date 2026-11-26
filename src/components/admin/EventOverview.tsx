"use client";

import React, { useEffect, useState } from "react";
import { Download, IndianRupee, UserCheck, UserPlus, Users } from "lucide-react";
import { CategoryCount, EventAnalyticsMetrics } from "@/types/database.types";
import { Card, Empty, Notice, Spinner, Stat, api, inr } from "@/components/ui";

interface DashboardData {
  metrics: EventAnalyticsMetrics;
  batchAnalytics: CategoryCount[];
  streamAnalytics: CategoryCount[];
  foodAnalytics: CategoryCount[];
}

function Breakdown({ rows, money }: { rows: CategoryCount[]; money?: boolean }) {
  if (rows.length === 0) return <Empty>No check-ins yet.</Empty>;
  const max = Math.max(...rows.map((r) => r.count), 1);
  return (
    <table className="w-full text-sm">
      <tbody>
        {rows.map((r) => (
          <tr key={r.category} className="border-t border-line first:border-0">
            <td className="py-2 pr-3 text-ink whitespace-nowrap">{r.category}</td>
            <td className="py-2 w-full">
              <div className="h-2 rounded-full bg-brand-50">
                <div className="h-full rounded-full bg-brand-500" style={{ width: `${(r.count / max) * 100}%` }} />
              </div>
            </td>
            <td className="py-2 pl-3 text-right tabular-nums text-ink/80 whitespace-nowrap">
              {r.count}
              {money && r.amount ? <span className="text-muted"> · {inr(r.amount)}</span> : null}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

const downloadClass =
  "h-11 px-4 rounded-lg border border-line bg-white text-[15px] font-semibold text-ink hover:bg-canvas inline-flex items-center justify-center gap-2 shadow-[0_1px_2px_rgba(16,24,40,0.04)]";

export function EventOverview({ eventId }: { eventId: number }) {
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    api<{ data: DashboardData }>(`/api/admin/dashboard?eventId=${eventId}`)
      .then((res) => !cancelled && setData(res.data))
      .catch((err) => !cancelled && setError(err.message));
    return () => {
      cancelled = true;
    };
  }, [eventId]);

  if (error) return <Notice tone="error">{error}</Notice>;
  if (!data) return <Spinner />;

  const m = data.metrics;
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Stat
          icon={UserCheck}
          label="Checked in"
          value={m.total_registrations}
          note={m.pre_registrations_imported ? `${m.pre_registered_checked_in} of ${m.pre_registrations_imported} on the attendee list` : undefined}
        />
        <Stat icon={Users} label="Total people" value={m.total_headcount} note="Checked in, plus family and guests" />
        <Stat icon={IndianRupee} label="Collected" value={inr(m.total_collected)} />
        <Stat icon={UserPlus} label="Walk-ins" value={m.on_spot_registrations} note="Not on the attendee list" />
      </div>

      <Card title="Payments">
        <dl className="grid grid-cols-2 gap-y-2 text-sm">
          <dt className="text-muted">UPI</dt>
          <dd className="text-right tabular-nums">{inr(m.online_collected)}</dd>
          <dt className="text-muted">Cash</dt>
          <dd className="text-right tabular-nums">{inr(m.cash_collected)}</dd>
          <dt className="text-muted pt-2 border-t border-line">Entry fees</dt>
          <dd className="text-right tabular-nums pt-2 border-t border-line">{inr(m.total_registration_fee)}</dd>
          <dt className="text-muted">Contributions</dt>
          <dd className="text-right tabular-nums">{inr(m.total_voluntary_contribution)}</dd>
          <dt className="font-medium pt-2 border-t border-line">Total</dt>
          <dd className="text-right font-medium tabular-nums pt-2 border-t border-line">{inr(m.total_collected)}</dd>
        </dl>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card title="Food">
          <Breakdown rows={data.foodAnalytics} />
        </Card>
        <Card title="By batch">
          <Breakdown rows={data.batchAnalytics} money />
        </Card>
        <Card title="By branch">
          <Breakdown rows={data.streamAnalytics} />
        </Card>
      </div>

      <Card title="Download">
        <p className="text-sm text-muted mb-3">CSV files open in Excel or Google Sheets.</p>
        <div className="flex flex-col sm:flex-row gap-2">
          <a className={downloadClass} href={`/api/admin/events/${eventId}/export?type=registrations`}>
            <Download className="w-4 h-4" /> Check-ins
          </a>
          <a className={downloadClass} href={`/api/admin/events/${eventId}/export?type=pre-registrations`}>
            <Download className="w-4 h-4" /> Attendee list
          </a>
        </div>
      </Card>
    </div>
  );
}
