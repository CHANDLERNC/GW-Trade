import { supabase } from '@/lib/supabase';
import { Listing, ListingFilters } from '@/types';
import { LISTING_PROFILE_FIELDS } from '@/constants/queries';
import {
  getAccessLevel,
  getListingLimit,
  getPostDurationMs,
  getPriorityRank,
} from '@/services/membership.service';

export const listingsService = {
  async getListings(filters: ListingFilters = {}) {
    let query = supabase
      .from('listings')
      .select(`*, profiles:user_id (${LISTING_PROFILE_FIELDS})`)
      .order('priority_rank', { ascending: false })
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
    if (filters.excludeUserIds?.length) {
      query = query.not('user_id', 'in', `(${filters.excludeUserIds.join(',')})`);
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
    const { data: profile } = await supabase
      .from('profiles')
      .select('is_member, is_lifetime_member, is_early_adopter, early_access_expires_at')
      .eq('id', listing.user_id)
      .single();

    const level = getAccessLevel(profile ?? null);
    const limit = getListingLimit(level);
    const current = await this.getActiveListingCount(listing.user_id);

    if (current >= limit) {
      return {
        data: null,
        error: { message: `LIMIT_REACHED:${limit}:${level}` },
      };
    }

    const expires_at = new Date(Date.now() + getPostDurationMs(level)).toISOString();
    const priority_rank = getPriorityRank(level);

    return supabase
      .from('listings')
      .insert({ ...listing, expires_at, priority_rank })
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
