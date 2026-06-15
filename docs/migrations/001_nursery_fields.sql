-- Migration: add nursery-specific fields to the listings table.
-- Run once on Supabase. Safe to re-run (uses IF NOT EXISTS).
--
-- Context: nursery listings previously used the generic listing schema,
-- which gave parents none of the information they actually choose a
-- nursery on (Ofsted rating, funded hours, real opening hours, fees).
-- These columns are nullable; existing non-nursery listings are
-- unaffected. UI conditionally renders these fields when category is
-- 'nursery'.

ALTER TABLE listings
  ADD COLUMN IF NOT EXISTS ofsted_rating text
    CHECK (ofsted_rating IS NULL OR ofsted_rating IN (
      'outstanding', 'good', 'requires_improvement', 'inadequate', 'not_yet_inspected'
    )),
  ADD COLUMN IF NOT EXISTS ofsted_report_url text,
  ADD COLUMN IF NOT EXISTS ofsted_inspection_date date,
  ADD COLUMN IF NOT EXISTS funded_hours text[],
  ADD COLUMN IF NOT EXISTS opens_at text,
  ADD COLUMN IF NOT EXISTS closes_at text,
  ADD COLUMN IF NOT EXISTS term_time_only boolean,
  ADD COLUMN IF NOT EXISTS meals_included boolean,
  ADD COLUMN IF NOT EXISTS nursery_fee text,
  ADD COLUMN IF NOT EXISTS waitlist_status text;

-- funded_hours values are strings the UI knows how to render:
--   '15h_universal'  → 15 hours free, all 3–4 year olds
--   '30h_working'    → 30 hours, working parents (9 months to school age)
--   '15h_2yo'        → 15 hours, some 2-year-olds (low-income / disadvantaged)
--   'tax_free'       → Tax-Free Childcare (up to £2,000/yr per child)
--
-- Provider edit UI offers these as checkboxes; listing detail renders
-- them as pills.
