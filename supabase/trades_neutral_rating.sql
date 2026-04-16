-- ============================================================
-- GZW Market — Neutral Rating Migration
-- Run this in your Supabase SQL Editor AFTER trades.sql
-- ============================================================
-- Changes:
--   • is_positive is now nullable (NULL = neutral / "trade completed")
--   • handle_rating_inserted skips counters for neutral ratings
--   • auto_rate_expired_trades() inserts neutral ratings for both
--     parties 72h after trade completion if they haven't rated
--   • pg_cron job runs this every hour (requires pg_cron extension)
-- ============================================================


-- ── 1. Make is_positive nullable ─────────────────────────────────────────────

ALTER TABLE trade_ratings
  ALTER COLUMN is_positive DROP NOT NULL;


-- ── 2. Update rating trigger to skip counters for neutral ─────────────────────
-- NULL is_positive = neutral — no positive/negative counter change.

CREATE OR REPLACE FUNCTION handle_rating_inserted()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_positive IS TRUE THEN
    UPDATE profiles SET ratings_positive = ratings_positive + 1 WHERE id = NEW.rated_id;
  ELSIF NEW.is_positive IS FALSE THEN
    UPDATE profiles SET ratings_negative = ratings_negative + 1 WHERE id = NEW.rated_id;
  END IF;
  -- NULL (neutral) — trade acknowledged, no reputation change
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ── 3. Auto-neutral function ──────────────────────────────────────────────────
-- Inserts neutral (is_positive = NULL) ratings for any party who hasn't rated
-- a trade that completed more than 72 hours ago.
-- Runs as SECURITY DEFINER to bypass RLS (this is a system action, not a user).

CREATE OR REPLACE FUNCTION auto_rate_expired_trades()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Insert neutral rating for party_one if they haven't rated yet
  INSERT INTO trade_ratings (trade_id, rater_id, rated_id, is_positive)
  SELECT t.id, t.party_one, t.party_two, NULL
  FROM trades t
  WHERE t.completed_at < now() - interval '72 hours'
    AND NOT EXISTS (
      SELECT 1 FROM trade_ratings tr
      WHERE tr.trade_id = t.id AND tr.rater_id = t.party_one
    )
  ON CONFLICT (trade_id, rater_id) DO NOTHING;

  -- Insert neutral rating for party_two if they haven't rated yet
  INSERT INTO trade_ratings (trade_id, rater_id, rated_id, is_positive)
  SELECT t.id, t.party_two, t.party_one, NULL
  FROM trades t
  WHERE t.completed_at < now() - interval '72 hours'
    AND NOT EXISTS (
      SELECT 1 FROM trade_ratings tr
      WHERE tr.trade_id = t.id AND tr.rater_id = t.party_two
    )
  ON CONFLICT (trade_id, rater_id) DO NOTHING;
END;
$$;

-- Only superuser/service role may call this directly
REVOKE ALL ON FUNCTION auto_rate_expired_trades() FROM PUBLIC;


-- ── 4. pg_cron schedule ───────────────────────────────────────────────────────
-- Requires pg_cron extension (enabled under Database → Extensions in Supabase).
-- Runs every hour at :00. Safe to run repeatedly — ON CONFLICT guards duplicates.

SELECT cron.schedule(
  'auto-neutral-trade-ratings',   -- job name (unique)
  '0 * * * *',                    -- every hour
  $$ SELECT auto_rate_expired_trades(); $$
);
