"use client";

/**
 * Entry fee rules for an event.
 *
 * Each rule: start batch year, end batch year, fee, and the member types it
 * applies to (multi-select). Saved as one row per member type in
 * event_fee_configurations.
 */
import React, { useEffect, useState } from "react";
import { Check, Plus, Trash2 } from "lucide-react";
import { EventFeeConfiguration } from "@/types/database.types";
import {
  FIRST_BATCH_YEAR,
  LATEST_BATCH_YEAR,
  REGISTRATION_MEMBERSHIP_TYPES,
  RegistrationMembershipType,
} from "@/server/constants";
import { Button, Card, Input, Notice, Spinner, api, cx, inr } from "@/components/ui";

type Rule = {
  key: number;
  start: number;
  end: number;
  fee: number;
  types: RegistrationMembershipType[];
};

const TYPE_LABELS: Record<RegistrationMembershipType, string> = {
  PATRON_MEMBER: "Patron",
  LIFE_MEMBER: "Life",
  REGISTERED_MEMBER: "Registered",
  UNREGISTERED_MEMBER: "Not a member",
};

let keySeq = 1;

/** Stored rows are per member type; show one rule per (start, end, fee). */
function rulesFromRows(rows: EventFeeConfiguration[]): Rule[] {
  const rules: Rule[] = [];
  for (const r of rows.filter((x) => x.is_active)) {
    const fee = Number(r.registration_fee) || 0;
    const existing = rules.find((x) => x.start === r.min_graduating_year && x.end === r.max_graduating_year && x.fee === fee);
    if (existing) {
      if (!existing.types.includes(r.membership_type)) existing.types.push(r.membership_type);
    } else {
      rules.push({ key: keySeq++, start: r.min_graduating_year, end: r.max_graduating_year, fee, types: [r.membership_type] });
    }
  }
  const order = REGISTRATION_MEMBERSHIP_TYPES as readonly string[];
  rules.forEach((r) => r.types.sort((a, b) => order.indexOf(a) - order.indexOf(b)));
  return rules.sort((a, b) => a.start - b.start || order.indexOf(a.types[0]) - order.indexOf(b.types[0]));
}

/** Returns a message describing the first problem, or null when valid. */
function validate(rules: Rule[]): string | null {
  for (const [i, r] of rules.entries()) {
    const n = `Rule ${i + 1}`;
    if (!r.start || !r.end) return `${n}: enter both the start and end year.`;
    if (r.start < 1950 || r.end > 2100) return `${n}: years must be between 1950 and 2100.`;
    if (r.start > r.end) return `${n}: the start year must not be after the end year.`;
    if (r.types.length === 0) return `${n}: select at least one member type.`;
  }
  for (let i = 0; i < rules.length; i++) {
    for (let j = i + 1; j < rules.length; j++) {
      const a = rules[i];
      const b = rules[j];
      const shared = a.types.filter((t) => b.types.includes(t));
      if (shared.length && a.start <= b.end && b.start <= a.end) {
        return `Rules ${i + 1} and ${j + 1} overlap for ${shared.map((t) => TYPE_LABELS[t]).join(", ")} (batch ${Math.max(a.start, b.start)}–${Math.min(a.end, b.end)}).`;
      }
    }
  }
  return null;
}

function TypeChips({
  selected,
  onChange,
}: {
  selected: RegistrationMembershipType[];
  onChange: (types: RegistrationMembershipType[]) => void;
}) {
  const all = selected.length === REGISTRATION_MEMBERSHIP_TYPES.length;
  const chip = (on: boolean) =>
    cx(
      "h-9 pl-2.5 pr-3 rounded-full border text-sm font-medium inline-flex items-center gap-1.5 transition-colors",
      on ? "border-brand-500 bg-brand-50 text-brand-700" : "border-line bg-white text-muted hover:text-ink"
    );
  const box = (on: boolean) =>
    cx("w-4 h-4 rounded flex items-center justify-center border", on ? "bg-brand-600 border-brand-600 text-white" : "border-line bg-white");

  return (
    <div className="flex flex-wrap gap-2" role="group" aria-label="Member types">
      <button
        type="button"
        role="checkbox"
        aria-checked={all}
        onClick={() => onChange(all ? [] : [...REGISTRATION_MEMBERSHIP_TYPES])}
        className={chip(all)}
      >
        <span className={box(all)}>{all && <Check className="w-3 h-3" />}</span>
        All
      </button>
      {REGISTRATION_MEMBERSHIP_TYPES.map((t) => {
        const on = selected.includes(t);
        return (
          <button
            key={t}
            type="button"
            role="checkbox"
            aria-checked={on}
            onClick={() => onChange(on ? selected.filter((x) => x !== t) : [...selected, t])}
            className={chip(on)}
          >
            <span className={box(on)}>{on && <Check className="w-3 h-3" />}</span>
            {TYPE_LABELS[t]}
          </button>
        );
      })}
    </div>
  );
}

