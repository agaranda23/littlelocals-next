-- Migration: add days-out / attraction-specific fields to listings.
-- Run once on Supabase. Safe to re-run (uses IF NOT EXISTS).
--
-- Context: completes the vertical-upgrade trifecta. Nurseries (PRs 6,
-- 10), classes (PR 11), soft play (PR 16) all got first-class fields;
-- this is days out / attractions (zoos, theme parks, farms, museums).
-- Parents picking a day out decide on: pram access, baby changing,
-- accessibility, free age, family ticket, season open, typical trip
-- length, annual pass value, food options.
--
-- All nullable. UI conditionally renders each when set.

ALTER TABLE listings
  ADD COLUMN IF NOT EXISTS pram_friendly boolean,
  ADD COLUMN IF NOT EXISTS baby_changing boolean,
  ADD COLUMN IF NOT EXISTS accessible boolean,
  ADD COLUMN IF NOT EXISTS free_under_age int
    CHECK (free_under_age IS NULL OR free_under_age >= 0),
  ADD COLUMN IF NOT EXISTS family_ticket_price text,
  ADD COLUMN IF NOT EXISTS season text
    CHECK (season IS NULL OR season IN (
      'year_round', 'summer_only', 'school_holidays_only', 'spring_summer', 'autumn_winter'
    )),
  ADD COLUMN IF NOT EXISTS duration_typical text,
  ADD COLUMN IF NOT EXISTS annual_pass_available boolean,
  ADD COLUMN IF NOT EXISTS food_options text;

-- pram_friendly         → pram access throughout (paths/lifts)
-- baby_changing         → facilities available on site
-- accessible            → wheelchair / step-free where reasonable
-- free_under_age        → e.g. 3 → "Free under 3"
-- family_ticket_price   → "£45 for 2 adults + 2 kids"
-- season                → constrained value, see CHECK list
-- duration_typical      → "Half day", "Full day", "2–3 hours"
-- annual_pass_available → frequent-visitor value signal
-- food_options          → "Café on site + picnic area", "Bring own only", etc.
