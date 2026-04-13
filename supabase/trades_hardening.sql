-- ============================================================
-- GZW Market — Trade & Rating Anti-Abuse Hardening
-- Run this AFTER trades.sql
--
-- Fixes:
--   1. Constraint: trades can't have party_one == party_two
--   2. Constraint: ratings can't have rater_id == rated_id
--   3. Drop permissive client-side INSERT/UPDATE policies on trades
--   4. Replace them with a SECURITY DEFINER RPC (confirm_trade) that:
--        a. Verifies caller is a conversation participant
--        b. Requires both parties to have sent at least one message
--        c. Enforces an 8-hour cooldown — one ratable trade per pair per 8 hours
--        d. Only sets the CALLER'S confirmation flag (can't flip partner's)
--        e. Sets completed_at server-side when both confirmed (client can't forge it)
--   5. Harden ratings_insert RLS to verify:
--        a. Trade is actually completed
--        b. Rater is a party to that specific trade
--        c. Rated is the other party (not rater, not a random user)
-- ============================================================


-- ── 1. Table-level constraints ──────────────────────────────────────────────

-- No self-trading (also blocks bot accounts messaging themselves)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'trades_no_self_trade'
  ) THEN
    ALTER TABLE trades ADD CONSTRAINT trades_no_self_trade CHECK (party_one != party_two);
  END IF;
END $$;

-- No self-rating (belt + suspenders — RLS also blocks this)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'ratings_no_self_rate'
  ) THEN
    ALTER TABLE trade_ratings ADD CONSTRAINT ratings_no_self_rate CHECK (rater_id != rated_id);
  END IF;
END $$;


-- ── 2. Drop the permissive client-side policies ─────────────────────────────

-- Clients no longer INSERT or UPDATE trades directly — the RPC does it
DROP POLICY IF EXISTS "trades_insert" ON trades;
DROP POLICY IF EXISTS "trades_update" ON trades;


-- ── 3. confirm_trade RPC ─────────────────────────────────────────────────────
--
-- Single entry-point for both "first party confirms" and "second party confirms".
-- Runs as SECURITY DEFINER (postgres role) so it bypasses RLS and can safely
-- mutate trades — but it enforces all invariants itself.
--
-- Returns the updated trade row.
-- Raises named exceptions the client maps to user-facing messages:
--   insufficient_messages  — both parties haven't sent a message yet
--   pair_cooldown          — this pair completed a rated trade within 7 days
--   not_a_participant      — caller isn't in this conversation
--   conversation_not_found — bad conversation_id
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION confirm_trade(p_conversation_id UUID)
RETURNS SETOF trades
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_caller       UUID := auth.uid();
  v_conv         conversations%ROWTYPE;
  v_trade        trades%ROWTYPE;
  v_partner_id   UUID;
  v_sender_count INT;
  v_cooldown_ct  INT;
