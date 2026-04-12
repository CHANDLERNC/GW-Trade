-- ── Early Adopter columns ───────────────────────────────────────────────────
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS is_early_adopter    BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS early_access_claimed BOOLEAN NOT NULL DEFAULT false;

-- ── Secure RPC — called from the app, runs server-side ─────────────────────
-- Validates eligibility, then upgrades the calling user atomically.
CREATE OR REPLACE FUNCTION claim_early_access()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id  uuid            := auth.uid();
  v_claimed  boolean;
  v_deadline timestamptz     := '2026-05-02T23:59:59Z';
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
    is_member             = true,
    is_early_adopter      = true,
    early_access_claimed  = true,
    member_since          = NOW(),
    member_expires_at     = NOW() + INTERVAL '30 days'
  WHERE id = v_user_id;

  RETURN json_build_object('success', true);
END;
$$;

-- Allow any authenticated user to call this function
GRANT EXECUTE ON FUNCTION claim_early_access() TO authenticated;
