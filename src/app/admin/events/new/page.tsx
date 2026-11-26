"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { AppHeader, Card, Page, PageTitle } from "@/components/ui";
import { EventForm } from "@/components/admin/EventForm";

export default function NewEventPage() {
  const router = useRouter();
  return (
    <>
      <AppHeader title="New event" back={{ href: "/admin", label: "Back to events" }} />
      <Page>
        <PageTitle description="The event is saved as a draft. Publish it when you are ready for check-in.">
          New event
        </PageTitle>
        <Card>
          <EventForm
            submitLabel="Create event"
            onSaved={(ev) => router.replace(`/admin/events/${ev.event_id}`)}
          />
        </Card>
      </Page>
    </>
  );
}
