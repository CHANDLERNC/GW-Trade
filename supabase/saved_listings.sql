-- saved_listings.sql
-- Run in Supabase SQL Editor to activate synced saved listings/sellers

create table if not exists saved_listings (
  user_id    uuid references profiles(id) on delete cascade not null,
  listing_id uuid references listings(id) on delete cascade not null,
  created_at timestamptz default now() not null,
  primary key (user_id, listing_id)
);

create table if not exists saved_sellers (
  user_id   uuid references profiles(id) on delete cascade not null,
  seller_id uuid references profiles(id) on delete cascade not null,
  created_at timestamptz default now() not null,
  primary key (user_id, seller_id)
);

alter table saved_listings enable row level security;
create policy "Users manage their own saved listings"
  on saved_listings for all
  using  (auth.uid() = user_id)
  with check (auth.uid() = user_id);

alter table saved_sellers enable row level security;
create policy "Users manage their own saved sellers"
  on saved_sellers for all
  using  (auth.uid() = user_id)
  with check (auth.uid() = user_id);
