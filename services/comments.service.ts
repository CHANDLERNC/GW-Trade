import { supabase } from '@/lib/supabase';
import { RealtimeChannel } from '@supabase/supabase-js';

const PROFILE_FIELDS = 'id, username, display_name, display_name_color, is_member, is_lifetime_member, is_early_adopter';

export const commentsService = {
  async getComments(listingId: string) {
    return supabase
      .from('comments')
      .select(`*, profiles:user_id (${PROFILE_FIELDS})`)
      .eq('listing_id', listingId)
      .order('created_at', { ascending: true });
  },

  async addComment(listingId: string, userId: string, content: string) {
    // Insert only — caller refetches for the joined profile data
    return supabase
      .from('comments')
      .insert({ listing_id: listingId, user_id: userId, content })
      .select('id')
      .single();
  },

  async deleteComment(id: string) {
    return supabase.from('comments').delete().eq('id', id);
  },

  subscribe(listingId: string, callback: () => void): RealtimeChannel {
    return supabase
      .channel(`comments:${listingId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'comments', filter: `listing_id=eq.${listingId}` },
        callback
      )
      .subscribe();
  },
};
