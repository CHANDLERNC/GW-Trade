-- ============================================================
-- GZW Market — Keys Schema Migration
-- Run AFTER schema.sql, trades.sql, and price_history.sql
-- ============================================================
-- Adds per-key price tracking via a normalized key_name field.
-- Price history is now KEYS ONLY — other categories no longer
-- feed into structured market analytics.
-- ============================================================

-- ── 1. Add key_name to listings ──────────────────────────────
-- Populated only when category = 'keys'.
-- Stores the exact canonical key name from the master key list.
ALTER TABLE listings
  ADD COLUMN IF NOT EXISTS key_name TEXT;

CREATE INDEX IF NOT EXISTS idx_listings_key_name
  ON listings (key_name)
  WHERE key_name IS NOT NULL;

-- ── 2. Add key_name to price_history ────────────────────────
-- Enables exact, normalized lookups instead of fuzzy ilike on title.
ALTER TABLE price_history
  ADD COLUMN IF NOT EXISTS key_name TEXT;

CREATE INDEX IF NOT EXISTS idx_price_history_key_name
  ON price_history (key_name)
  WHERE key_name IS NOT NULL;

-- ── 3. Update trigger: keys-only price history ───────────────
-- Replaces the previous trigger function from price_history.sql.
-- Now only snapshots trades for listings with category = 'keys'.
-- Non-key categories (gear, items) no longer create price history.
CREATE OR REPLACE FUNCTION handle_price_history()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_listing listings%ROWTYPE;
BEGIN
  -- Only fire when completed_at transitions NULL → value
  IF OLD.completed_at IS NOT NULL OR NEW.completed_at IS NULL THEN
    RETURN NEW;
  END IF;

  -- Only snapshot if trade has a linked listing
  IF NEW.listing_id IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT * INTO v_listing FROM listings WHERE id = NEW.listing_id;

  -- Only track price history for key listings
  IF FOUND AND v_listing.category = 'keys' THEN
    INSERT INTO price_history (
      item_name,
      key_name,
      want_in_return,
      faction,
      category,
      listing_id,
      completed_at
    ) VALUES (
      v_listing.title,
      v_listing.key_name,
      v_listing.want_in_return,
      v_listing.faction,
      v_listing.category,
      v_listing.id,
      NEW.completed_at
    );
  END IF;

  RETURN NEW;
END;
$$;

-- Trigger is already registered on trades from price_history.sql;
-- the CREATE OR REPLACE above updates the function body in-place.
-- Re-register it here in case this file runs on a fresh DB:
DROP TRIGGER IF EXISTS on_trade_price_history ON trades;
CREATE TRIGGER on_trade_price_history
  AFTER UPDATE ON trades
  FOR EACH ROW EXECUTE FUNCTION handle_price_history();
