-- Tier 2 features: user_strikes audit table, onboarding_completed_at, roadmap_votes
-- Run in Supabase SQL Editor after admin_features.sql

-- ── User strikes audit log ────────────────────────────────────────────────────
create table if not exists public.user_strikes (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid references public.profiles(id) on delete cascade not null,
  issued_by      uuid references public.profiles(id) on delete set null,
  reason         text not null,
  evidence_ref   text,
  expires_at     timestamptz default (now() + interval '365 days'),
  appeal_status  text not null default 'none'
                   check (appeal_status in ('none','pending','upheld','overturned')),
  issued_at      timestamptz not null default now()
);

alter table public.user_strikes enable row level security;

-- Users can read their own strikes
create policy "users read own strikes"
  on public.user_strikes for select
  using (auth.uid() = user_id);

-- Admins can read all strikes
create policy "admins read all strikes"
  on public.user_strikes for select
  using (exists (
    select 1 from public.profiles p where p.id = auth.uid() and p.is_admin = true
  ));

-- Admins can insert strikes
create policy "admins insert strikes"
  on public.user_strikes for insert
  with check (exists (
    select 1 from public.profiles p where p.id = auth.uid() and p.is_admin = true
  ));

-- Admins can update strikes (for appeal_status)
create policy "admins update strikes"
  on public.user_strikes for update
  using (exists (
    select 1 from public.profiles p where p.id = auth.uid() and p.is_admin = true
  ));

-- ── Onboarding completed timestamp ───────────────────────────────────────────
alter table public.profiles
  add column if not exists onboarding_completed_at timestamptz;

-- ── Roadmap votes ─────────────────────────────────────────────────────────────
create table if not exists public.roadmap_votes (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid references public.profiles(id) on delete cascade not null,
  item_slug  text not null,
  created_at timestamptz not null default now(),
  unique (user_id, item_slug)
);

alter table public.roadmap_votes enable row level security;

-- Users manage their own votes
create policy "users manage own roadmap votes"
  on public.roadmap_votes for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Anyone (including anon) can read vote counts
create policy "anyone reads roadmap votes"
  on public.roadmap_votes for select
  using (true);
