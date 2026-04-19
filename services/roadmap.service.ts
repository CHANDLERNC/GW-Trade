import { supabase } from '@/lib/supabase';

export const roadmapService = {
  async getVoteCounts(): Promise<Record<string, number>> {
    const { data } = await supabase
      .from('roadmap_votes')
      .select('item_slug');

    if (!data) return {};
    return data.reduce<Record<string, number>>((acc, row) => {
      acc[row.item_slug] = (acc[row.item_slug] ?? 0) + 1;
      return acc;
    }, {});
  },

  async getUserVotes(userId: string): Promise<string[]> {
    const { data } = await supabase
      .from('roadmap_votes')
      .select('item_slug')
      .eq('user_id', userId);

    return (data ?? []).map((r) => r.item_slug);
  },

  async vote(userId: string, slug: string) {
    return supabase.from('roadmap_votes').insert({ user_id: userId, item_slug: slug });
  },

  async unvote(userId: string, slug: string) {
    return supabase
      .from('roadmap_votes')
      .delete()
      .eq('user_id', userId)
      .eq('item_slug', slug);
  },
};
