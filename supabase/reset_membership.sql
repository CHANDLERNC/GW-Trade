-- Reset all membership/early-adopter status
-- Run this ONCE in Supabase SQL Editor.
-- No real money has been collected yet — this clears all paid flags.

update public.profiles
set
  is_member              = false,
  is_lifetime_member     = false,
  is_early_adopter       = false,
  early_access_claimed   = false,
  early_access_expires_at = null;

-- Verify: should return 0 rows after reset
-- select id, username, is_member, is_lifetime_member, is_early_adopter
-- from profiles
-- where is_member = true or is_lifetime_member = true or is_early_adopter = true;
