"use client";

/**
 * Shared UI kit. Every page uses these, so the look is defined in one place.
 * Brand: IRTTAA logo blue (brand-*) on a cool light canvas; Inter type.
 * Mobile: 16px form text (no iOS zoom) and 44px minimum touch targets.
 */
import React, { useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { AlertCircle, Check, CheckCircle2, ChevronLeft, Info, Loader2, Minus, Plus, X } from "lucide-react";

export function cx(...classes: (string | false | null | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}

export const inr = (n: number | string | null | undefined) =>
  `₹${(Number(n) || 0).toLocaleString("en-IN")}`;

/* ------------------------------------------------------------------ layout */

export function BrandMark({ compact }: { compact?: boolean }) {
  return (
    <span className="flex items-center gap-2.5 min-w-0">
      <Image src="/logo.png" alt="" width={compact ? 30 : 36} height={compact ? 30 : 36} className="shrink-0" priority />
      <span className="min-w-0 leading-tight">
        <span className="block text-[15px] font-semibold text-ink truncate">IRTT Alumni Association</span>
        {!compact && <span className="block text-xs text-muted truncate">Synergize · Support · Serve</span>}
      </span>
    </span>
  );
}

export function AppHeader({
  title,
  subtitle,
  back,
  right,
  wide,
}: {
  title?: string;
  subtitle?: string | null;
  /** Shows a back link instead of the logo */
  back?: { href: string; label: string };
  right?: React.ReactNode;
  wide?: boolean;
}) {
  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur no-print">
      <div className="brand-stripe" />
      <div className={cx("mx-auto px-4 h-14 flex items-center gap-3 border-b border-line", wide ? "max-w-5xl" : "max-w-2xl")}>
        {back ? (
          <Link
            href={back.href}
            aria-label={back.label}
            className="-ml-2 w-10 h-10 shrink-0 rounded-lg flex items-center justify-center text-muted hover:bg-canvas hover:text-ink"
          >
            <ChevronLeft className="w-5 h-5" />
          </Link>
        ) : null}
        {title ? (
          <div className="min-w-0 flex-1">
            <div className="text-[15px] font-semibold text-ink truncate leading-tight">{title}</div>
            {subtitle && <div className="text-xs text-muted truncate">{subtitle}</div>}
          </div>
        ) : (
          <Link href="/" className="min-w-0 flex-1">
            <BrandMark compact />
          </Link>
        )}
        {right}
      </div>
    </header>
  );
}

export function Page({
  children,
  wide,
  className,
}: {
  children: React.ReactNode;
  wide?: boolean;
  className?: string;
}) {
  return (
    <main className={cx("mx-auto px-4 py-5 sm:py-8 space-y-4", wide ? "max-w-5xl" : "max-w-2xl", className)}>
      {children}
    </main>
  );
}

export function PageTitle({
  children,
  description,
  action,
}: {
  children: React.ReactNode;
  description?: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex items-end justify-between gap-4 pb-1">
      <div className="min-w-0">
        <h1 className="text-2xl font-semibold tracking-tight text-ink">{children}</h1>
        {description && <p className="mt-1 text-[15px] text-muted">{description}</p>}
      </div>
      {action}
    </div>
  );
}

export function Card({
  children,
  className,
  title,
  description,
  action,
  padded = true,
}: {
  children: React.ReactNode;
  className?: string;
  title?: React.ReactNode;
  description?: React.ReactNode;
  action?: React.ReactNode;
  padded?: boolean;
}) {
  return (
    <section className={cx("bg-white rounded-xl border border-line shadow-[0_1px_2px_rgba(16,24,40,0.04)]", padded && "p-4 sm:p-5", className)}>
      {(title || action) && (
        <div className={cx("flex items-start justify-between gap-3", description ? "mb-4" : "mb-3", !padded && "px-4 pt-4 sm:px-5 sm:pt-5")}>
          <div className="min-w-0">
            {title && <h2 className="text-base font-semibold text-ink">{title}</h2>}
            {description && <p className="mt-0.5 text-sm text-muted">{description}</p>}
          </div>
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

/** Calendar-style date block. */
export function DateTile({ date, size = "md" }: { date: string; size?: "md" | "lg" }) {
  const d = new Date(`${date}T00:00:00`);
  const valid = !isNaN(d.getTime());
  return (
    <div
      className={cx(
        "shrink-0 rounded-xl border border-line bg-white overflow-hidden text-center",
        size === "lg" ? "w-16" : "w-12"
      )}
      aria-hidden="true"
    >
      <div className={cx("bg-brand-600 text-white font-semibold uppercase tracking-wide", size === "lg" ? "text-[11px] py-1" : "text-[10px] py-0.5")}>
        {valid ? d.toLocaleDateString("en-IN", { month: "short" }) : "—"}
      </div>
      <div className={cx("font-semibold text-ink tabular-nums leading-none", size === "lg" ? "text-2xl py-2" : "text-lg py-1.5")}>
        {valid ? d.getDate() : "?"}
      </div>
    </div>
  );
}

/** Underlined tab row that scrolls sideways on narrow screens. */
export function Tabs<T extends string>({
  tabs,
  value,
  onChange,
  wide,
}: {
  tabs: { id: T; label: string }[];
  value: T;
  onChange: (id: T) => void;
  wide?: boolean;
}) {
  return (
    <nav className="bg-white border-b border-line no-print">
      <div
        role="tablist"
        className={cx(
          "mx-auto px-2 flex overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
          wide ? "max-w-5xl" : "max-w-2xl"
        )}
      >
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={value === t.id}
            onClick={() => onChange(t.id)}
            className={cx(
              "flex-1 sm:flex-none shrink-0 h-12 px-2 sm:px-3 text-sm font-medium border-b-2 -mb-px whitespace-nowrap transition-colors",
              value === t.id ? "border-brand-600 text-brand-700" : "border-transparent text-muted hover:text-ink"
            )}
          >
            {t.label}
          </button>
        ))}
      </div>
    </nav>
  );
}

/** Numbered progress for multi-step flows. */
export function Steps({ steps, current }: { steps: string[]; current: number }) {
  return (
    <ol className="flex items-center gap-2" aria-label="Progress">
      {steps.map((label, i) => {
        const done = i < current;
        const active = i === current;
        return (
          <li
            key={label}
            className={cx(
              "flex items-center gap-2",
              active || i === steps.length - 1 ? "flex-none" : "min-w-0 flex-1",
              active && i < steps.length - 1 && "flex-1"
            )}
          >
            <span
              className={cx(
                "w-6 h-6 shrink-0 rounded-full flex items-center justify-center text-xs font-semibold",
                done && "bg-brand-600 text-white",
                active && "bg-brand-600 text-white ring-4 ring-brand-100",
                !done && !active && "bg-white border border-line text-muted"
              )}
              aria-current={active ? "step" : undefined}
            >
              {done ? <Check className="w-3.5 h-3.5" /> : i + 1}
            </span>
            <span className={cx("text-sm", active ? "font-medium text-ink whitespace-nowrap" : "hidden sm:inline truncate text-muted")}>{label}</span>
            {i < steps.length - 1 && <span className="h-px flex-1 bg-line min-w-3" />}
          </li>
        );
      })}
    </ol>
  );
}

/* ------------------------------------------------------------------- forms */

/**
 * Labelled form row. Use `group` when the children are buttons (steppers,
 * chips): a <label> would forward taps on its text to the first button.
 */
export function Field({
  label,
  hint,
  children,
  className,
  group,
}: {
  label: string;
  hint?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  group?: boolean;
}) {
  const content = (
    <>
      <span className="block text-sm font-medium text-ink/80 mb-1.5">{label}</span>
      {children}
      {hint && <span className="block text-xs text-muted mt-1.5">{hint}</span>}
    </>
  );
  return group ? (
    <div role="group" aria-label={label} className={cx("block", className)}>
      {content}
    </div>
  ) : (
    <label className={cx("block", className)}>{content}</label>
  );
}

const controlBase =
  "w-full h-12 px-3.5 rounded-lg border border-line bg-white text-base text-ink placeholder:text-muted/60 shadow-[0_1px_2px_rgba(16,24,40,0.04)] focus:outline-none focus:ring-4 focus:ring-brand-100 focus:border-brand-500 disabled:bg-canvas disabled:text-muted transition-shadow";

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  function Input({ className, ...props }, ref) {
    return <input ref={ref} {...props} className={cx(controlBase, className)} />;
  }
);

export function Select({ className, ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={cx(controlBase, "pr-8", className)} />;
}

export function Textarea({ className, ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={cx(controlBase, "h-auto min-h-20 py-3", className)} />;
}

/** − 0 + counter; easier than a number input on phones. */
export function Stepper({
  value,
  onChange,
  min = 0,
  max = 20,
  label,
}: {
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  label: string;
}) {
  const btn =
    "w-12 h-full flex items-center justify-center text-brand-700 hover:bg-brand-50 disabled:text-line disabled:hover:bg-transparent";
  return (
    <div className="flex items-stretch h-12 rounded-lg border border-line bg-white overflow-hidden shadow-[0_1px_2px_rgba(16,24,40,0.04)]">
      <button type="button" aria-label={`Fewer ${label}`} onClick={() => onChange(Math.max(min, value - 1))} disabled={value <= min} className={btn}>
        <Minus className="w-4 h-4" />
      </button>
      <span className="flex-1 flex items-center justify-center text-base font-semibold tabular-nums border-x border-line" aria-live="polite">
        {value}
      </span>
      <button type="button" aria-label={`More ${label}`} onClick={() => onChange(Math.min(max, value + 1))} disabled={value >= max} className={btn}>
        <Plus className="w-4 h-4" />
      </button>
    </div>
  );
}

/** Single choice as a segmented control. */
export function Segmented<T extends string>({
  options,
  value,
  onChange,
  className,
  label,
}: {
  options: { value: T; label: React.ReactNode }[];
  value: T;
  onChange: (v: T) => void;
  className?: string;
  label?: string;
}) {
  return (
    <div
      role="radiogroup"
      aria-label={label}
      className={cx("grid gap-1 p-1 rounded-lg bg-canvas border border-line", className)}
      style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}
    >
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="radio"
          aria-checked={value === o.value}
          onClick={() => onChange(o.value)}
          className={cx(
            "min-h-10 px-2 rounded-md text-sm font-medium transition-colors",
            value === o.value ? "bg-white text-brand-700 shadow-sm ring-1 ring-line" : "text-muted hover:text-ink"
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

/* ----------------------------------------------------------------- buttons */

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";

const buttonVariants: Record<ButtonVariant, string> = {
  primary: "bg-brand-600 text-white hover:bg-brand-700 shadow-[0_1px_2px_rgba(16,24,40,0.1)]",
  secondary: "bg-white text-ink border border-line hover:bg-canvas shadow-[0_1px_2px_rgba(16,24,40,0.04)]",
  ghost: "text-brand-700 hover:bg-brand-50",
  danger: "bg-white text-red-700 border border-red-200 hover:bg-red-50",
};

const buttonSizes = {
  sm: "h-9 px-3 text-sm",
  md: "h-11 px-4 text-[15px]",
  lg: "h-12 px-5 text-base",
};

export function Button({
  variant = "primary",
  loading,
  className,
  children,
  size = "md",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  loading?: boolean;
  size?: "sm" | "md" | "lg";
}) {
  return (
    <button
      type="button"
      {...props}
      disabled={props.disabled || loading}
      className={cx(
        "inline-flex items-center justify-center gap-2 rounded-lg font-semibold transition-colors disabled:opacity-50 cursor-pointer",
        buttonSizes[size],
        buttonVariants[variant],
        className
      )}
    >
      {loading && <Loader2 className="w-4 h-4 animate-spin" />}
      {children}
    </button>
  );
}

export function LinkButton({
  href,
  variant = "primary",
  size = "md",
  className,
  children,
}: {
  href: string;
  variant?: ButtonVariant;
  size?: "sm" | "md" | "lg";
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={cx(
        "inline-flex items-center justify-center gap-2 rounded-lg font-semibold transition-colors",
        buttonSizes[size],
        buttonVariants[variant],
        className
      )}
    >
      {children}
    </Link>
  );
}

/* --------------------------------------------------------------- feedback */

export function Notice({
  tone = "info",
  children,
  className,
}: {
  tone?: "info" | "success" | "warning" | "error";
  children: React.ReactNode;
  className?: string;
}) {
  const styles = {
    info: "bg-brand-50 border-brand-100 text-brand-900",
    success: "bg-green-50 border-green-200 text-green-900",
    warning: "bg-amber-50 border-amber-200 text-amber-900",
    error: "bg-red-50 border-red-200 text-red-900",
  }[tone];
  const iconColor = { info: "text-brand-600", success: "text-green-600", warning: "text-amber-600", error: "text-red-600" }[tone];
  const Icon = tone === "success" ? CheckCircle2 : tone === "info" ? Info : AlertCircle;
  return (
    <div role={tone === "error" ? "alert" : "status"} className={cx("flex gap-2.5 px-3.5 py-3 rounded-lg border text-sm", styles, className)}>
      <Icon className={cx("w-4 h-4 shrink-0 mt-0.5", iconColor)} />
      <div className="min-w-0">{children}</div>
    </div>
  );
}

export function Spinner({ label = "Loading" }: { label?: string }) {
  return (
    <div className="py-12 flex items-center justify-center gap-2 text-muted text-sm">
      <Loader2 className="w-4 h-4 animate-spin" />
      {label}
    </div>
  );
}

export function Empty({
  title,
  children,
  icon: Icon,
  action,
}: {
  title?: string;
  children?: React.ReactNode;
  icon?: React.ElementType;
  action?: React.ReactNode;
}) {
  return (
    <div className="py-10 px-4 text-center">
      {Icon && (
        <div className="mx-auto mb-3 w-11 h-11 rounded-full bg-brand-50 flex items-center justify-center">
          <Icon className="w-5 h-5 text-brand-600" />
        </div>
      )}
      {title && <div className="font-semibold text-ink">{title}</div>}
      {children && <div className="mt-1 text-sm text-muted">{children}</div>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function Badge({
  tone = "neutral",
  children,
  dot,
}: {
  tone?: "neutral" | "green" | "amber" | "red" | "blue";
  children: React.ReactNode;
  dot?: boolean;
}) {
  const styles = {
    neutral: "bg-canvas text-muted ring-line",
    green: "bg-green-50 text-green-700 ring-green-200",
    amber: "bg-amber-50 text-amber-800 ring-amber-200",
    red: "bg-red-50 text-red-700 ring-red-200",
    blue: "bg-brand-50 text-brand-700 ring-brand-100",
  }[tone];
  const dotColor = { neutral: "bg-muted", green: "bg-green-500", amber: "bg-amber-500", red: "bg-red-500", blue: "bg-brand-500" }[tone];
  return (
    <span className={cx("inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full ring-1 ring-inset text-xs font-medium whitespace-nowrap", styles)}>
      {dot && <span className={cx("w-1.5 h-1.5 rounded-full", dotColor)} />}
      {children}
    </span>
  );
}

export function Stat({
  label,
  value,
  note,
  icon: Icon,
}: {
  label: string;
  value: React.ReactNode;
  note?: string;
  icon?: React.ElementType;
}) {
  return (
    <div className="bg-white rounded-xl border border-line p-4 shadow-[0_1px_2px_rgba(16,24,40,0.04)]">
      <div className="flex items-center justify-between gap-2">
        <div className="text-sm font-medium text-muted">{label}</div>
        {Icon && (
          <div className="w-8 h-8 rounded-lg bg-brand-50 flex items-center justify-center">
            <Icon className="w-4 h-4 text-brand-600" />
          </div>
        )}
      </div>
      <div className="mt-2 text-2xl font-semibold tracking-tight text-ink tabular-nums">{value}</div>
      {note && <div className="text-xs text-muted mt-1">{note}</div>}
    </div>
  );
}

/* ------------------------------------------------------------------ sheet */

/** Bottom sheet on phones, centred dialog on larger screens. */
export function Sheet({
  open,
  onClose,
  title,
  children,
  footer,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center" role="dialog" aria-modal="true" aria-label={title}>
      <button type="button" aria-label="Close" className="absolute inset-0 bg-ink/40" onClick={onClose} />
      <div className="relative w-full sm:max-w-lg max-h-[92dvh] flex flex-col bg-white rounded-t-2xl sm:rounded-2xl shadow-xl">
        <div className="sm:hidden mx-auto mt-2 w-10 h-1 rounded-full bg-line" />
        <div className="flex items-center justify-between gap-3 px-4 h-14 border-b border-line shrink-0">
          <h2 className="text-base font-semibold text-ink truncate">{title}</h2>
          <button type="button" onClick={onClose} aria-label="Close" className="w-10 h-10 -mr-2 rounded-lg flex items-center justify-center text-muted hover:bg-canvas">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="overflow-y-auto p-4 space-y-4">{children}</div>
        {footer && (
          <div className="px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] border-t border-line shrink-0">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

/* ----------------------------------------------------------------- helpers */

export const passNumber = (id: number) => `IRTTAA-${String(id).padStart(4, "0")}`;

export function formatDate(dateStr?: string | null) {
  if (!dateStr) return "";
  const d = new Date(`${dateStr}T00:00:00`);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short", year: "numeric" });
}

export function formatLongDate(dateStr?: string | null) {
  if (!dateStr) return "";
  const d = new Date(`${dateStr}T00:00:00`);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
}

export function formatTime(iso?: string | null) {
  if (!iso) return "";
  const d = new Date(iso.endsWith("Z") || iso.includes("+") ? iso : `${iso}Z`);
  if (isNaN(d.getTime())) return "";
  return d.toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" });
}

export async function api<T = unknown>(
  url: string,
  init?: RequestInit & { json?: unknown }
): Promise<T> {
  const { json, ...rest } = init || {};
  const res = await fetch(url, {
    ...rest,
    headers: json !== undefined ? { "Content-Type": "application/json", ...(rest.headers || {}) } : rest.headers,
    body: json !== undefined ? JSON.stringify(json) : rest.body,
  });
  if (res.status === 401 && typeof window !== "undefined" && !url.startsWith("/api/auth")) {
    window.location.href = `/admin/login?next=${encodeURIComponent(window.location.pathname + window.location.search)}`;
  }
  const body = await res.json().catch(() => ({}));
  if (!res.ok || body.success === false) {
    throw new Error(body.error || `Request failed (${res.status})`);
  }
  return body as T;
}
