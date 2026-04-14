-- ============================================================
-- GZW Market — Price History
-- Run AFTER schema.sql and trades.sql
-- ============================================================
-- Snapshots item + trade data when a trade completes so buyers/sellers
-- can see what similar items have traded for recently.
-- This is a barter economy — "price" = what was offered in return.
-- ============================================================

CREATE TABLE IF NOT EXISTS price_history (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_name       TEXT NOT NULL,         -- listing.title at time of trade
  want_in_return  TEXT,                  -- listing.want_in_return at time of trade
  faction         TEXT,                  -- listing.faction
  category        TEXT,                  -- listing.category
  listing_id      UUID REFERENCES listings(id) ON DELETE SET NULL,
  completed_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE price_history ENABLE ROW LEVEL SECURITY;

-- Public read — anyone can see market history
CREATE POLICY "price_history_select" ON price_history
  FOR SELECT USING (true);

-- Only the trigger (SECURITY DEFINER) may insert
CREATE POLICY "price_history_trigger_insert" ON price_history
  FOR INSERT WITH CHECK (false);

-- ── Index for fast item-name lookups ─────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_price_history_item ON price_history (item_name);
CREATE INDEX IF NOT EXISTS idx_price_history_completed ON price_history (completed_at DESC);

-- ── Trigger: snapshot listing data when trade completes ───────────────────────
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

  IF FOUND THEN
    INSERT INTO price_history (item_name, want_in_return, faction, category, listing_id, completed_at)
    VALUES (
      v_listing.title,
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

DROP TRIGGER IF EXISTS on_trade_price_history ON trades;
CREATE TRIGGER on_trade_price_history
  AFTER UPDATE ON trades
  FOR EACH ROW EXECUTE FUNCTION handle_price_history();
