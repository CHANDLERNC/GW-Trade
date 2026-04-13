-- Support tickets submitted by users from the profile screen
create table if not exists support_tickets (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid references profiles(id) on delete set null,
  category     text not null check (category in ('bug', 'feature', 'content', 'other')),
  message      text not null check (char_length(message) >= 10 and char_length(message) <= 2000),
  created_at   timestamptz not null default now()
);

-- Users can submit tickets but never read them back (admin-only read)
alter table support_tickets enable row level security;

create policy "Users can submit support tickets"
  on support_tickets for insert
  with check (auth.uid() = user_id);
