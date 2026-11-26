"use client";

import React from "react";
import { Banknote, QrCode } from "lucide-react";
import { PaymentMode } from "@/server/constants";
import { Card, Field, Input, Notice, cx, inr } from "@/components/ui";

interface PaymentCalculatorProps {
  graduatingYear: number;
  registrationFee: number;
  voluntaryContribution: number;
  paymentMode: PaymentMode;
  utrLast4: string;
  onContributionChange: (amount: number) => void;
  onPaymentModeChange: (mode: PaymentMode) => void;
  onUtrChange: (utr: string) => void;
}

const QUICK_AMOUNTS = [0, 100, 500, 1000];

function MethodOption({
  selected,
  onSelect,
  icon: Icon,
  title,
  text,
}: {
  selected: boolean;
  onSelect: () => void;
  icon: React.ElementType;
  title: string;
  text: string;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={onSelect}
      className={cx(
        "flex items-start gap-3 p-3.5 rounded-lg border text-left transition-colors",
        selected ? "border-brand-500 bg-brand-50 ring-4 ring-brand-100" : "border-line bg-white hover:bg-canvas"
      )}
    >
      <Icon className={cx("w-5 h-5 shrink-0 mt-0.5", selected ? "text-brand-600" : "text-muted")} />
      <span>
        <span className="block font-semibold text-ink">{title}</span>
        <span className="block text-sm text-muted">{text}</span>
      </span>
    </button>
  );
}

export function PaymentCalculator({
  graduatingYear,
  registrationFee,
  voluntaryContribution,
  paymentMode,
  utrLast4,
  onContributionChange,
  onPaymentModeChange,
  onUtrChange,
}: PaymentCalculatorProps) {
  const total = registrationFee + voluntaryContribution;

  return (
    <Card title="Payment" description={`Entry fee is set by batch year.`}>
      <div className="space-y-5">
        <Field group label="Contribution (optional)" hint="Supports scholarships and association activities.">
          <div className="grid grid-cols-4 gap-2 mb-2">
            {QUICK_AMOUNTS.map((amt) => (
              <button
                key={amt}
                type="button"
                aria-pressed={voluntaryContribution === amt}
                onClick={() => onContributionChange(amt)}
                className={cx(
                  "h-11 rounded-lg border text-sm font-medium transition-colors",
                  voluntaryContribution === amt
                    ? "border-brand-500 bg-brand-50 text-brand-700 ring-4 ring-brand-100"
                    : "border-line bg-white text-ink hover:bg-canvas"
                )}
              >
                {amt === 0 ? "None" : inr(amt)}
              </button>
            ))}
          </div>
          <Input
            type="number"
            inputMode="numeric"
            min={0}
            step={50}
            aria-label="Other contribution amount"
            placeholder="Other amount (₹)"
            value={voluntaryContribution === 0 || QUICK_AMOUNTS.includes(voluntaryContribution) ? "" : voluntaryContribution}
            onChange={(e) => {
              const val = parseInt(e.target.value, 10);
              onContributionChange(isNaN(val) ? 0 : Math.max(0, val));
            }}
          />
        </Field>

        <dl className="rounded-lg bg-canvas border border-line p-4 space-y-2 text-sm">
          <div className="flex justify-between">
            <dt className="text-muted">Entry fee ({graduatingYear} batch)</dt>
            <dd className="text-ink tabular-nums">{registrationFee > 0 ? inr(registrationFee) : "No fee"}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted">Contribution</dt>
            <dd className="text-ink tabular-nums">{inr(voluntaryContribution)}</dd>
          </div>
          <div className="flex justify-between pt-2 border-t border-line text-base">
            <dt className="font-semibold text-ink">Total</dt>
            <dd className="font-semibold text-ink tabular-nums">{inr(total)}</dd>
          </div>
        </dl>

        {total > 0 ? (
          <div className="space-y-3">
            <div role="radiogroup" aria-label="Payment method" className="grid gap-2 sm:grid-cols-2">
              <MethodOption
                selected={paymentMode === "ONLINE"}
                onSelect={() => onPaymentModeChange("ONLINE")}
                icon={QrCode}
                title="UPI"
                text="Scan the QR code at the desk"
              />
              <MethodOption
                selected={paymentMode === "CASH"}
                onSelect={() => onPaymentModeChange("CASH")}
                icon={Banknote}
                title="Cash"
                text="Pay at the desk"
              />
            </div>
            {paymentMode === "ONLINE" ? (
              <Field
                label="Last 4 digits of the UPI reference"
                hint={`After paying ${inr(total)}, find the reference number (UTR) in your UPI app.`}
              >
                <Input
                  required
                  inputMode="numeric"
                  autoComplete="off"
                  maxLength={4}
                  pattern="[0-9]{4}"
                  placeholder="0000"
                  value={utrLast4}
                  onChange={(e) => onUtrChange(e.target.value.replace(/\D/g, "").slice(0, 4))}
                  className="font-mono text-lg tracking-[0.4em]"
                />
              </Field>
            ) : (
              <Notice tone="info">Please pay {inr(total)} in cash at the desk.</Notice>
            )}
          </div>
        ) : (
          <Notice tone="success">Nothing to pay. Your batch has free entry.</Notice>
        )}
      </div>
    </Card>
  );
}
