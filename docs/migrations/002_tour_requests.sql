-- Migration: create tour_requests table for nursery tour bookings.
-- Run once on Supabase. Safe to re-run (uses IF NOT EXISTS).
--
-- Context: nurseries don't sell online — tours do. This table captures
-- parent-initiated tour requests so the founder/provider can follow up.
-- Each row represents one parent asking to visit one nursery on or
-- around a preferred date. Replaces the meaningless "Book now" handoff
-- for the nursery category with an on-platform lead-capture form.

CREATE TABLE IF NOT EXISTS tour_requests (
  id BIGSERIAL PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  listing_id BIGINT REFERENCES listings(id) ON DELETE CASCADE,
  parent_name TEXT NOT NULL,
  parent_email TEXT NOT NULL,
  parent_phone TEXT,
  child_age TEXT,            -- e.g. 'under_6mo', '6_to_12mo', '1_to_2yr', '2_to_3yr', '3_to_4yr'
  preferred_date DATE NOT NULL,
  alternative_date DATE,
  time_window TEXT CHECK (time_window IS NULL OR time_window IN ('morning', 'afternoon', 'either')),
  message TEXT,
  status TEXT DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'visited', 'closed'))
);

-- Admin lookups by listing
CREATE INDEX IF NOT EXISTS tour_requests_listing_id_idx ON tour_requests(listing_id);

-- Chronological admin queries (recent first)
CREATE INDEX IF NOT EXISTS tour_requests_created_at_idx ON tour_requests(created_at DESC);

-- Status filter for triage views ("new requests only")
CREATE INDEX IF NOT EXISTS tour_requests_status_idx ON tour_requests(status) WHERE status = 'new';