BEGIN
  -- ── Load conversation ──────────────────────────────────────────────────────
  SELECT * INTO v_conv
  FROM conversations
  WHERE id = p_conversation_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'conversation_not_found';
  END IF;

  -- ── Caller must be a participant ───────────────────────────────────────────
  IF v_caller != v_conv.participant_one AND v_caller != v_conv.participant_two THEN
    RAISE EXCEPTION 'not_a_participant';
  END IF;

  v_partner_id := CASE
    WHEN v_caller = v_conv.participant_one THEN v_conv.participant_two
    ELSE v_conv.participant_one
  END;

  -- ── Both parties must have sent ≥1 message ─────────────────────────────────
  -- Prevents zero-interaction bot trades
  SELECT COUNT(DISTINCT sender_id) INTO v_sender_count
  FROM messages
  WHERE conversation_id = p_conversation_id;

  IF v_sender_count < 2 THEN
    RAISE EXCEPTION 'insufficient_messages';
  END IF;

  -- ── Try to lock existing trade ─────────────────────────────────────────────
  SELECT * INTO v_trade
  FROM trades
  WHERE conversation_id = p_conversation_id
  FOR UPDATE;

  IF NOT FOUND THEN
    -- ── First party confirming — create the trade record ────────────────────

    -- 8-hour pair cooldown: only 1 ratable trade per pair per 8 hours
    SELECT COUNT(*) INTO v_cooldown_ct
    FROM trades
    WHERE completed_at > now() - interval '8 hours'
      AND (
        (party_one = v_caller    AND party_two = v_partner_id) OR
        (party_one = v_partner_id AND party_two = v_caller)
      );

    IF v_cooldown_ct > 0 THEN
      RAISE EXCEPTION 'pair_cooldown';
    END IF;

    INSERT INTO trades (
      conversation_id,
      listing_id,
      party_one,
      party_two,
      party_one_confirmed
    ) VALUES (
      p_conversation_id,
      v_conv.listing_id,
      v_caller,
      v_partner_id,
      true
    )
    ON CONFLICT (conversation_id) DO NOTHING  -- race-condition guard
    RETURNING * INTO v_trade;

    -- If ON CONFLICT fired, another request already created it — reload
    IF v_trade.id IS NULL THEN
      SELECT * INTO v_trade FROM trades WHERE conversation_id = p_conversation_id FOR UPDATE;
    END IF;

  ELSE
    -- ── Trade already exists ────────────────────────────────────────────────
    IF v_trade.completed_at IS NOT NULL THEN
      -- Already completed — idempotent return
      RETURN QUERY SELECT * FROM trades WHERE id = v_trade.id;
      RETURN;
    END IF;

    -- 8-hour pair cooldown check (second-party path)
    SELECT COUNT(*) INTO v_cooldown_ct
    FROM trades
    WHERE id != v_trade.id
      AND completed_at > now() - interval '8 hours'
      AND (
        (party_one = v_trade.party_one AND party_two = v_trade.party_two) OR
        (party_one = v_trade.party_two AND party_two = v_trade.party_one)
      );

    IF v_cooldown_ct > 0 THEN
      RAISE EXCEPTION 'pair_cooldown';
    END IF;

    -- ── Set ONLY the caller's confirmation flag ─────────────────────────────
    IF v_caller = v_trade.party_one THEN
      UPDATE trades SET party_one_confirmed = true WHERE id = v_trade.id;
    ELSIF v_caller = v_trade.party_two THEN
      UPDATE trades SET party_two_confirmed = true WHERE id = v_trade.id;
    ELSE
      RAISE EXCEPTION 'not_a_party_to_trade';
    END IF;

    -- Reload to get fresh flag state
    SELECT * INTO v_trade FROM trades WHERE id = v_trade.id;

    -- ── Complete the trade server-side when both parties confirmed ───────────
    IF v_trade.party_one_confirmed AND v_trade.party_two_confirmed THEN
      UPDATE trades SET completed_at = now() WHERE id = v_trade.id;
    END IF;
  END IF;

  RETURN QUERY SELECT * FROM trades WHERE id = v_trade.id;
END;
$$;

-- Only authenticated users may call this RPC
REVOKE ALL ON FUNCTION confirm_trade(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION confirm_trade(UUID) TO authenticated;


-- ── 4. Harden ratings_insert RLS ────────────────────────────────────────────
--
-- Old policy only checked: auth.uid() = rater_id
-- New policy checks ALL of:
--   • You're submitting as yourself
--   • The trade is completed
--   • You are actually a party to that trade
--   • rated_id is your trade partner (not yourself, not a random user)
-- ─────────────────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "ratings_insert" ON trade_ratings;

CREATE POLICY "ratings_insert" ON trade_ratings
  FOR INSERT WITH CHECK (
    -- Must be submitting as yourself
    auth.uid() = rater_id

    -- No self-rating
    AND rater_id != rated_id

    -- Trade must be completed AND rater must be a party AND rated must be partner
    AND EXISTS (
      SELECT 1 FROM trades t
      WHERE t.id = trade_id
        AND t.completed_at IS NOT NULL
        AND (
          -- Caller is party_one, partner is party_two
          (t.party_one = auth.uid() AND t.party_two = rated_id)
          OR
          -- Caller is party_two, partner is party_one
          (t.party_two = auth.uid() AND t.party_one = rated_id)
        )
    )
  );


-- ── Notes ────────────────────────────────────────────────────────────────────
--
-- What this prevents:
--   ✓ Self-rating (rater_id != rated_id constraint + RLS)
--   ✓ Rating without a completed trade (completed_at check)
--   ✓ Rating someone not in your trade (party membership check)
--   ✓ Client forging completed_at (moved server-side into RPC)
--   ✓ Flipping partner's confirmation flag (RPC only sets caller's flag)
--   ✓ Self-trading / bot creating trade with themselves (party_one != party_two)
--   ✓ Zero-interaction bot trades (requires 2 distinct message senders)
--   ✓ Pair farming (8-hour cooldown per unique pair)
--   ✓ Rating the same trade twice (UNIQUE(trade_id, rater_id) from trades.sql)
--   ✓ Unauthenticated inserts (RLS + SECURITY DEFINER checks auth.uid())
-- ─────────────────────────────────────────────────────────────────────────────
