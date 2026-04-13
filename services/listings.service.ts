import { supabase } from '@/lib/supabase';
import { Listing, ListingFilters } from '@/types';
import { MEMBERSHIP } from '@/constants/membership';
import { LISTING_PROFILE_FIELDS } from '@/constants/queries';

export const listingsService = {
  async getListings(filters: ListingFilters = {}) {
    let query = supabase
      .from('listings')
      .select(`*, profiles:user_id (${LISTING_PROFILE_FIELDS})`)
      .order('created_at', { ascending: false });

    if (filters.activeOnly !== false) {
      query = query.eq('is_active', true);
      // Exclude expired listings
      query = query.or('expires_at.is.null,expires_at.gt.' + new Date().toISOString());
    }
    if (filters.category && filters.category !== 'all') {
      query = query.eq('category', filters.category);
    }
    if (filters.faction && filters.faction !== 'all') {
      query = query.eq('faction', filters.faction);
    }
    if (filters.userId) {
      query = query.eq('user_id', filters.userId);
    }
    if (filters.search?.trim()) {
      query = query.ilike('title', `%${filters.search.trim()}%`);
    }

    return query;
  },

  async getListing(id: string) {
    return supabase
      .from('listings')
      .select(`*, profiles:user_id (${LISTING_PROFILE_FIELDS})`)
      .eq('id', id)
      .single();
  },

  async getActiveListingCount(userId: string): Promise<number> {
    const { count } = await supabase
      .from('listings')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('is_active', true);
    return count ?? 0;
  },

  async createListing(
    listing: Omit<Listing, 'id' | 'created_at' | 'updated_at' | 'profiles'>
  ) {
    // Enforce listing limit based on membership tier
    const { data: profile } = await supabase
      .from('profiles')
      .select('is_member, is_lifetime_member')
      .eq('id', listing.user_id)
      .single();

    const isLifetime = profile?.is_lifetime_member ?? false;
    const isMember = profile?.is_member ?? false;
    const limit = isLifetime
      ? MEMBERSHIP.LIFETIME_LIMIT
      : isMember
      ? MEMBERSHIP.MEMBER_LIMIT
      : MEMBERSHIP.FREE_LIMIT;

    const current = await this.getActiveListingCount(listing.user_id);
    if (current >= limit) {
      const tier = isLifetime ? 'lifetime' : isMember ? 'member' : 'free';
      return {
        data: null,
        error: { message: `LIMIT_REACHED:${limit}:${tier}` },
      };
    }

    // Every tier gets a post duration limit
    const MS = 1000;
    const expires_at = isLifetime
      ? new Date(Date.now() + MEMBERSHIP.LIFETIME_POST_DAYS * 86400 * MS).toISOString()
      : isMember
      ? new Date(Date.now() + MEMBERSHIP.MEMBER_POST_DAYS * 86400 * MS).toISOString()
      : new Date(Date.now() + MEMBERSHIP.FREE_POST_HOURS * 3600 * MS).toISOString();

    return supabase
      .from('listings')
      .insert({ ...listing, expires_at })
      .select()
      .single();
  },

  async updateListing(id: string, updates: Partial<Omit<Listing, 'id' | 'user_id' | 'created_at' | 'profiles'>>) {
    return supabase
      .from('listings')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
  },

  async deleteListing(id: string) {
    return supabase.from('listings').delete().eq('id', id);
  },

  async toggleActive(id: string, isActive: boolean) {
    return supabase
      .from('listings')
      .update({ is_active: isActive })
      .eq('id', id);
  },
};
