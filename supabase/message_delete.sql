-- Allow users to delete their own messages
create policy "Users can delete own messages"
  on public.messages
  for delete
  using (auth.uid() = sender_id);
