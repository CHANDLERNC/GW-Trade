-- Full test reset — clean slate for testing
-- Run in Supabase SQL Editor. Wipes all market data AND resets all membership flags.

-- ── 1. Dependent records first ────────────────────────────────────────────────
delete from public.trade_ratings;
delete from public.trades;
delete from public.comments;
delete from public.messages;
delete from public.conversations;
delete from public.saved_listings;
delete from public.saved_sellers;
delete from public.price_history;
delete from public.lfg_posts;
delete from public.listings;

-- ── 2. Reset membership / early-adopter flags ─────────────────────────────────
update public.profiles
set
  is_member              = false,
  is_lifetime_member     = false,
  is_early_adopter       = false,
  early_access_claimed   = false,
  early_access_expires_at = null,
  trades_completed       = 0,
  ratings_positive       = 0,
  ratings_negative       = 0;

-- ── Verify (uncomment to check) ───────────────────────────────────────────────
-- select count(*) from listings;
-- select count(*) from conversations;
-- select count(*) from messages;
-- select count(*) from trades;
-- select count(*) from lfg_posts;
-- select count(*) from comments;
-- select id, username, is_member, is_lifetime_member, is_early_adopter, trades_completed
--   from profiles;
