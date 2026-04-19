--- Admin features: strikes column + admin RLS policies
-- Run in Supabase SQL Editor after schema.sql

-- ── Strikes ───────────────────────────────────────────────────────────────────
alter table public.profiles
  add column if not exists strikes integer not null default 0;

-- ── Admin RLS: profiles ───────────────────────────────────────────────────────
-- Admins can update any profile (for display_name, username, strikes)
create policy "admins update any profile"
  on public.profiles for update
  using (exists (
    select 1 from public.profiles p where p.id = auth.uid() and p.is_admin = true
  ));

-- Admins can read all profiles (for player search)
create policy "admins read all profiles"
  on public.profiles for select
  using (exists (
    select 1 from public.profiles p where p.id = auth.uid() and p.is_admin = true
  ));

-- ── Admin RLS: reports ────────────────────────────────────────────────────────
create policy "admins read all reports"
  on public.reports for select
  using (exists (
    select 1 from public.profiles p where p.id = auth.uid() and p.is_admin = true
  ));

create policy "admins update all reports"
  on public.reports for update
  using (exists (
    select 1 from public.profiles p where p.id = auth.uid() and p.is_admin = true
  ));

-- ── Admin RLS: listings ───────────────────────────────────────────────────────
create policy "admins select all listings"
  on public.listings for select
  using (exists (
    select 1 from public.profiles p where p.id = auth.uid() and p.is_admin = true
  ));

create policy "admins delete any listing"
  on public.listings for delete
  using (exists (
    select 1 from public.profiles p where p.id = auth.uid() and p.is_admin = true
  ));

-- ── Admin RLS: lfg_posts ──────────────────────────────────────────────────────
create policy "admins select all lfg posts"
  on public.lfg_posts for select
  using (exists (
    select 1 from public.profiles p where p.id = auth.uid() and p.is_admin = true
  ));

create policy "admins update any lfg post"
  on public.lfg_posts for update
  using (exists (
    select 1 from public.profiles p where p.id = auth.uid() and p.is_admin = true
  ));

create policy "admins delete any lfg post"
  on public.lfg_posts for delete
  using (exists (
    select 1 from public.profiles p where p.id = auth.uid() and p.is_admin = true
  ));
