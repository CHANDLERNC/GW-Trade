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

export interface Profile {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  faction_preference: FactionSlug | null;
  push_token: string | null;
  is_member: boolean;
  is_lifetime_member: boolean;
  is_early_adopter: boolean;
  early_access_claimed: boolean;
  display_name_color: string | null;
  member_since: string | null;
  member_expires_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Listing {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  category: Category;
  faction: FactionSlug;
  quantity: number;
  want_in_return: string | null;
  image_url: string | null;
  is_active: boolean;
  expires_at: string | null;
  created_at: string;
  updated_at: string;
  profiles?: Profile;
}

export interface Conversation {
  id: string;
  listing_id: string | null;
  participant_one: string;
  participant_two: string;
  last_message_at: string | null;
  last_message_preview: string | null;
  created_at: string;
  unread_count?: number;
  profiles_one?: Profile;
  profiles_two?: Profile;
  listings?: Pick<Listing, 'id' | 'title' | 'category' | 'faction'> | null;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  is_read: boolean;
  created_at: string;
  profiles?: Profile;
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
};
