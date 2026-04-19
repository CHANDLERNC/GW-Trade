-- ── Badge system — run in Supabase SQL Editor ────────────────────────────────
-- Adds equipped_badge_id to profiles so users can choose which earned badge
-- is displayed on their profile. NULL = auto (shows highest earned rank badge).

alter table public.profiles
  add column if not exists equipped_badge_id text;
