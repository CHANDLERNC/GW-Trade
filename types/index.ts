export type Category = 'keys' | 'gear' | 'items';
export type FactionSlug = 'lri' | 'mss' | 'csi';

export interface Faction {
  id: FactionSlug;
  name: string;
  shortName: string;
  color: string;
  description: string;
}

export interface CategoryInfo {
  id: Category;
  name: string;
  icon: string;
  description: string;
}

// Access level derived from profile flags — used throughout the app
export type AccessLevel = 'lifetime' | 'premium' | 'temp_premium' | 'free';

// Listing priority rank — higher = shown first in browse results
// lifetime=4  premium=3  temp_premium=2  free=1
export type PriorityRank = 1 | 2 | 3 | 4;

export interface Profile {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  faction_preference: FactionSlug | null;
  push_token: string | null;
  // Paid subscription flags — only set by RevenueCat webhook (MONETIZATION_ENABLED=true)
  is_member: boolean;
  is_lifetime_member: boolean;
  // Early adopter flags — set by claim_early_access() RPC
  is_early_adopter: boolean;
  early_access_claimed: boolean;
  early_access_expires_at: string | null;
  // Early adopter discount — tracked but not yet processed
  early_adopter_discount_claimed: boolean;
  early_adopter_discount_expires_at: string | null;
  display_name_color: string | null;
  member_since: string | null;
  member_expires_at: string | null;
  trades_completed: number;
  ratings_positive: number;
  ratings_negative: number;
  is_admin: boolean;
  created_at: string;
  updated_at: string;
}

export interface SupportTicket {
  id: string;
  user_id: string | null;
  category: 'bug' | 'feature' | 'content' | 'other';
  message: string;
  status: 'open' | 'resolved';
  created_at: string;
  // joined
  profiles?: { username: string; display_name: string | null } | null;
}

export interface Trade {
  id: string;
  conversation_id: string;
  listing_id: string | null;
  party_one: string;
  party_two: string;
  party_one_confirmed: boolean;
  party_two_confirmed: boolean;
  completed_at: string | null;
  created_at: string;
}

export interface TradeRating {
  id: string;
  trade_id: string;
  rater_id: string;
  rated_id: string;
  is_positive: boolean | null; // null = neutral ("trade completed, no strong opinion")
  created_at: string;
}

export type ListingProfile = Pick<Profile,
  'id' | 'username' | 'display_name' | 'faction_preference' |
  'is_member' | 'is_lifetime_member' | 'is_early_adopter'
>;

export type ConversationProfile = Pick<Profile, 'id' | 'username' | 'display_name'>;

export interface Listing {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  category: Category;
  faction: FactionSlug;
  /** Canonical key name from the master key list. Only set when category = 'keys'. */
  key_name: string | null;
  quantity: number;
  want_in_return: string | null;
  image_url: string | null;
  is_active: boolean;
  expires_at: string | null;
  priority_rank: PriorityRank;
  created_at: string;
  updated_at: string;
  profiles?: ListingProfile;
}

export interface Conversation {
  id: string;
  listing_id: string | null;
  participant_one: string;
  participant_two: string;
  last_message_at: string | null;
  last_message_preview: string | null;
  last_message_sender_id: string | null;
  created_at: string;
  unread_count?: number;
  profiles_one?: ConversationProfile;
  profiles_two?: ConversationProfile;
  listings?: Pick<Listing, 'id' | 'title' | 'category' | 'faction'> | null;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  is_read: boolean;
  created_at: string;
}

export interface Comment {
  id: string;
  listing_id: string;
  user_id: string;
  content: string;
  created_at: string;
  profiles?: Pick<Profile, 'id' | 'username' | 'display_name' | 'display_name_color' | 'is_member' | 'is_lifetime_member' | 'is_early_adopter'>;
}

export type ListingFilters = {
  category?: Category | 'all';
  faction?: FactionSlug | 'all';
  search?: string;
  userId?: string;
  activeOnly?: boolean;
  excludeUserIds?: string[];
};

export interface Block {
  id: string;
  blocker_id: string;
  blocked_id: string;
  created_at: string;
}

export interface Report {
  id: string;
  reporter_id: string;
  reported_user_id: string;
  listing_id: string | null;
  reason: 'scam' | 'harassment' | 'spam' | 'inappropriate' | 'other';
  details: string | null;
  created_at: string;
}

export interface PriceHistoryEntry {
  id: string;
  item_name: string;
  /** Canonical key name — only present for category = 'keys' entries. */
  key_name: string | null;
  want_in_return: string | null;
  faction: FactionSlug | null;
  category: Category | null;
  listing_id: string | null;
  completed_at: string;
}

// ── LFG ───────────────────────────────────────────────────────────────────────
export type LFGZone =
  | 'any'
  | 'pha_lang'
  | 'nam_thaven'
  | 'kiu_vongsa'
  | 'ybl_1'
  | 'ban_pa'
  | 'fort_narith'
  | 'midnight_sapphire'
  | 'tiger_bay'
  | 'hunters_paradise'
  | 'falng_airfield';
export type LFGRegion = 'NA East' | 'NA West' | 'EU' | 'Asia' | 'OCE' | 'SA';

export interface LFGPost {
  id: string;
  user_id: string;
  faction: FactionSlug;
  zone: LFGZone;
  region: LFGRegion;
  slots_total: number;
  description: string | null;
  mic_required: boolean;
  is_active: boolean;
  expires_at: string;
  created_at: string;
  profiles?: Pick<Profile, 'id' | 'username' | 'display_name' | 'display_name_color' | 'faction_preference' | 'is_member' | 'is_lifetime_member' | 'is_early_adopter'>;
}

export type LFGFilters = {
  faction?: FactionSlug | 'all';
  zone?: LFGZone | 'all';
  region?: LFGRegion | 'all';
};
