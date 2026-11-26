"use client";

import React, { useEffect, useState } from "react";
import { Search, UserPlus } from "lucide-react";
import { MEMBERSHIP_DISPLAY_LABELS, RegistrationMembershipType } from "@/server/constants";
import { Badge, Button, Input, Notice, api } from "@/components/ui";

export interface AlumniResult {
  member_login_id: string;
  full_name: string;
  email: string;
  mobile_hint: string | null;
  graduating_year: number | null;
  course: string | null;
  stream: string | null;
  city: string | null;
  membership_type: RegistrationMembershipType;
}

/**
 * Search the association members list for someone who did not register for
 * this event. Ends with "Add new alumnus" when they are not on the list.
 */
export function AlumniSearch({
  onSelect,
  onAddNew,
  busy,
}: {
  onSelect: (member: AlumniResult) => void;
  onAddNew: () => void;
  busy?: boolean;
}) {
  const [search, setSearch] = useState("");
  const [results, setResults] = useState<AlumniResult[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const q = search.trim();
    if (q.length < 2) {
      setResults(null);
      return;
    }
    let cancelled = false;
    setLoading(true);
    const t = setTimeout(() => {
      api<{ data: AlumniResult[] }>(`/api/venue/members?search=${encodeURIComponent(q)}`)
        .then((res) => !cancelled && setResults(res.data))
        .catch((err) => !cancelled && setError(err.message))
        .finally(() => !cancelled && setLoading(false));
    }, 300);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [search]);

  return (
    <div className="space-y-3">
      <div className="relative">
        <Search className="w-4 h-4 text-muted absolute left-3.5 top-4 pointer-events-none" />
        <Input
          type="search"
          aria-label="Search alumni list"
          placeholder="Name, email or mobile"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {error && <Notice tone="error">{error}</Notice>}

      {results !== null && (
        <div className="rounded-lg border border-line overflow-hidden">
          {loading && results.length === 0 ? (
            <div className="px-4 py-3 text-sm text-muted">Searching…</div>
          ) : results.length === 0 ? (
            <div className="px-4 py-3 text-sm text-muted">No one on the alumni list matches &ldquo;{search.trim()}&rdquo;.</div>
          ) : (
            <ul className="divide-y divide-line">
              {results.map((m) => (
                <li key={m.member_login_id} className="flex items-center gap-3 px-4 py-3 bg-white">
                  <div className="min-w-0 flex-1">
                    <div className="font-medium text-ink truncate">{m.full_name}</div>
                    <div className="text-sm text-muted truncate">
                      {[m.graduating_year, m.stream, m.city, m.mobile_hint].filter(Boolean).join(" · ")}
                    </div>
                    <div className="mt-1">
                      <Badge tone="blue">{MEMBERSHIP_DISPLAY_LABELS[m.membership_type]}</Badge>
                    </div>
                  </div>
                  <Button size="sm" variant="secondary" disabled={busy} onClick={() => onSelect(m)}>
                    Select
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      <div className="flex items-center gap-3 rounded-lg bg-canvas border border-line px-4 py-3">
        <div className="min-w-0 flex-1 text-sm">
          <div className="font-medium text-ink">Not on the alumni list?</div>
          <div className="text-muted">Add them as a new alumnus.</div>
        </div>
        <Button size="sm" onClick={onAddNew}>
          <UserPlus className="w-4 h-4" />
          Add new
        </Button>
      </div>
    </div>
  );
}
