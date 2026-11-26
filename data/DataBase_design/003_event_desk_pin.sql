-- ============================================================================
-- IRTTAA NuzhAI — 003 Per-event desk PIN
-- Run in Supabase SQL Editor after 001 (and 002 if applied). Safe to re-run.
--
-- Organizers set a PIN on each event's page; desk volunteers sign in with the
-- PIN of the published event. Until this runs, the app falls back to the
-- DESK_PIN environment variable.
-- ============================================================================

ALTER TABLE "public"."events"
  ADD COLUMN IF NOT EXISTS "desk_pin" varchar(12);

ALTER TABLE "public"."events"
  DROP CONSTRAINT IF EXISTS "chk_events_desk_pin",
  ADD CONSTRAINT "chk_events_desk_pin"
    CHECK ("desk_pin" IS NULL OR "desk_pin" ~ '^[0-9]{4,8}$');

COMMENT ON COLUMN "public"."events"."desk_pin" IS
  'PIN that desk volunteers use to sign in while this event is published';

NOTIFY pgrst, 'reload schema';
