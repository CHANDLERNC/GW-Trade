-- Fix: recursive RLS on profiles table caused all profile reads to fail.
-- The admin policies on profiles queried profiles inside themselves → infinite loop.
-- Run this immediately in Supabase SQL Editor.

-- Drop the broken recursive policies
drop policy if exists "admins read all profiles" on public.profiles;
drop policy if exists "admins update any profile" on public.profiles;

-- Security-definer function: checks admin status without triggering RLS
create or replace function public.is_admin()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select coalesce(
    (select is_admin from public.profiles where id = auth.uid()),
    false
  )
$$;

-- Recreate policies using the function (no recursion)
create policy "admins read all profiles"
  on public.profiles for select
  using (public.is_admin());

create policy "admins update any profile"
  on public.profiles for update
  using (public.is_admin());
