"use client";

/**
 * Volunteer check-in (desk PIN or organizer sign-in required).
 * Find → Details → Review → Pass.
 */
import React, { Suspense, useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ArrowRight, CalendarDays, Search } from "lucide-react";
import {
  BATCH_YEARS,
  COURSE_TYPES,
  DEFAULT_BATCH_FEE_TIERS,
  FOOD_PREFERENCES,
  PaymentMode,
  RegistrationMembershipType,
  STREAM_TYPES,
} from "@/server/constants";
import { Event, EventFeeConfiguration, EventRegistration, VenueLookupResult } from "@/types/database.types";
import {
  AppHeader,
  Button,
  Card,
  Empty,
  Field,
  Input,
  LinkButton,
  Notice,
  Page,
  Segmented,
  Select,
  Spinner,
  Stepper,
  Steps,
  api,
  formatDate,
  inr,
} from "@/components/ui";
import { PaymentCalculator } from "@/components/registration/PaymentCalculator";
import { SuccessCard } from "@/components/registration/SuccessCard";
import { AlumniResult, AlumniSearch } from "@/components/registration/AlumniSearch";
import { ReviewCard } from "@/components/registration/ReviewCard";

type Step = "find" | "details" | "review" | "done";
/** How the person was found: on the event's attendee list, on the alumni list, or new. */
type Kind = "attendee" | "member" | "new";

const STEP_LABELS = ["Find", "Details", "Review", "Pass"];
const STEP_INDEX: Record<Step, number> = { find: 0, details: 1, review: 2, done: 3 };

const FOOD_LABELS: Record<string, string> = {
  Vegetarian: "Veg",
  "Non-Vegetarian": "Non-veg",
  Vegan: "Vegan",
};

const DEFAULT_YEAR = new Date().getFullYear() - 10;

interface FormState {
  memberLoginId: string | null;
  fullName: string;
  email: string;
  mobile: string;
  graduatingYear: number;
  course: string;
  stream: string;
  membershipTypeUsed: RegistrationMembershipType;
  foodPreference: string;
  accompanyingFamilyCount: number;
}

const EMPTY_FORM: FormState = {
  memberLoginId: null,
  fullName: "",
  email: "",
  mobile: "",
  graduatingYear: DEFAULT_YEAR,
  course: "BE",
  stream: "",
  membershipTypeUsed: "UNREGISTERED_MEMBER",
  foodPreference: "Vegetarian",
  accompanyingFamilyCount: 0,
};

function feeFor(rules: EventFeeConfiguration[], year: number, membership: RegistrationMembershipType): number {
  const active = rules.filter((r) => r.is_active);
  const inRange = (r: EventFeeConfiguration) => year >= r.min_graduating_year && year <= r.max_graduating_year;
  const rule = active.find((r) => r.membership_type === membership && inRange(r));
  if (rule) return Number(rule.registration_fee) || 0;
  const tier = DEFAULT_BATCH_FEE_TIERS.find((t) => year >= t.minGraduatingYear && year <= t.maxGraduatingYear);
  return tier ? tier.registrationFee : 0;
}

