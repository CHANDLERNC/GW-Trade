-- ============================================================
-- GZW Market — LFG (Looking for Group) Schema
-- Run this in your Supabase project's SQL Editor
-- ============================================================

create table public.lfg_posts (
  id            uuid default gen_random_uuid() primary key,
  user_id       uuid references public.profiles(id) on delete cascade not null,
  faction       text not null check (faction in ('lri', 'mss', 'csi')),
  zone          text not null default 'any'
                  check (zone in ('any', 'pha_lang', 'nam_thaven', 'kiu_vongsa', 'ybl_1', 'ban_pa', 'fort_narith', 'midnight_sapphire', 'tiger_bay', 'hunters_paradise', 'falng_airfield')),
  region        text not null default 'NA East'
                  check (region in ('NA East', 'NA West', 'EU', 'Asia', 'OCE', 'SA')),
  slots_total   int not null default 4 check (slots_total between 2 and 4),
  description   text,
  mic_required  boolean not null default false,
  is_active     boolean not null default true,
  expires_at    timestamptz not null default (now() + interval '24 hours'),
  created_at    timestamptz not null default now()
);

alter table public.lfg_posts enable row level security;

create policy "LFG posts are publicly readable"
  on public.lfg_posts for select using (true);

create policy "Users can insert their own LFG posts"
  on public.lfg_posts for insert with check (auth.uid() = user_id);

create policy "Users can update their own LFG posts"
  on public.lfg_posts for update using (auth.uid() = user_id);

create policy "Users can delete their own LFG posts"
  on public.lfg_posts for delete using (auth.uid() = user_id);

-- Enable Realtime for live updates on the LFG board
alter publication supabase_realtime add table public.lfg_posts;

-- ============================================================
-- Migration: rename role → zone and update to real GZW map zones
-- Run this if the table already exists in your Supabase project
-- ============================================================
-- alter table public.lfg_posts rename column role to zone;
-- alter table public.lfg_posts drop constraint lfg_posts_role_check;
-- alter table public.lfg_posts drop constraint if exists lfg_posts_zone_check;
-- update public.lfg_posts set zone = 'any';
-- alter table public.lfg_posts add constraint lfg_posts_zone_check
--   check (zone in ('any', 'pha_lang', 'nam_thaven', 'kiu_vongsa', 'ybl_1', 'ban_pa', 'fort_narith', 'midnight_sapphire', 'tiger_bay', 'hunters_paradise', 'falng_airfield'));