export function FeeEditor({ eventId }: { eventId: number }) {
  const [rules, setRules] = useState<Rule[] | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    let cancelled = false;
    api<{ data: EventFeeConfiguration[] }>(`/api/admin/events/${eventId}/fees`)
      .then((res) => !cancelled && setRules(rulesFromRows(res.data)))
      .catch((err) => !cancelled && setError(err.message));
    return () => {
      cancelled = true;
    };
  }, [eventId]);

  const update = (key: number, patch: Partial<Rule>) => {
    setSaved(false);
    setError(null);
    setRules((rs) => rs && rs.map((r) => (r.key === key ? { ...r, ...patch } : r)));
  };

  const addRule = () => {
    setSaved(false);
    setError(null);
    setRules((rs) => {
      const list = rs || [];
      const lastEnd = list.reduce((m, r) => Math.max(m, r.end || 0), FIRST_BATCH_YEAR - 1);
      // Continue after the last rule; leave the years empty when every batch is already covered
      const covered = lastEnd >= LATEST_BATCH_YEAR;
      return [
        ...list,
        {
          key: Math.max(keySeq++, ...list.map((r) => r.key + 1)),
          start: covered ? 0 : lastEnd + 1,
          end: covered ? 0 : LATEST_BATCH_YEAR,
          fee: 0,
          types: [...REGISTRATION_MEMBERSHIP_TYPES],
        },
      ];
    });
  };

  const save = async () => {
    if (!rules) return;
    const problem = validate(rules);
    if (problem) {
      setError(problem);
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const payload = rules.flatMap((r, i) =>
        r.types.map((membershipType) => ({
          minGraduatingYear: r.start,
          maxGraduatingYear: r.end,
          membershipType,
          registrationFee: Number(r.fee) || 0,
          displayOrder: i + 1,
          isActive: true,
        }))
      );
      const res = await api<{ data: EventFeeConfiguration[] }>(`/api/admin/events/${eventId}/fees`, {
        method: "PUT",
        json: { rules: payload },
      });
      setRules(rulesFromRows(res.data));
      setSaved(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save fees.");
    } finally {
      setSaving(false);
    }
  };

  if (!rules) return error ? <Notice tone="error">{error}</Notice> : <Spinner />;

  return (
    <Card
      title="Fee rules"
      description="Each rule sets the entry fee for a range of batch years and the member types you select. Use 0 for free entry."
    >
      {rules.length === 0 ? (
        <Notice tone="info">No rules yet. Add a rule to set the entry fee.</Notice>
      ) : (
        <ol className="space-y-3">
          {rules.map((r, i) => (
            <li key={r.key} className="rounded-lg border border-line p-3 sm:p-4">
              <div className="flex items-center justify-between gap-2 mb-3">
                <div className="text-sm font-semibold text-ink">
                  Rule {i + 1}
                  <span className="ml-2 font-normal text-muted">
                    {r.start && r.end ? `Batch ${r.start}–${r.end}` : ""} · {r.fee > 0 ? inr(r.fee) : "Free"}
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  aria-label={`Delete rule ${i + 1}`}
                  className="text-muted px-2"
                  onClick={() => {
                    setSaved(false);
                    setRules((rs) => rs && rs.filter((x) => x.key !== r.key));
                  }}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <label className="block">
                  <span className="block text-xs font-medium text-muted mb-1">Start year</span>
                  <Input type="number" inputMode="numeric" value={r.start || ""} onChange={(e) => update(r.key, { start: Number(e.target.value) })} />
                </label>
                <label className="block">
                  <span className="block text-xs font-medium text-muted mb-1">End year</span>
                  <Input type="number" inputMode="numeric" value={r.end || ""} onChange={(e) => update(r.key, { end: Number(e.target.value) })} />
                </label>
                <label className="block">
                  <span className="block text-xs font-medium text-muted mb-1">Fee (₹)</span>
                  <Input
                    type="number"
                    inputMode="numeric"
                    min={0}
                    value={r.fee}
                    onChange={(e) => update(r.key, { fee: Math.max(0, Number(e.target.value) || 0) })}
                  />
                </label>
              </div>

              <div className="mt-3">
                <span className="block text-xs font-medium text-muted mb-1.5">Member types</span>
                <TypeChips selected={r.types} onChange={(types) => update(r.key, { types })} />
              </div>
            </li>
          ))}
        </ol>
      )}

      <Button variant="secondary" className="mt-3 w-full sm:w-auto" onClick={addRule}>
        <Plus className="w-4 h-4" /> Add rule
      </Button>

      <p className="mt-4 text-xs text-muted">
        A batch or member type not covered by any rule uses the standard fee (₹500 up to 2000, ₹400 for 2001–2010,
        ₹300 for 2011–2020, free from 2021).
      </p>

      <div className="mt-4 pt-4 border-t border-line space-y-3">
        {error && <Notice tone="error">{error}</Notice>}
        {saved && <Notice tone="success">Fee rules saved.</Notice>}
        <Button onClick={save} loading={saving} className="w-full sm:w-auto">
          Save fee rules
        </Button>
      </div>
    </Card>
  );
}