function RegisterFlow() {
  const searchParams = useSearchParams();

  const [event, setEvent] = useState<Event | null>(null);
  const [feeRules, setFeeRules] = useState<EventFeeConfiguration[]>([]);
  const [loadingEvent, setLoadingEvent] = useState(true);

  const [step, setStep] = useState<Step>("find");
  const [kind, setKind] = useState<Kind>("new");
  const [query, setQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [findError, setFindError] = useState<string | null>(null);
  const [notOnList, setNotOnList] = useState<string | null>(null);

  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => setForm((f) => ({ ...f, [key]: value }));

  const [contribution, setContribution] = useState(0);
  const [paymentMode, setPaymentMode] = useState<PaymentMode>("ONLINE");
  const [utrLast4, setUtrLast4] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [registration, setRegistration] = useState<EventRegistration | null>(null);

  const fee = feeFor(feeRules, form.graduatingYear, form.membershipTypeUsed);
  const total = fee + contribution;

  const go = (next: Step) => {
    setStep(next);
    window.scrollTo({ top: 0 });
  };

  /**
   * Looks a person up by email or mobile. `fromAlumniList` is true when the
   * volunteer picked someone from the alumni search.
   */
  const lookup = useCallback(async (q: string, eventId?: number, fromAlumniList = false) => {
    const text = q.trim();
    if (!text) return;
    setSearching(true);
    setFindError(null);
    setNotOnList(null);
    try {
      const { data } = await api<{ data: VenueLookupResult }>("/api/venue/lookup", {
        method: "POST",
        json: { query: text, eventId },
      });
      if (data.alreadyRegistered && data.existingRegistration) {
        setRegistration(data.existingRegistration);
        go("done");
        return;
      }
      if (data.found && data.prefill && (data.source === "PRE_REGISTERED" || fromAlumniList)) {
        const p = data.prefill;
        setForm({
          memberLoginId: p.member_login_id,
          fullName: p.full_name || "",
          email: p.email || "",
          mobile: p.mobile || "",
          graduatingYear: p.graduating_year || DEFAULT_YEAR,
          course: p.course || "BE",
          stream: p.stream || "",
          membershipTypeUsed: p.membership_type_used,
          foodPreference: p.food_preference || "Vegetarian",
          accompanyingFamilyCount: p.accompanying_family_count || 0,
        });
        setKind(data.source === "PRE_REGISTERED" ? "attendee" : "member");
        go("details");
        return;
      }
      // Not on this event's attendee list: continue with the alumni search
      setNotOnList(text);
    } catch (err) {
      setFindError(err instanceof Error ? err.message : "Could not search. Try again.");
    } finally {
      setSearching(false);
    }
  }, []);

  useEffect(() => {
    fetch("/api/events/active")
      .then((r) => (r.ok ? r.json() : null))
      .then((json) => {
        if (!json?.data) return;
        setEvent(json.data);
        setFeeRules(json.feeRules || []);
        const q = searchParams.get("q");
        if (q) {
          setQuery(q);
          lookup(q, json.data.event_id);
        }
      })
      .catch(() => undefined)
      .finally(() => setLoadingEvent(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const startOver = () => {
    setQuery("");
    setNotOnList(null);
    setFindError(null);
    setForm(EMPTY_FORM);
    setKind("new");
    setContribution(0);
    setPaymentMode("ONLINE");
    setUtrLast4("");
    setFormError(null);
    setReviewNote(null);
    setRegistration(null);
    go("find");
  };

  const addNew = () => {
    const text = (notOnList || query).trim();
    setForm({
      ...EMPTY_FORM,
      email: text.includes("@") ? text.toLowerCase() : "",
      mobile: text && !text.includes("@") ? text : "",
    });
    setKind("new");
    go("details");
  };

  const [reviewNote, setReviewNote] = useState<string | null>(null);

  const toReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.stream) return setFormError("Choose the branch.");
    if (total > 0 && paymentMode === "ONLINE" && !/^[0-9]{4}$/.test(utrLast4)) {
      return setFormError("Enter the last 4 digits of the UPI reference number.");
    }
    setFormError(null);
    setReviewNote(null);

    // A "new" person may already be on the alumni list (fees can differ by
    // member type), or already checked in. Check by email, then mobile.
    if (kind === "new" && event) {
      for (const q of [form.email, form.mobile].filter((v) => v.trim())) {
        try {
          const { data } = await api<{ data: VenueLookupResult }>("/api/venue/lookup", {
            method: "POST",
            json: { query: q.trim(), eventId: event.event_id },
          });
          if (data.alreadyRegistered && data.existingRegistration) {
            setRegistration(data.existingRegistration);
            go("done");
            return;
          }
          if (data.found && data.prefill && data.source !== "NONE") {
            const p = data.prefill;
            const onAttendeeList = data.source === "PRE_REGISTERED";
            setForm((f) => ({ ...f, memberLoginId: p.member_login_id, membershipTypeUsed: p.membership_type_used }));
            setKind(onAttendeeList ? "attendee" : "member");
            setReviewNote(
              onAttendeeList
                ? `${p.full_name} is on this event's attendee list. Their registration will be used.`
                : `${p.full_name} is on the alumni list, so the member fee applies.`
            );
            break;
          }
        } catch {
          // Lookup is a convenience here; the server re-checks on submit
        }
      }
    }
    go("review");
  };

  const submit = async () => {
    if (!event) return;
    setSubmitting(true);
    setFormError(null);
    try {
      const { data } = await api<{ data: EventRegistration }>("/api/register", {
        method: "POST",
        json: {
          eventId: event.event_id,
          ...form,
          accompanyingAlumniCount: 0,
          fullName: form.fullName.trim(),
          email: form.email.trim(),
          mobile: form.mobile.trim(),
          registrationSource: kind === "attendee" ? "PRE_REGISTERED" : "ON_SPOT",
          recognizedMember: Boolean(form.memberLoginId),
          voluntaryContribution: contribution,
          paymentMode: total > 0 ? paymentMode : null,
          utrLast4: total > 0 && paymentMode === "ONLINE" ? utrLast4 : null,
        },
      });
      setRegistration(data);
      go("done");
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Check-in failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const header = (
    <AppHeader
      title={event?.event_name || "Check-in"}
      subtitle={event ? formatDate(event.event_date) : undefined}
      back={{ href: "/checkin", label: "Back to desk" }}
    />
  );

  if (loadingEvent) {
    return (
      <>
        {header}
        <Spinner />
      </>
    );
  }

  if (!event) {
    return (
      <>
        {header}
        <Page>
          <Card>
            <Empty icon={CalendarDays} title="No event is published" action={<LinkButton href="/checkin" variant="secondary">Back to desk</LinkButton>}>
              Ask an organizer to publish today&apos;s event.
            </Empty>
          </Card>
        </Page>
      </>
    );
  }

  const progress = <Steps steps={STEP_LABELS} current={STEP_INDEX[step]} />;

  /* ------------------------------------------------------------ pass */
  if (step === "done" && registration) {
    return (
      <>
        {header}
        <Page>
          {progress}
          <SuccessCard registration={registration} event={event} onReset={startOver} />
        </Page>
      </>
    );
  }

  /* ------------------------------------------------------------ find */
  if (step === "find") {
    return (
      <>
        {header}
        <Page>
          {progress}

          <Card title="Registered for this event" description="Search by the email or mobile number they registered with.">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                lookup(query, event.event_id);
              }}
              className="space-y-3"
            >
              <div className="relative">
                <Search className="w-4 h-4 text-muted absolute left-3.5 top-4 pointer-events-none" />
                <Input
                  autoFocus
                  type="text"
                  inputMode="email"
                  autoCapitalize="none"
                  autoCorrect="off"
                  aria-label="Email or mobile number"
                  placeholder="name@gmail.com or 98765 43210"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              {findError && <Notice tone="error">{findError}</Notice>}
              {notOnList && (
                <Notice tone="warning">
                  &ldquo;{notOnList}&rdquo; is not on this event&apos;s attendee list. Search the alumni list below.
                </Notice>
              )}
              <Button type="submit" size="lg" className="w-full" loading={searching} disabled={!query.trim()}>
                Find
                {!searching && <ArrowRight className="w-4 h-4" />}
              </Button>
            </form>
          </Card>

          <Card title="Did not register for this event" description="Search the alumni list by name, email or mobile.">
            <AlumniSearch
              busy={searching}
              onSelect={(m: AlumniResult) => lookup(m.email, event.event_id, true)}
              onAddNew={addNew}
            />
          </Card>
        </Page>
      </>
    );
  }

  /* ---------------------------------------------------------- review */
  if (step === "review") {
    return (
      <>
        {header}
        <Page className="pb-32">
          {progress}
          <ReviewCard
            kind={kind}
            data={{
              fullName: form.fullName,
              mobile: form.mobile,
              email: form.email,
              graduatingYear: form.graduatingYear,
              course: form.course,
              stream: form.stream,
              foodPreference: form.foodPreference,
              familyCount: form.accompanyingFamilyCount,
              fee,
              contribution,
              paymentMode,
              utrLast4,
            }}
          />
          {reviewNote && <Notice tone="info">{reviewNote}</Notice>}
          {formError && <Notice tone="error">{formError}</Notice>}
        </Page>
        <div className="fixed bottom-0 inset-x-0 z-30 bg-white/95 backdrop-blur border-t border-line shadow-[0_-4px_12px_rgba(16,24,40,0.06)]">
          <div className="max-w-2xl mx-auto px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] grid grid-cols-[auto_1fr] gap-3">
            <Button variant="secondary" size="lg" onClick={() => go("details")} disabled={submitting}>
              Edit
            </Button>
            <Button size="lg" onClick={submit} loading={submitting}>
              Confirm check-in
            </Button>
          </div>
        </div>
      </>
    );
  }

  /* --------------------------------------------------------- details */
  return (
    <>
      {header}
      <form onSubmit={toReview}>
        <Page className="pb-32">
          {progress}

          {kind === "attendee" && <Notice tone="success">Found on the attendee list. Check the details.</Notice>}
          {kind === "member" && <Notice tone="success">Found on the alumni list. Check the details.</Notice>}
          {kind === "new" && <Notice tone="info">New alumnus. Fill in their details.</Notice>}

          <Card
            title="Details"
            action={
              <button type="button" onClick={startOver} className="text-sm font-medium text-brand-700 h-9 px-2 -mr-2 -mt-1 rounded-md hover:bg-brand-50">
                Start over
              </button>
            }
          >
            <div className="space-y-4">
              <Field label="Full name">
                <Input required autoComplete="off" value={form.fullName} onChange={(e) => set("fullName", e.target.value)} />
              </Field>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Mobile number">
                  <Input required type="tel" inputMode="tel" autoComplete="off" value={form.mobile} onChange={(e) => set("mobile", e.target.value)} />
                </Field>
                <Field label="Email">
                  <Input required type="email" autoComplete="off" autoCapitalize="none" value={form.email} onChange={(e) => set("email", e.target.value)} />
                </Field>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Batch">
                  <Select value={form.graduatingYear} onChange={(e) => set("graduatingYear", Number(e.target.value))}>
                    {BATCH_YEARS.map((y) => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </Select>
                </Field>
                <Field label="Branch">
                  <Select required value={form.stream} onChange={(e) => set("stream", e.target.value)}>
                    <option value="" disabled>Select</option>
                    {STREAM_TYPES.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                    {form.stream && !(STREAM_TYPES as readonly string[]).includes(form.stream) && (
                      <option value={form.stream}>{form.stream}</option>
                    )}
                  </Select>
                </Field>
              </div>
              <Field group label="Course">
                <Segmented
                  label="Course"
                  value={form.course as (typeof COURSE_TYPES)[number]}
                  onChange={(v) => set("course", v)}
                  options={COURSE_TYPES.map((c) => ({ value: c, label: c }))}
                />
              </Field>
            </div>
          </Card>

          <Card title="Food and family">
            <div className="space-y-4">
              <Field group label="Food preference">
                <Segmented
                  label="Food preference"
                  value={form.foodPreference as (typeof FOOD_PREFERENCES)[number]}
                  onChange={(v) => set("foodPreference", v)}
                  options={FOOD_PREFERENCES.map((f) => ({ value: f, label: FOOD_LABELS[f] || f }))}
                />
              </Field>
              <Field group label="Family members coming with them">
                <div className="max-w-48">
                  <Stepper label="family members" value={form.accompanyingFamilyCount} onChange={(v) => set("accompanyingFamilyCount", v)} />
                </div>
              </Field>
            </div>
          </Card>

          <PaymentCalculator
            graduatingYear={form.graduatingYear}
            registrationFee={fee}
            voluntaryContribution={contribution}
            paymentMode={paymentMode}
            utrLast4={utrLast4}
            onContributionChange={setContribution}
            onPaymentModeChange={setPaymentMode}
            onUtrChange={setUtrLast4}
          />

          {formError && <Notice tone="error">{formError}</Notice>}
        </Page>

        <div className="fixed bottom-0 inset-x-0 z-30 bg-white/95 backdrop-blur border-t border-line shadow-[0_-4px_12px_rgba(16,24,40,0.06)]">
          <div className="max-w-2xl mx-auto px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] flex items-center gap-4">
            <div className="shrink-0">
              <div className="text-xs font-medium text-muted">Total</div>
              <div className="text-xl font-semibold tracking-tight text-ink tabular-nums">{inr(total)}</div>
            </div>
            <Button type="submit" size="lg" className="flex-1">
              Review
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </form>
    </>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<Spinner />}>
      <RegisterFlow />
    </Suspense>
  );
}
