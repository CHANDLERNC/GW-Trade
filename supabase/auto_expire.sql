-- ============================================================
-- GZW Market — automatic membership expiry (pg_cron safety net)
-- ============================================================
-- Run this AFTER enabling pg_cron in:
--   Supabase Dashboard → Database → Extensions → pg_cron (toggle ON)
--
-- This is a fallback. RevenueCat webhooks handle expiry in real-time.
-- pg_cron catches anything missed (server restart, webhook failure, etc.)
-- ============================================================

-- Downgrade members whose subscription has expired
-- Runs daily at 03:00 UTC — skips lifetime members
SELECT cron.schedule(
  'gzw-expire-members',   -- job name (unique)
  '0 3 * * *',            -- daily at 03:00 UTC
  $$
    UPDATE profiles
    SET
      is_member        = false,
      member_expires_at = null
    WHERE
      is_member          = true
      AND is_lifetime_member = false
      AND member_expires_at IS NOT NULL
      AND member_expires_at < NOW();
  $$
);

-- Also auto-deactivate expired listings (so they don't show in browse)
SELECT cron.schedule(
  'gzw-expire-listings',
  '*/30 * * * *',         -- every 30 minutes
  $$
    UPDATE listings
    SET is_active = false
    WHERE
      is_active   = true
      AND expires_at IS NOT NULL
      AND expires_at < NOW();
  $$
);

-- To view scheduled jobs:
-- SELECT * FROM cron.job;

-- To remove a job if needed:
-- SELECT cron.unschedule('gzw-expire-members');
-- SELECT cron.unschedule('gzw-expire-listings');
