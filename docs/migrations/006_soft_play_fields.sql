-- Migration: add soft-play-specific fields to the listings table.
-- Run once on Supabase. Safe to re-run (uses IF NOT EXISTS).
--
-- Context: soft play is the third-largest vertical after nurseries
-- (PRs 6, 10) and classes (PR 11). Parents pick between soft plays on
-- whether there's a baby zone, sock policy, café (for them while kids
-- play), parking, session caps, and what each adult pays. None of
-- those live in the generic listing schema.
--
-- All nullable. UI conditionally renders each when set.

ALTER TABLE listings
  ADD COLUMN IF NOT EXISTS under_2s_area boolean,
  ADD COLUMN IF NOT EXISTS sock_policy text,
  ADD COLUMN IF NOT EXISTS cafe_on_site boolean,
  ADD COLUMN IF NOT EXISTS free_parking boolean,
  ADD COLUMN IF NOT EXISTS max_session_minutes int
    CHECK (max_session_minutes IS NULL OR max_session_minutes > 0),
  ADD COLUMN IF NOT EXISTS adult_price text,
  ADD COLUMN IF NOT EXISTS babies_free_under_months int
    CHECK (babies_free_under_months IS NULL OR babies_free_under_months >= 0);

-- under_2s_area           → dedicated baby/toddler zone (huge factor for under-2 parents)
-- sock_policy             → "Grip socks required, available £2" / "Bare feet ok" / "Socks compulsory"
-- cafe_on_site            → can adults sit and have coffee while kids play
-- free_parking            → matters for car-driving families
-- max_session_minutes     → e.g. 90 (some sites cap sessions, others unlimited)
-- adult_price             → many soft plays charge adults a small fee separately
-- babies_free_under_months → e.g. 12 (free under 1 year)
