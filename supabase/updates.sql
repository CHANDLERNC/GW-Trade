-- ============================================================
-- GZW Market — Updates
-- Run this in Supabase SQL Editor AFTER schema.sql
-- ============================================================

-- Image support for listings
alter table public.listings add column if not exists image_url text;

-- Push notification token on profiles
alter table public.profiles add column if not exists push_token text;

-- ============================================================
-- STORAGE BUCKET for listing images
-- ============================================================
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'listing-images',
  'listing-images',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do nothing;

-- Anyone can view listing images (public bucket)
create policy "Public can view listing images"
  on storage.objects for select
  using (bucket_id = 'listing-images');

-- Authenticated users can upload
create policy "Authenticated users can upload listing images"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'listing-images');

-- Users can update/delete their own images (stored under their user id folder)
create policy "Users can update their listing images"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'listing-images' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "Users can delete their listing images"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'listing-images' and auth.uid()::text = (storage.foldername(name))[1]);
