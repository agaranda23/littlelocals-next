-- Migration: add secondary nursery fields parents care about but rarely see.
-- Run once on Supabase. Safe to re-run (uses IF NOT EXISTS).
--
-- Context: PR 6 added the high-impact nursery fields (Ofsted, funded
-- hours, fees, opening hours). These are the next tier — operational
-- and policy details that parents specifically want when comparing
-- nurseries but most directory sites omit.
--
-- All nullable. UI conditionally renders each when set.

ALTER TABLE listings
  ADD COLUMN IF NOT EXISTS babies_capacity int
    CHECK (babies_capacity IS NULL OR babies_capacity >= 0),
  ADD COLUMN IF NOT EXISTS toddlers_capacity int
    CHECK (toddlers_capacity IS NULL OR toddlers_capacity >= 0),
  ADD COLUMN IF NOT EXISTS preschool_capacity int
    CHECK (preschool_capacity IS NULL OR preschool_capacity >= 0),
  ADD COLUMN IF NOT EXISTS outdoor_space text,
  ADD COLUMN IF NOT EXISTS languages_spoken text[],
  ADD COLUMN IF NOT EXISTS sibling_discount text,
  ADD COLUMN IF NOT EXISTS holiday_closures text;

-- babies_capacity   → number of places for 0–2 year olds
-- toddlers_capacity → number of places for 2–3 year olds
-- preschool_capacity → number of places for 3–4 year olds
-- outdoor_space     → free text e.g. "Large garden + shared rooftop"
-- languages_spoken  → array, e.g. ['English', 'French', 'Polish']
-- sibling_discount  → free text e.g. "10% off second child"
-- holiday_closures  → free text e.g. "Closed Christmas, 2 weeks August, bank holidays"
