-- ============================================================
-- GZW Market — Supabase Database Schema
-- Run this in your Supabase project's SQL Editor
-- ============================================================

-- ============================================================
-- PROFILES
-- Extends auth.users. Created automatically on signup via trigger.
-- ============================================================
create table public.profiles (
  id            uuid references auth.users(id) on delete cascade primary key,
  username      text unique not null,
  display_name  text,
  avatar_url    text,
  bio           text,
  faction_preference text check (faction_preference in ('lri', 'mss', 'csi')),
  created_at    timestamptz default now() not null,
  updated_at    timestamptz default now() not null
);

-- Row Level Security
alter table public.profiles enable row level security;

create policy "Profiles are publicly readable"
  on public.profiles for select using (true);

create policy "Users can insert their own profile"
  on public.profiles for insert with check (auth.uid() = id);

create policy "Users can update their own profile"
  on public.profiles for update using (auth.uid() = id);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, username)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1))
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ============================================================
-- LISTINGS
-- ============================================================
create table public.listings (
  id             uuid default gen_random_uuid() primary key,
  user_id        uuid references public.profiles(id) on delete cascade not null,
  title          text not null,
  description    text,
  category       text not null check (category in ('keys', 'gear', 'items')),
  faction        text not null check (faction in ('lri', 'mss', 'csi')),
  quantity       int default 1 not null check (quantity > 0),
  want_in_return text,
  is_active      boolean default true not null,
  created_at     timestamptz default now() not null,
  updated_at     timestamptz default now() not null
);

alter table public.listings enable row level security;

create policy "Active listings are publicly readable"
  on public.listings for select using (true);

create policy "Users can create their own listings"
  on public.listings for insert with check (auth.uid() = user_id);

create policy "Users can update their own listings"
  on public.listings for update using (auth.uid() = user_id);

create policy "Users can delete their own listings"
  on public.listings for delete using (auth.uid() = user_id);

-- ============================================================
-- CONVERSATIONS
-- ============================================================
create table public.conversations (
  id                    uuid default gen_random_uuid() primary key,
  listing_id            uuid references public.listings(id) on delete set null,
  participant_one       uuid references public.profiles(id) on delete cascade not null,
  participant_two       uuid references public.profiles(id) on delete cascade not null,
  last_message_at       timestamptz,
  last_message_preview  text,
  created_at            timestamptz default now() not null,
  -- Prevent duplicate conversations for the same listing between the same two users
  constraint unique_conversation unique (participant_one, participant_two, listing_id)
);

alter table public.conversations enable row level security;

create policy "Users can view their own conversations"
  on public.conversations for select
  using (auth.uid() = participant_one or auth.uid() = participant_two);

create policy "Users can create conversations"
  on public.conversations for insert
  with check (auth.uid() = participant_one or auth.uid() = participant_two);

create policy "Participants can update conversation metadata"
  on public.conversations for update
  using (auth.uid() = participant_one or auth.uid() = participant_two);

-- ============================================================
-- MESSAGES
-- ============================================================
create table public.messages (
  id               uuid default gen_random_uuid() primary key,
  conversation_id  uuid references public.conversations(id) on delete cascade not null,
  sender_id        uuid references public.profiles(id) on delete cascade not null,
  content          text not null,
  is_read          boolean default false not null,
  created_at       timestamptz default now() not null
);

alter table public.messages enable row level security;

-- Only participants of a conversation can read its messages
create policy "Participants can read messages"
  on public.messages for select
  using (
    exists (
      select 1 from public.conversations c
      where c.id = messages.conversation_id
        and (c.participant_one = auth.uid() or c.participant_two = auth.uid())
    )
  );

-- Only participants can send messages, and sender_id must be themselves
create policy "Participants can send messages"
  on public.messages for insert
  with check (
    auth.uid() = sender_id and
    exists (
      select 1 from public.conversations c
      where c.id = messages.conversation_id
        and (c.participant_one = auth.uid() or c.participant_two = auth.uid())
    )
  );

-- Allow marking messages as read
create policy "Participants can mark messages as read"
  on public.messages for update
  using (
    exists (
      select 1 from public.conversations c
      where c.id = messages.conversation_id
        and (c.participant_one = auth.uid() or c.participant_two = auth.uid())
    )
  );

-- ============================================================
-- INDEXES (performance)
-- ============================================================
create index listings_category_faction_idx on public.listings(category, faction);
create index listings_user_id_idx on public.listings(user_id);
create index listings_is_active_idx on public.listings(is_active);
create index listings_created_at_idx on public.listings(created_at desc);
create index messages_conversation_id_idx on public.messages(conversation_id);
create index messages_created_at_idx on public.messages(created_at asc);
create index conversations_participant_one_idx on public.conversations(participant_one);
create index conversations_participant_two_idx on public.conversations(participant_two);
create index conversations_last_message_at_idx on public.conversations(last_message_at desc);

-- ============================================================
-- UPDATED_AT TRIGGER
-- ============================================================
create or replace function public.handle_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger listings_updated_at
  before update on public.listings
  for each row execute procedure public.handle_updated_at();

create trigger profiles_updated_at
  before update on public.profiles
  for each row execute procedure public.handle_updated_at();

-- ============================================================
-- ENABLE REALTIME (for live messaging)
-- Run these in Supabase dashboard → Database → Replication
-- or uncomment and run here:
-- ============================================================
-- alter publication supabase_realtime add table public.messages;
-- alter publication supabase_realtime add table public.conversations;
