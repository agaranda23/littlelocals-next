-- Migration: add external rating fields (Google Maps) to listings.
-- Run once on Supabase. Safe to re-run (uses IF NOT EXISTS).
--
-- Context: every listing renders "No reviews yet" because we have no
-- real review density. Until on-platform reviews land, surfacing
-- existing external ratings (Google Maps especially) gives parents
-- the social proof they need to convert.
--
-- These fields are populated manually (founder/admin) or via a
-- one-off script — Google Maps doesn't have a free scrape path
-- through our tooling and we don't yet have the Places API wired up.
-- A small "Rated X.X on Google · N reviews" pill renders on listing
-- detail when these are set.

ALTER TABLE listings
  ADD COLUMN IF NOT EXISTS google_rating numeric(2,1)
    CHECK (google_rating IS NULL OR (google_rating >= 0 AND google_rating <= 5)),
  ADD COLUMN IF NOT EXISTS google_review_count int
    CHECK (google_review_count IS NULL OR google_review_count >= 0),
  ADD COLUMN IF NOT EXISTS google_maps_url text;
