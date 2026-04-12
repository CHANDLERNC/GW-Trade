CREATE TABLE IF NOT EXISTS comments (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID        NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  user_id    UUID        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content    TEXT        NOT NULL CHECK (char_length(content) BETWEEN 1 AND 500),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_comments_listing ON comments (listing_id, created_at);

ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

-- Anyone can read comments
CREATE POLICY "comments_read" ON comments
  FOR SELECT TO public USING (true);

-- Authenticated users can post their own comments
CREATE POLICY "comments_insert" ON comments
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own comment;
-- listing owner can moderate (delete any comment on their listing)
CREATE POLICY "comments_delete" ON comments
  FOR DELETE TO authenticated
  USING (
    auth.uid() = user_id
    OR auth.uid() = (SELECT user_id FROM listings WHERE id = listing_id)
  );

-- Enable Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE comments;
