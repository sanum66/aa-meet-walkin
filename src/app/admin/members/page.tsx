"use client";

import React, { useEffect, useState } from "react";
import { Search } from "lucide-react";
import { AssociationMember } from "@/types/database.types";
import { MEMBERSHIP_DISPLAY_LABELS } from "@/server/constants";
import { AppHeader, Badge, Card, Empty, Input, Page, PageTitle, Spinner, api } from "@/components/ui";
import { CsvUpload } from "@/components/admin/CsvUpload";

export default function MembersPage() {
  const [search, setSearch] = useState("");
  const [members, setMembers] = useState<AssociationMember[] | null>(null);
  const [total, setTotal] = useState(0);
  const [reload, setReload] = useState(0);

  useEffect(() => {
    let cancelled = false;
    const t = setTimeout(() => {
      const q = search.trim();
      api<{ data: AssociationMember[]; totalCount: number }>(
        `/api/admin/members${q ? `?search=${encodeURIComponent(q)}` : ""}`
      )
        .then((res) => {
          if (cancelled) return;
          setMembers(res.data);
          setTotal(res.totalCount);
        })
        .catch(() => !cancelled && setMembers([]));
    }, 250);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [search, reload]);

  return (
    <>
      <AppHeader title="Members list" back={{ href: "/admin", label: "Back to events" }} />
      <Page>
        <PageTitle description="People on this list are recognised as members at check-in and get member fees.">
          Members list
        </PageTitle>

        <Card title="Update the list">
          <p className="text-sm text-muted mb-3">
            Upload the <span className="font-medium text-ink">IRTT AA Members</span> CSV exported
            from the association website. New members are added and existing members are updated.
          </p>
          <CsvUpload endpoint="/api/admin/members" buttonLabel="Upload members CSV" onDone={() => setReload((n) => n + 1)} />
        </Card>

        <Card title={`${total} members`}>
          <div className="relative mb-3">
            <Search className="w-4 h-4 text-muted/70 absolute left-3 top-3.5 pointer-events-none" />
            <Input
              type="search"
              aria-label="Search members"
              placeholder="Search by name, email or mobile"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          {members === null ? (
            <Spinner />
          ) : members.length === 0 ? (
            <Empty>No members found.</Empty>
          ) : (
            <ul className="divide-y divide-line">
              {members.slice(0, 200).map((m) => (
                <li key={m.member_login_id} className="py-2.5 flex items-center gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="text-ink truncate">{m.full_name}</div>
                    <div className="text-sm text-muted truncate">
                      {[m.graduating_year, m.stream, m.email].filter(Boolean).join(" · ")}
                    </div>
                  </div>
                  <Badge>{MEMBERSHIP_DISPLAY_LABELS[m.membership_type].replace(" Member", "")}</Badge>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </Page>
    </>
  );
}
