-- ============================================================================
-- IRTTAA NuzhAI — 002 Security & Integrity Hardening
-- Run AFTER 001_nuzhai_schema.sql (safe to run on a database that already has data).
--
-- BEFORE running this, put the project's secret / service_role key into
-- SUPABASE_SERVICE_ROLE_KEY (.env.local or your hosting env) and restart the app.
-- After this migration the public (anon) key can no longer read or write any
-- table, so only the Next.js server (which checks organizer logins) can.
-- ============================================================================

BEGIN;

-- 1. Remove the "anyone can do anything" policies ---------------------------
DROP POLICY IF EXISTS "Allow full access on association_members" ON "public"."association_members";
DROP POLICY IF EXISTS "Allow full access on events" ON "public"."events";
DROP POLICY IF EXISTS "Allow full access on event_fee_configurations" ON "public"."event_fee_configurations";
DROP POLICY IF EXISTS "Allow full access on event_pre_registrations" ON "public"."event_pre_registrations";
DROP POLICY IF EXISTS "Allow full access on event_registrations" ON "public"."event_registrations";

-- RLS stays enabled with no policies => anon/authenticated get nothing.
-- service_role bypasses RLS, which is what the server uses.
ALTER TABLE "public"."association_members" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."events" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."event_fee_configurations" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."event_pre_registrations" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."event_registrations" ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON
  "public"."association_members",
  "public"."events",
  "public"."event_fee_configurations",
  "public"."event_pre_registrations",
  "public"."event_registrations"
FROM anon, authenticated;

ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON TABLES FROM anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON SEQUENCES FROM anon, authenticated;

GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;

-- 2. Exactly one active event at a time ---------------------------------------
-- Keep only the most recent active event active before adding the index.
UPDATE "public"."events" e
SET "is_active" = false
WHERE "is_active" = true
  AND "event_id" <> (
    SELECT "event_id" FROM "public"."events"
    WHERE "is_active" = true
    ORDER BY "event_date" DESC, "event_id" DESC
    LIMIT 1
  );

CREATE UNIQUE INDEX IF NOT EXISTS "uq_events_single_active"
  ON "public"."events" ("is_active") WHERE "is_active" = true;

-- 3. Data integrity checks ----------------------------------------------------
-- NOT VALID: enforced for every new/updated row without failing on old rows.
ALTER TABLE "public"."event_fee_configurations"
  DROP CONSTRAINT IF EXISTS "chk_fee_year_range",
  ADD CONSTRAINT "chk_fee_year_range"
    CHECK ("min_graduating_year" <= "max_graduating_year") NOT VALID,
  DROP CONSTRAINT IF EXISTS "chk_fee_non_negative",
  ADD CONSTRAINT "chk_fee_non_negative"
    CHECK ("registration_fee" >= 0) NOT VALID;

ALTER TABLE "public"."event_pre_registrations"
  DROP CONSTRAINT IF EXISTS "chk_pre_reg_counts",
  ADD CONSTRAINT "chk_pre_reg_counts"
    CHECK ("accompanying_alumni_count" >= 0 AND "accompanying_family_count" >= 0) NOT VALID;

ALTER TABLE "public"."event_registrations"
  DROP CONSTRAINT IF EXISTS "chk_reg_counts",
  ADD CONSTRAINT "chk_reg_counts"
    CHECK ("accompanying_alumni_count" >= 0 AND "accompanying_family_count" >= 0) NOT VALID,
  DROP CONSTRAINT IF EXISTS "chk_reg_amounts",
  ADD CONSTRAINT "chk_reg_amounts"
    CHECK (
      "registration_fee" >= 0
      AND "voluntary_contribution" >= 0
      AND "total_amount" = "registration_fee" + "voluntary_contribution"
    ) NOT VALID,
  DROP CONSTRAINT IF EXISTS "chk_reg_utr_last4",
  ADD CONSTRAINT "chk_reg_utr_last4"
    CHECK ("utr_last4" IS NULL OR "utr_last4" ~ '^[0-9]{4}$') NOT VALID;

-- 4. Faster lookups as data grows over many events ---------------------------
CREATE INDEX IF NOT EXISTS "idx_association_members_email" ON "public"."association_members" ("email");
CREATE INDEX IF NOT EXISTS "idx_event_reg_event_id" ON "public"."event_registrations" ("event_id");
CREATE INDEX IF NOT EXISTS "idx_fee_config_event_id" ON "public"."event_fee_configurations" ("event_id");

COMMIT;

NOTIFY pgrst, 'reload schema';
