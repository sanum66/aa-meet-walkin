"use client";

import React from "react";
import { PaymentMode } from "@/server/constants";
import { Badge, Card, inr } from "@/components/ui";

export interface ReviewData {
  fullName: string;
  mobile: string;
  email: string;
  graduatingYear: number;
  course: string;
  stream: string;
  foodPreference: string;
  familyCount: number;
  fee: number;
  contribution: number;
  paymentMode: PaymentMode;
  utrLast4: string;
}

/** Read-only summary shown before the check-in is submitted. */
export function ReviewCard({ data, kind }: { data: ReviewData; kind: "attendee" | "member" | "new" }) {
  const total = data.fee + data.contribution;
  const rows: [string, React.ReactNode][] = [
    ["Name", data.fullName],
    ["Mobile", data.mobile],
    ["Email", data.email],
    ["Batch", `${data.graduatingYear} · ${data.course} · ${data.stream}`],
    ["Food", data.foodPreference],
    ["Family members", data.familyCount > 0 ? data.familyCount : "None"],
  ];
  const payRows: [string, React.ReactNode][] = [
    [`Entry fee (${data.graduatingYear} batch)`, data.fee > 0 ? inr(data.fee) : "No fee"],
    ["Contribution", inr(data.contribution)],
  ];

  return (
    <div className="space-y-4">
      <Card
        title="Check the details"
        description="Confirm with the person before submitting."
        action={
          kind === "new" ? (
            <Badge tone="amber" dot>New alumnus</Badge>
          ) : kind === "member" ? (
            <Badge tone="blue" dot>On alumni list</Badge>
          ) : (
            <Badge tone="green" dot>Registered</Badge>
          )
        }
      >
        <dl className="divide-y divide-line">
          {rows.map(([k, v]) => (
            <div key={k} className="flex justify-between gap-4 py-2.5 text-sm">
              <dt className="text-muted shrink-0">{k}</dt>
              <dd className="text-ink text-right break-all">{v}</dd>
            </div>
          ))}
        </dl>
      </Card>

      <Card title="Payment">
        <dl className="text-sm space-y-2">
          {payRows.map(([k, v]) => (
            <div key={k} className="flex justify-between gap-4">
              <dt className="text-muted">{k}</dt>
              <dd className="text-ink tabular-nums">{v}</dd>
            </div>
          ))}
          <div className="flex justify-between gap-4 pt-2 border-t border-line text-base">
            <dt className="font-semibold text-ink">Total</dt>
            <dd className="font-semibold text-ink tabular-nums">{inr(total)}</dd>
          </div>
          {total > 0 && (
            <div className="flex justify-between gap-4">
              <dt className="text-muted">Paid by</dt>
              <dd className="text-ink">
                {data.paymentMode === "ONLINE" ? `UPI, reference ending ${data.utrLast4}` : "Cash"}
              </dd>
            </div>
          )}
        </dl>
      </Card>
    </div>
  );
}
