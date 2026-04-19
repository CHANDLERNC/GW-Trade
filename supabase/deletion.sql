-- Account deletion request columns for profiles table
-- Run in Supabase SQL Editor

alter table public.profiles
  add column if not exists deletion_requested_at timestamptz,
  add column if not exists deletion_reason text;

-- Index for the nightly sweep job
create index if not exists profiles_deletion_requested_at_idx
  on public.profiles (deletion_requested_at)
  where deletion_requested_at is not null;

-- Users can update their own deletion request
-- (the existing profiles UPDATE policy covers this if it allows self-update)
-- If you have a restrictive update policy, add:
-- create policy "users request own deletion"
--   on public.profiles for update
--   using (auth.uid() = id)
--   with check (auth.uid() = id);
