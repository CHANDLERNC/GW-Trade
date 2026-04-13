-- ── Trades & Rating System ─────────────────────────────────────────────────

-- Add rating/trade columns to profiles
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS trades_completed INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS ratings_positive INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS ratings_negative INTEGER NOT NULL DEFAULT 0;

-- Trades table — one record per conversation, tracks both parties confirming
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
  UNIQUE(conversation_id)
);

-- Trade ratings — one row per rater per trade (max 2 per trade)
CREATE TABLE IF NOT EXISTS trade_ratings (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trade_id   UUID NOT NULL REFERENCES trades(id) ON DELETE CASCADE,
  rater_id   UUID NOT NULL REFERENCES profiles(id),
  rated_id   UUID NOT NULL REFERENCES profiles(id),
  is_positive BOOLEAN NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(trade_id, rater_id)
);

-- ── RLS ────────────────────────────────────────────────────────────────────

ALTER TABLE trades ENABLE ROW LEVEL SECURITY;
ALTER TABLE trade_ratings ENABLE ROW LEVEL SECURITY;

-- Participants can read their own trades
CREATE POLICY "trades_select" ON trades
  FOR SELECT USING (auth.uid() = party_one OR auth.uid() = party_two);

-- Participants can insert a trade for their conversation
CREATE POLICY "trades_insert" ON trades
  FOR INSERT WITH CHECK (auth.uid() = party_one OR auth.uid() = party_two);

-- Participants can update (confirm) their own trades
CREATE POLICY "trades_update" ON trades
  FOR UPDATE USING (auth.uid() = party_one OR auth.uid() = party_two);

-- Anyone can read ratings (public reputation)
CREATE POLICY "ratings_select" ON trade_ratings
  FOR SELECT USING (true);

-- Only the rater can insert their own rating
CREATE POLICY "ratings_insert" ON trade_ratings
  FOR INSERT WITH CHECK (auth.uid() = rater_id);

-- ── Triggers ───────────────────────────────────────────────────────────────

-- Auto-increment trades_completed on both profiles when trade completes
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

-- Auto-update rating counters on rated profile when a rating is submitted
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
