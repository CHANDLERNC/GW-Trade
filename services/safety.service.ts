import { supabase } from '@/lib/supabase';
import { Report } from '@/types';

export const safetyService = {
  async reportUser(
    reportedUserId: string,
    reason: Report['reason'],
    details?: string,
    listingId?: string
  ) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: { message: 'Not authenticated' } };

    return supabase.from('reports').insert({
      reporter_id: user.id,
      reported_user_id: reportedUserId,
      listing_id: listingId ?? null,
      reason,
      details: details ?? null,
    });
  },

  async blockUser(blockedId: string) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: { message: 'Not authenticated' } };

    return supabase.from('blocks').insert({
      blocker_id: user.id,
      blocked_id: blockedId,
    });
  },

  async unblockUser(blockedId: string) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: { message: 'Not authenticated' } };

    return supabase
      .from('blocks')
      .delete()
      .eq('blocker_id', user.id)
      .eq('blocked_id', blockedId);
  },

  async getBlockedIds(): Promise<string[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data } = await supabase
      .from('blocks')
      .select('blocked_id')
      .eq('blocker_id', user.id);

    return (data ?? []).map((b) => b.blocked_id);
  },

  async isBlocking(blockedId: string): Promise<boolean> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    const { count } = await supabase
      .from('blocks')
      .select('*', { count: 'exact', head: true })
      .eq('blocker_id', user.id)
      .eq('blocked_id', blockedId);

    return (count ?? 0) > 0;
  },
};
