-- Migration: add class-specific fields to the listings table.
-- Run once on Supabase. Safe to re-run (uses IF NOT EXISTS).
--
-- Context: nurseries got the first-class treatment in PRs 6 & 10
-- (Ofsted, funded hours, fees, capacity, outdoor space, languages,
-- sibling discount, holiday closures). Classes were left on the
-- generic listing template. This PR brings them up to parity with
-- the things parents actually decide a class on:
--
--   - DBS-checked instructors  → trust
--   - Governing body / accreditation → quality signal (STA, FA, etc.)
--   - Max class size → quality signal
--   - Term schedule → planning
--   - Cancellation policy → flexibility / financial risk
--   - What to bring → logistical clarity
--
-- All nullable. UI conditionally renders each when set. The provider
-- edit form gates this section on isClass(listing), defined in code
-- as any category matching common class-like values (class, club,
-- sport, music, dance, arts, languages, martial arts).
--
-- sibling_discount and holiday_closures already exist from PR 10 —
-- they're shared with the nursery section and re-used here.

ALTER TABLE listings
  ADD COLUMN IF NOT EXISTS dbs_checked boolean,
  ADD COLUMN IF NOT EXISTS governing_body text,
  ADD COLUMN IF NOT EXISTS governing_body_url text,
  ADD COLUMN IF NOT EXISTS max_class_size int
    CHECK (max_class_size IS NULL OR max_class_size > 0),
  ADD COLUMN IF NOT EXISTS term_schedule text,
  ADD COLUMN IF NOT EXISTS cancellation_policy text,
  ADD COLUMN IF NOT EXISTS what_to_bring text;
