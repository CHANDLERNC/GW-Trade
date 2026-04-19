-- User agreement acceptance log
-- Run in Supabase SQL Editor after schema.sql

create table if not exists public.user_agreements (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid references public.profiles(id) on delete cascade not null,
  agreement_type text not null,
    -- 'first_login_disclosure' | 'tos' | 'privacy' | 'verified_trader_clause' | 'age_gate'
  version      text not null,
  accepted_at  timestamptz not null default now(),
  ip_address   inet,
  user_agent   text,
  unique (user_id, agreement_type, version)
);

alter table public.user_agreements enable row level security;

-- Users can insert their own agreements; can read their own
drop policy if exists "users insert own agreements" on public.user_agreements;
create policy "users insert own agreements"
  on public.user_agreements for insert
  with check (auth.uid() = user_id);

drop policy if exists "users read own agreements" on public.user_agreements;
create policy "users read own agreements"
  on public.user_agreements for select
  using (auth.uid() = user_id);

-- Admins (service role) can read all
-- (service role bypasses RLS by default)
