-- Add lifetime membership and listing expiry
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS is_lifetime_member BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE listings
  ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ;

-- Filter expired listings out of active queries via a helper index
CREATE INDEX IF NOT EXISTS idx_listings_expires_at ON listings (expires_at)
  WHERE expires_at IS NOT NULL;
