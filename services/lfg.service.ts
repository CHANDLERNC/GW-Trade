import { supabase } from '@/lib/supabase';
import { LFGPost, LFGFilters } from '@/types';
import { LFG_PROFILE_FIELDS } from '@/constants/queries';
import { MEMBERSHIP } from '@/constants/membership';

export function lfgPostDurationHours(isLifetimeMember: boolean, isMember: boolean): number {
  if (isLifetimeMember) return MEMBERSHIP.LIFETIME_POST_HOURS;
  if (isMember) return MEMBERSHIP.PREMIUM_POST_HOURS;
  return MEMBERSHIP.FREE_POST_HOURS;
}

export function lfgPostLimit(isLifetimeMember: boolean, isMember: boolean): number {
  if (isLifetimeMember) return MEMBERSHIP.LIFETIME_LFG_LIMIT;
  if (isMember) return MEMBERSHIP.PREMIUM_LFG_LIMIT;
  return MEMBERSHIP.FREE_LFG_LIMIT;
}

export const lfgService = {
  async fetchPosts(filters: LFGFilters = {}): Promise<{ data: LFGPost[]; error: any }> {
    let query = supabase
      .from('lfg_posts')
      .select(`*, profiles:user_id (${LFG_PROFILE_FIELDS})`)
      .eq('is_active', true)
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false });

    if (filters.faction && filters.faction !== 'all') {
      query = query.eq('faction', filters.faction);
    }
    if (filters.zone && filters.zone !== 'all') {
      query = query.eq('zone', filters.zone);
    }
    if (filters.region && filters.region !== 'all') {
      query = query.eq('region', filters.region);
    }

    const { data, error } = await query;
    return { data: (data as LFGPost[]) ?? [], error };
  },

  async createPost(
    userId: string,
    post: {
      faction: LFGPost['faction'];
      zone: LFGPost['zone'];
      region: LFGPost['region'];
      slots_total: number;
      description?: string;
      mic_required: boolean;
      isLifetimeMember: boolean;
      isMember: boolean;
    }
  ): Promise<{ data: LFGPost | null; error: any; limitReached?: boolean }> {
    const limit = lfgPostLimit(post.isLifetimeMember, post.isMember);
    const durationHours = lfgPostDurationHours(post.isLifetimeMember, post.isMember);
    const expiresAt = new Date(Date.now() + durationHours * 60 * 60 * 1000).toISOString();

    // Check how many active posts the user currently has
    const { count } = await supabase
      .from('lfg_posts')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('is_active', true)
      .gt('expires_at', new Date().toISOString());

    if ((count ?? 0) >= limit) {
      return { data: null, error: null, limitReached: true };
    }

    const { data, error } = await supabase
      .from('lfg_posts')
      .insert({
        user_id: userId,
        faction: post.faction,
        zone: post.zone,
        region: post.region,
        slots_total: post.slots_total,
        description: post.description?.trim() || null,
        mic_required: post.mic_required,
        expires_at: expiresAt,
      })
      .select(`*, profiles:user_id (${LFG_PROFILE_FIELDS})`)
      .single();

    return { data: data as LFGPost | null, error };
  },

  async deactivatePost(postId: string): Promise<{ error: any }> {
    const { error } = await supabase
      .from('lfg_posts')
      .update({ is_active: false })
      .eq('id', postId);
    return { error };
  },

  async getMyActivePosts(userId: string): Promise<LFGPost[]> {
    const { data } = await supabase
      .from('lfg_posts')
      .select(`*, profiles:user_id (${LFG_PROFILE_FIELDS})`)
      .eq('user_id', userId)
      .eq('is_active', true)
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false });
    return (data as LFGPost[]) ?? [];
  },
};
