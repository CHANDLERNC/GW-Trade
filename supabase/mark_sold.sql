-- ============================================================
-- GZW Market — Mark as Sold + Admin Price History Controls
-- Run AFTER keys_schema.sql
-- ============================================================

-- ── 1. RPC: mark_listing_sold ────────────────────────────────
-- Called by the listing owner to manually close a sale.
-- Sets listing is_active = false.
-- For key listings: records a price_history entry using the
-- provided sold price (or falls back to want_in_return).
CREATE OR REPLACE FUNCTION mark_listing_sold(
  p_listing_id  UUID,
  p_sold_price  TEXT DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_listing listings%ROWTYPE;
BEGIN
  SELECT * INTO v_listing FROM listings WHERE id = p_listing_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Listing not found';
  END IF;

  IF v_listing.user_id != auth.uid() THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  -- Deactivate the listing
  UPDATE listings SET is_active = false WHERE id = p_listing_id;

  -- Record price history for key listings only
  IF v_listing.category = 'keys' THEN
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
      COALESCE(NULLIF(TRIM(p_sold_price), ''), v_listing.want_in_return),
      v_listing.faction,
      v_listing.category,
      v_listing.id,
      now()
    );
  END IF;
END;
$$;

-- Allow authenticated users to call the RPC
GRANT EXECUTE ON FUNCTION mark_listing_sold(UUID, TEXT) TO authenticated;

-- ── 2. Admin RLS: edit + delete price_history entries ────────
-- Admins can correct manipulated prices or remove bad entries.

-- UPDATE — admin only
CREATE POLICY "price_history_admin_update" ON price_history
  FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
  );

-- DELETE — admin only
CREATE POLICY "price_history_admin_delete" ON price_history
  FOR DELETE
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
  );
