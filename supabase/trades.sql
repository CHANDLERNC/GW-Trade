-- ============================================================
-- GZW Market — Trades & Rating System
-- Run this in your Supabase SQL Editor
-- Includes all anti-abuse hardening (no separate file needed)
-- ============================================================


-- ── Profile columns ──────────────────────────────────────────────────────────

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS trades_completed INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS ratings_positive INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS ratings_negative INTEGER NOT NULL DEFAULT 0;


-- ── Trades table ─────────────────────────────────────────────────────────────
-- One record per conversation. Both parties must confirm before ratings unlock.
-- party_one != party_two enforced at DB level (no self-trading).

CREATE TABLE IF NOT EXISTS trades (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id     UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  listing_id          UUID REFERENCES listings(id) ON DELETE SET NULL,
  party_one           UUID NOT NULL REFERENCES profiles(id),
  party_two           UUID NOT NULL REFERENCES profiles(id),
  party_one_confirmed BOOLEAN NOT NULL DEFAULT false,
  party_two_confirmed BOOLEAN NOT NULL DEFAULT false,
  completed_at        TIMESTAMPTZ,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(conversation_id),
  CONSTRAINT trades_no_self_trade CHECK (party_one != party_two)
);


-- ── Trade ratings table ───────────────────────────────────────────────────────
-- One row per rater per trade (max 2 rows per trade).
-- rater_id != rated_id enforced at DB level (no self-rating).

CREATE TABLE IF NOT EXISTS trade_ratings (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trade_id    UUID NOT NULL REFERENCES trades(id) ON DELETE CASCADE,
  rater_id    UUID NOT NULL REFERENCES profiles(id),
  rated_id    UUID NOT NULL REFERENCES profiles(id),
  is_positive BOOLEAN NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(trade_id, rater_id),
  CONSTRAINT ratings_no_self_rate CHECK (rater_id != rated_id)
);


-- ── RLS ───────────────────────────────────────────────────────────────────────

ALTER TABLE trades ENABLE ROW LEVEL SECURITY;
ALTER TABLE trade_ratings ENABLE ROW LEVEL SECURITY;

-- Participants can read their own trades
CREATE POLICY "trades_select" ON trades
  FOR SELECT USING (auth.uid() = party_one OR auth.uid() = party_two);

-- No direct INSERT or UPDATE on trades — all writes go through confirm_trade RPC

-- Anyone can read ratings (public reputation)
CREATE POLICY "ratings_select" ON trade_ratings
  FOR SELECT USING (true);

-- Hardened insert: rater must be a party to a completed trade, rated must be partner
CREATE POLICY "ratings_insert" ON trade_ratings
  FOR INSERT WITH CHECK (
    auth.uid() = rater_id
    AND rater_id != rated_id
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
  );


-- ── confirm_trade RPC ─────────────────────────────────────────────────────────
-- Sole write path for trades. Runs as SECURITY DEFINER (bypasses RLS safely).
-- Enforces all anti-abuse rules server-side so the client can't bypass them.
--
-- Anti-abuse:
--   • Both parties must have sent ≥1 message (blocks zero-interaction bot trades)
--   • 8-hour cooldown per user pair (blocks rating farming)
--   • Only sets the caller's own confirmation flag (can't flip partner's)
--   • Sets completed_at server-side (client can never forge it)
--   • Race condition safe: ON CONFLICT + FOR UPDATE lock
--
-- Error codes returned to the client:
--   insufficient_messages  — both parties haven't messaged yet
--   pair_cooldown          — this pair completed a trade within 8 hours
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
    -- First party confirming — check cooldown then create the record
    SELECT COUNT(*) INTO v_cooldown_ct
    FROM trades
    WHERE completed_at > now() - interval '8 hours'
      AND (
        (party_one = v_caller     AND party_two = v_partner_id) OR
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

    -- 8-hour pair cooldown (second-party path)
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

-- Only authenticated users may call this RPC
REVOKE ALL ON FUNCTION confirm_trade(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION confirm_trade(UUID) TO authenticated;


-- ── Triggers ──────────────────────────────────────────────────────────────────

-- Increment trades_completed on both profiles when a trade completes
CREATE OR REPLACE FUNCTION handle_trade_completed()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.completed_at IS NULL AND NEW.completed_at IS NOT NULL THEN
    UPDATE profiles SET trades_completed = trades_completed + 1
    WHERE id IN (NEW.party_one, NEW.party_two);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_trade_completed ON trades;
CREATE TRIGGER on_trade_completed
  AFTER UPDATE ON trades
  FOR EACH ROW EXECUTE FUNCTION handle_trade_completed();

-- Increment rating counters on the rated profile when a rating is submitted
CREATE OR REPLACE FUNCTION handle_rating_inserted()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_positive THEN
    UPDATE profiles SET ratings_positive = ratings_positive + 1 WHERE id = NEW.rated_id;
  ELSE
    UPDATE profiles SET ratings_negative = ratings_negative + 1 WHERE id = NEW.rated_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_rating_inserted ON trade_ratings;
CREATE TRIGGER on_rating_inserted
  AFTER INSERT ON trade_ratings
  FOR EACH ROW EXECUTE FUNCTION handle_rating_inserted();
