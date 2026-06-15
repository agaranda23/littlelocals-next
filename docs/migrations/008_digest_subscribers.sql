-- Migration: create subscribers table for the weekly digest.
-- Run once on Supabase. Safe to re-run (uses IF NOT EXISTS).
--
-- Context: PR 18 launches the weekly "This weekend in Ealing" email.
-- Single opt-in via a signup form on the home + listings. Every email
-- has an unsubscribe link tokenised per-subscriber so we honour PECR
-- without round-tripping login.
--
-- The unsubscribe_token is a UUID generated on insert and used in the
-- unsubscribe URL. status='active'/'unsubscribed' is set declaratively
-- so we can keep the row for audit instead of deleting.

CREATE TABLE IF NOT EXISTS subscribers (
  id BIGSERIAL PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  email TEXT NOT NULL UNIQUE,
  name TEXT,
  source TEXT,
    -- where they signed up: 'home', 'listing', 'nurseries', 'admin_import'
  unsubscribe_token UUID NOT NULL DEFAULT gen_random_uuid(),
  status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'unsubscribed', 'bounced')),
  unsubscribed_at TIMESTAMPTZ,
  last_sent_at TIMESTAMPTZ
);

-- Look up by token for unsubscribe handler
CREATE INDEX IF NOT EXISTS subscribers_unsubscribe_token_idx ON subscribers(unsubscribe_token);

-- Send-time query: active subscribers ordered for batching
CREATE INDEX IF NOT EXISTS subscribers_active_idx ON subscribers(created_at DESC) WHERE status = 'active';
