-- ============================================================
-- Admin flag on profiles
-- Run in Supabase SQL Editor, then manually set is_admin = true
-- for your account via the Supabase Table Editor.
-- ============================================================
alter table profiles add column if not exists is_admin boolean not null default false;

-- ============================================================
-- Support ticket status + admin RLS
-- ============================================================
alter table support_tickets
  add column if not exists status text not null default 'open'
    check (status in ('open', 'resolved'));

-- Admins can read all tickets
create policy "Admins can read support tickets"
  on support_tickets for select
  using (
    exists (select 1 from profiles where id = auth.uid() and is_admin = true)
  );

-- Admins can update ticket status
create policy "Admins can update support tickets"
  on support_tickets for update
  using (
    exists (select 1 from profiles where id = auth.uid() and is_admin = true)
  );
