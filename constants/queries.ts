// Supabase profile select fields — one export per use case, matching the
// Pick<> types in types/index.ts. Only select what each query actually renders.

/** ListingProfile — shown in ListingCard and listing detail seller row */
export const LISTING_PROFILE_FIELDS =
  'id, username, display_name, faction_preference, is_member, is_lifetime_member, is_early_adopter';

/** ConversationProfile — shown in ConversationRow (name + avatar initial only) */
export const CONVERSATION_PROFILE_FIELDS = 'id, username, display_name';

/** CommentProfile — shown in CommentBubble (name, color, member badge) */
export const COMMENT_PROFILE_FIELDS =
  'id, username, display_name, display_name_color, is_member, is_lifetime_member, is_early_adopter';

/** LFGProfile — shown in LFGCard (name, color, faction, member badge) */
export const LFG_PROFILE_FIELDS =
  'id, username, display_name, display_name_color, faction_preference, is_member, is_lifetime_member, is_early_adopter';
