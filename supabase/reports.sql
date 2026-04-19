-- Reports table — matches safety.service.ts schema
-- Run in Supabase SQL Editor after schema.sql

create table if not exists public.reports (
  id              uuid primary key default gen_random_uuid(),
  reporter_id     uuid references public.profiles(id) on delete set null,
  reported_user_id uuid references public.profiles(id) on delete cascade not null,
  listing_id      uuid references public.listings(id) on delete set null,
  reason          text not null check (reason in ('scam','harassment','spam','inappropriate','other')),
  details         text,
  status          text not null default 'open'
                    check (status in ('open','triaged','actioned','dismissed')),
  resolved_at     timestamptz,
  resolver_id     uuid references public.profiles(id) on delete set null,
  resolution_note text,
  created_at      timestamptz not null default now(),
  unique (reporter_id, reported_user_id, listing_id)
);

alter table public.reports enable row level security;

-- Users can insert reports
create policy "users insert reports"
  on public.reports for insert
  with check (auth.uid() = reporter_id);

-- Users can read their own reports
create policy "users read own reports"
  on public.reports for select
  using (auth.uid() = reporter_id);

-- Service role (admins) can read and update all — service role bypasses RLS by default
