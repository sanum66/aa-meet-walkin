"use client";

import React, { useEffect, useState } from "react";
import { Event } from "@/types/database.types";
import { PeopleList } from "@/components/PeopleList";
import { AppHeader, Empty, LinkButton, Page, Spinner } from "@/components/ui";
import { SignOutButton } from "@/components/admin/SignOutButton";

/** Volunteer desk: shows only the published event. */
export default function DeskPage() {
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/events/active")
      .then((r) => (r.ok ? r.json() : null))
      .then((json) => setEvent(json?.data?.is_active ? json.data : null))
      .catch(() => undefined)
      .finally(() => setLoading(false));
  }, []);

  return (
    <>
      <AppHeader title="Check-in desk" subtitle={event?.event_name} right={<SignOutButton />} />
      <Page>
        {loading ? (
          <Spinner />
        ) : event ? (
          <>
            <LinkButton href="/register" className="w-full">
              New check-in
            </LinkButton>
            <PeopleList eventId={event.event_id} />
          </>
        ) : (
          <Empty>No event is published. Ask an organizer to publish today&apos;s event.</Empty>
        )}
      </Page>
    </>
  );
}
