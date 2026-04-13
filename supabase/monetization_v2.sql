-- ============================================================
-- GZW Market — Monetization v2
-- Run AFTER schema.sql, membership.sql, membership_v2.sql,
-- early_access.sql, and updates.sql
-- ============================================================

-- ── New profile columns ───────────────────────────────────────────────────────

-- When early access expires (now + 30 days from claim time)
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS early_access_expires_at TIMESTAMPTZ;

-- Early adopter discount tracking (NOT yet processed — placeholder only)
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS early_adopter_discount_claimed      BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS early_adopter_discount_expires_at   TIMESTAMPTZ;

-- ── Listing priority rank ─────────────────────────────────────────────────────
-- 4=lifetime  3=premium  2=temp_premium(early adopter)  1=free
ALTER TABLE listings
  ADD COLUMN IF NOT EXISTS priority_rank INTEGER NOT NULL DEFAULT 1;

CREATE INDEX IF NOT EXISTS idx_listings_priority
  ON listings (priority_rank DESC, created_at DESC)
  WHERE is_active = true;

-- ── Updated claim_early_access() ─────────────────────────────────────────────
--
-- KEY CHANGE vs v1:
--   - Does NOT set is_member = true (reserved for paid RevenueCat events)
--   - Sets is_early_adopter + early_access_expires_at (30-day window)
--   - Access level is derived in-app via getAccessLevel()
--
CREATE OR REPLACE FUNCTION claim_early_access()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid        := auth.uid();
  v_claimed boolean;
  v_deadline timestamptz := '2026-05-02T23:59:59Z';
BEGIN
  IF v_user_id IS NULL THEN
    RETURN json_build_object('error', 'Not authenticated');
  END IF;

  SELECT early_access_claimed INTO v_claimed
    FROM profiles WHERE id = v_user_id;

  IF v_claimed THEN
    RETURN json_build_object('error', 'Already claimed');
  END IF;

  IF NOW() > v_deadline THEN
    RETURN json_build_object('error', 'Early access period has ended');
  END IF;

  UPDATE profiles SET
    is_early_adopter             = true,
    early_access_claimed         = true,
    early_access_expires_at      = NOW() + INTERVAL '30 days',
    early_adopter_discount_claimed = false
    -- NOTE: is_member intentionally NOT set here.
    -- is_member / is_lifetime_member are only set by the RevenueCat webhook
    -- when MONETIZATION_ENABLED = true.
  WHERE id = v_user_id;

  RETURN json_build_object('success', true);
END;
$$;

GRANT EXECUTE ON FUNCTION claim_early_access() TO authenticated;

-- ── Auto-expire early access (run as a cron job via pg_cron or Supabase) ─────
-- SELECT cron.schedule('expire-early-access', '0 * * * *', $$
--   -- Nothing to do in DB — expiry is checked in-app via early_access_expires_at.
--   -- Listings created while temp_premium retain their priority_rank.
-- $$);
