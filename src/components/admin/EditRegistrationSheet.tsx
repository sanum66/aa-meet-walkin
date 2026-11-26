"use client";

import React, { useEffect, useState } from "react";
import { Trash2 } from "lucide-react";
import { EventRegistration } from "@/types/database.types";
import { BATCH_YEARS, FOOD_PREFERENCES, PaymentMode, STREAM_TYPES } from "@/server/constants";
import {
  Button,
  Field,
  Input,
  Notice,
  Segmented,
  Select,
  Sheet,
  Stepper,
  api,
  inr,
  passNumber,
} from "@/components/ui";

export function EditRegistrationSheet({
  registration,
  onClose,
  onSaved,
}: {
  registration: EventRegistration | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [draft, setDraft] = useState<EventRegistration | null>(registration);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setDraft(registration);
    setError(null);
  }, [registration]);

  if (!draft) return null;
  const set = <K extends keyof EventRegistration>(k: K, v: EventRegistration[K]) =>
    setDraft((d) => (d ? { ...d, [k]: v } : d));
  const total = (Number(draft.registration_fee) || 0) + (Number(draft.voluntary_contribution) || 0);

  const save = async () => {
    setSaving(true);
    setError(null);
    try {
      await api(`/api/admin/registrations/${draft.registration_id}`, {
        method: "PATCH",
        json: {
          fullName: draft.full_name,
          email: draft.email,
          mobile: draft.mobile,
          graduatingYear: draft.graduating_year,
          stream: draft.stream,
          foodPreference: draft.food_preference,
          accompanyingFamilyCount: draft.accompanying_family_count,
          registrationFee: Number(draft.registration_fee) || 0,
          voluntaryContribution: Number(draft.voluntary_contribution) || 0,
          paymentMode: total > 0 ? draft.payment_mode || "CASH" : null,
          utrLast4: draft.payment_mode === "ONLINE" ? draft.utr_last4 || null : null,
          paymentConfirmed: draft.payment_confirmed,
        },
      });
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save.");
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    if (!confirm(`Remove ${draft.full_name}'s check-in? This cannot be undone.`)) return;
    setSaving(true);
    try {
      await api(`/api/admin/registrations/${draft.registration_id}`, { method: "DELETE" });
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not delete.");
      setSaving(false);
    }
  };

  return (
    <Sheet
      open={Boolean(registration)}
      onClose={onClose}
      title={`${passNumber(draft.registration_id)} · ${draft.full_name}`}
      footer={
        <div className="flex gap-3">
          <Button variant="danger" onClick={remove} disabled={saving} aria-label="Delete check-in">
            <Trash2 className="w-5 h-5" />
          </Button>
          <Button className="flex-1" onClick={save} loading={saving}>
            Save changes
          </Button>
        </div>
      }
    >
      <Field label="Name">
        <Input value={draft.full_name} onChange={(e) => set("full_name", e.target.value)} />
      </Field>
      <Field label="Mobile">
        <Input type="tel" value={draft.mobile || ""} onChange={(e) => set("mobile", e.target.value)} />
      </Field>
      <Field label="Email">
        <Input type="email" autoCapitalize="none" value={draft.email} onChange={(e) => set("email", e.target.value)} />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Batch">
          <Select value={draft.graduating_year ?? ""} onChange={(e) => set("graduating_year", Number(e.target.value))}>
            {BATCH_YEARS.map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </Select>
        </Field>
        <Field label="Branch">
          <Select value={draft.stream || ""} onChange={(e) => set("stream", e.target.value)}>
            <option value="">—</option>
            {STREAM_TYPES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </Select>
        </Field>
      </div>
      <Field label="Food">
        <Select value={draft.food_preference || ""} onChange={(e) => set("food_preference", e.target.value)}>
          {FOOD_PREFERENCES.map((f) => (
            <option key={f} value={f}>{f}</option>
          ))}
        </Select>
      </Field>
      <Field group label="Family members">
        <div className="max-w-48">
          <Stepper label="family members" value={draft.accompanying_family_count} onChange={(v) => set("accompanying_family_count", v)} />
        </div>
      </Field>

      <div className="pt-2 border-t border-line space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Entry fee (₹)">
            <Input type="number" inputMode="numeric" min={0} value={draft.registration_fee} onChange={(e) => set("registration_fee", Number(e.target.value) || 0)} />
          </Field>
          <Field label="Contribution (₹)">
            <Input type="number" inputMode="numeric" min={0} value={draft.voluntary_contribution} onChange={(e) => set("voluntary_contribution", Number(e.target.value) || 0)} />
          </Field>
        </div>
        <div className="flex justify-between font-semibold">
          <span>Total</span>
          <span>{total > 0 ? inr(total) : "Free"}</span>
        </div>
        {total > 0 && (
          <>
            <Segmented<PaymentMode>
              value={draft.payment_mode || "CASH"}
              onChange={(v) => set("payment_mode", v)}
              options={[
                { value: "ONLINE", label: "UPI" },
                { value: "CASH", label: "Cash" },
              ]}
            />
            {draft.payment_mode === "ONLINE" && (
              <Field label="UPI reference (last 4)">
                <Input
                  inputMode="numeric"
                  maxLength={4}
                  value={draft.utr_last4 || ""}
                  onChange={(e) => set("utr_last4", e.target.value.replace(/\D/g, "").slice(0, 4))}
                />
              </Field>
            )}
            <label className="flex items-center gap-3 h-12">
              <input
                type="checkbox"
                checked={draft.payment_confirmed}
                onChange={(e) => set("payment_confirmed", e.target.checked)}
                className="w-5 h-5 accent-brand-600"
              />
              <span className="text-ink">Payment received</span>
            </label>
          </>
        )}
      </div>

      {error && <Notice tone="error">{error}</Notice>}
    </Sheet>
  );
}
