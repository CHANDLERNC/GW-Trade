-- Wipe all listings and chat history
-- Run ONCE in Supabase SQL Editor (pre-launch clean slate).
-- No real trades have occurred — this clears all user-generated market data.

-- 1. Trade ratings (references trades)
delete from public.trade_ratings;

-- 2. Trades (references conversations)
delete from public.trades;

-- 3. Comments on listings
delete from public.comments;

-- 4. Messages (references conversations)
delete from public.messages;

-- 5. Conversations (references listings)
delete from public.conversations;

-- 6. Saved listings + sellers
delete from public.saved_listings;
delete from public.saved_sellers;

-- 7. Price history
delete from public.price_history;

-- 8. LFG posts
delete from public.lfg_posts;

-- 9. Listings
delete from public.listings;

-- 10. Reset counter columns on profiles
update public.profiles
set
  trades_completed   = 0,
  ratings_positive   = 0,
  ratings_negative   = 0;

-- Verify: all should return 0
-- select count(*) from listings;
-- select count(*) from conversations;
-- select count(*) from messages;
-- select count(*) from trades;
-- select count(*) from lfg_posts;
-- select count(*) from comments;
