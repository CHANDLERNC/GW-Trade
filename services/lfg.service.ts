import { supabase } from '@/lib/supabase';
import { LFGPost, LFGFilters } from '@/types';

export function lfgPostDurationHours(isLifetimeMember: boolean, isMember: boolean): number {
  if (isLifetimeMember) return 48;
  if (isMember) return 24;
  return 12;
}

const PROFILE_FIELDS =
  'id, username, display_name, display_name_color, faction_preference, is_member, is_lifetime_member, is_early_adopter';

export const lfgService = {
  async fetchPosts(filters: LFGFilters = {}): Promise<{ data: LFGPost[]; error: any }> {
    let query = supabase
      .from('lfg_posts')
      .select(`*, profiles:user_id (${PROFILE_FIELDS})`)
      .eq('is_active', true)
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false });

    if (filters.faction && filters.faction !== 'all') {
      query = query.eq('faction', filters.faction);
    }
    if (filters.role && filters.role !== 'all') {
      query = query.eq('role', filters.role);
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
      role: LFGPost['role'];
      region: LFGPost['region'];
      slots_total: number;
      description?: string;
      mic_required: boolean;
      isLifetimeMember: boolean;
      isMember: boolean;
    }
  ): Promise<{ data: LFGPost | null; error: any }> {
    const hours = lfgPostDurationHours(post.isLifetimeMember, post.isMember);
    const expiresAt = new Date(Date.now() + hours * 60 * 60 * 1000).toISOString();

    // Deactivate any existing active posts by this user first
    await supabase
      .from('lfg_posts')
      .update({ is_active: false })
      .eq('user_id', userId)
      .eq('is_active', true);

    const { data, error } = await supabase
      .from('lfg_posts')
      .insert({
        user_id: userId,
        faction: post.faction,
        role: post.role,
        region: post.region,
        slots_total: post.slots_total,
        description: post.description?.trim() || null,
        mic_required: post.mic_required,
        expires_at: expiresAt,
      })
      .select(`*, profiles:user_id (${PROFILE_FIELDS})`)
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

  async getMyActivePost(userId: string): Promise<LFGPost | null> {
    const { data } = await supabase
      .from('lfg_posts')
      .select(`*, profiles:user_id (${PROFILE_FIELDS})`)
      .eq('user_id', userId)
      .eq('is_active', true)
      .gt('expires_at', new Date().toISOString())
      .maybeSingle();
    return data as LFGPost | null;
  },
};
