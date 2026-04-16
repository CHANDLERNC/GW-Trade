-- ============================================================
-- GZW Market — Rating Cooldown Fix
-- Run in Supabase SQL Editor AFTER trades.sql
-- ============================================================
-- Problem: pair_cooldown was checked in confirm_trade, which
-- blocked two players from *completing* more than one trade
-- per 8 hours. Intent was only to limit *ratings* per pair.
--
-- Fix:
--   • Remove pair_cooldown from confirm_trade entirely
--     (trades between the same pair are now unlimited)
--   • Add 8-hour cooldown to ratings_insert RLS policy
--     (only one positive/negative rating per pair per 8h)
--   • Neutral ratings (NULL is_positive) are exempt from
--     the cooldown — they're non-reputation and auto-applied
-- ============================================================


-- ── 1. Rewrite confirm_trade — cooldown removed ───────────────────────────────

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
BEGIN
  -- Load conversation
  SELECT * INTO v_conv
  FROM conversations
  WHERE id = p_conversation_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'conversation_not_found';
  END IF;

  -- Caller must be a participant
  IF v_caller != v_conv.participant_one AND v_caller != v_conv.participant_two THEN
    RAISE EXCEPTION 'not_a_participant';
  END IF;

  v_partner_id := CASE
    WHEN v_caller = v_conv.participant_one THEN v_conv.participant_two
    ELSE v_conv.participant_one
  END;

  -- Both parties must have sent at least one message
  SELECT COUNT(DISTINCT sender_id) INTO v_sender_count
  FROM messages
  WHERE conversation_id = p_conversation_id;

  IF v_sender_count < 2 THEN
    RAISE EXCEPTION 'insufficient_messages';
  END IF;

  -- Try to lock existing trade record
  SELECT * INTO v_trade
  FROM trades
  WHERE conversation_id = p_conversation_id
  FOR UPDATE;

  IF NOT FOUND THEN
    -- First party confirming — create the record
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

    -- If ON CONFLICT fired, another request already inserted — reload
    IF v_trade.id IS NULL THEN
      SELECT * INTO v_trade FROM trades WHERE conversation_id = p_conversation_id FOR UPDATE;
    END IF;

  ELSE
    -- Trade already exists
    IF v_trade.completed_at IS NOT NULL THEN
      -- Already completed — idempotent return
      RETURN QUERY SELECT * FROM trades WHERE id = v_trade.id;
      RETURN;
    END IF;

    -- Set only the caller's confirmation flag
    IF v_caller = v_trade.party_one THEN
      UPDATE trades SET party_one_confirmed = true WHERE id = v_trade.id;
    ELSIF v_caller = v_trade.party_two THEN
      UPDATE trades SET party_two_confirmed = true WHERE id = v_trade.id;
    ELSE
      RAISE EXCEPTION 'not_a_party_to_trade';
    END IF;

    -- Reload to get fresh flags
    SELECT * INTO v_trade FROM trades WHERE id = v_trade.id;

    -- Complete server-side when both confirmed
    IF v_trade.party_one_confirmed AND v_trade.party_two_confirmed THEN
      UPDATE trades SET completed_at = now() WHERE id = v_trade.id;
    END IF;
  END IF;

  RETURN QUERY SELECT * FROM trades WHERE id = v_trade.id;
END;
$$;


-- ── 2. Update ratings_insert RLS — add 8-hour rating cooldown ────────────────
-- Allows unlimited trades between the same pair.
-- Limits positive/negative ratings to one per pair per 8 hours.
-- Neutral ratings (is_positive IS NULL) are always allowed.

DROP POLICY IF EXISTS "ratings_insert" ON trade_ratings;

CREATE POLICY "ratings_insert" ON trade_ratings
  FOR INSERT WITH CHECK (
    -- Must be the rater
    auth.uid() = rater_id
    -- No self-rating
    AND rater_id != rated_id
    -- Must be a party to a completed trade with the rated user
    AND EXISTS (
      SELECT 1 FROM trades t
      WHERE t.id = trade_id
        AND t.completed_at IS NOT NULL
        AND (
          (t.party_one = auth.uid() AND t.party_two = rated_id)
          OR
          (t.party_two = auth.uid() AND t.party_one = rated_id)
        )
    )
    -- 8-hour rating cooldown per pair (neutral ratings exempt)
    AND (
      is_positive IS NULL
      OR NOT EXISTS (
        SELECT 1 FROM trade_ratings tr
        WHERE tr.rater_id = auth.uid()
          AND tr.rated_id = rated_id
          AND tr.is_positive IS NOT NULL
          AND tr.created_at > now() - interval '8 hours'
      )
    )
  );
