-- ============================================================
-- GZW Market — Trust & Safety: Reports + Blocks
-- Run AFTER schema.sql
-- ============================================================

-- ── Reports ───────────────────────────────────────────────────────────────────
-- Users can report other users (or a specific listing that prompted the report).
-- Reports are write-only for regular users; only admins can read them.

CREATE TABLE IF NOT EXISTS reports (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id      UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  reported_user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  listing_id       UUID REFERENCES listings(id) ON DELETE SET NULL,
  reason           TEXT NOT NULL CHECK (reason IN ('scam', 'harassment', 'spam', 'inappropriate', 'other')),
  details          TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  -- One report per reporter/reported pair — prevents spam
  CONSTRAINT reports_unique_pair UNIQUE (reporter_id, reported_user_id),
  CONSTRAINT reports_no_self_report CHECK (reporter_id != reported_user_id)
);

ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

-- Users can submit reports but never read them (prevents gaming)
CREATE POLICY "reports_insert" ON reports
  FOR INSERT WITH CHECK (auth.uid() = reporter_id);

-- Admins can read all reports
CREATE POLICY "reports_admin_select" ON reports
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
  );

-- ── Blocks ────────────────────────────────────────────────────────────────────
-- Users can block other users. Blocked users' listings are hidden in browse.

CREATE TABLE IF NOT EXISTS blocks (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  blocker_id  UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  blocked_id  UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT blocks_unique UNIQUE (blocker_id, blocked_id),
  CONSTRAINT blocks_no_self_block CHECK (blocker_id != blocked_id)
);

ALTER TABLE blocks ENABLE ROW LEVEL SECURITY;

-- Users can only see and manage their own blocks
CREATE POLICY "blocks_select" ON blocks
  FOR SELECT USING (auth.uid() = blocker_id);

CREATE POLICY "blocks_insert" ON blocks
  FOR INSERT WITH CHECK (auth.uid() = blocker_id);

CREATE POLICY "blocks_delete" ON blocks
  FOR DELETE USING (auth.uid() = blocker_id);

-- ── Indexes ───────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_blocks_blocker ON blocks (blocker_id);
CREATE INDEX IF NOT EXISTS idx_reports_reported ON reports (reported_user_id);
