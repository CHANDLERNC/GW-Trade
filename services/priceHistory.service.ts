import { supabase } from '@/lib/supabase';
import { PriceHistoryEntry } from '@/types';

export const priceHistoryService = {
  // Returns recent completed trades for a specific key by canonical name.
  // Uses exact match on key_name for normalized, duplicate-free lookups.
  async getKeyPriceHistory(keyName: string, limit = 10): Promise<PriceHistoryEntry[]> {
    const { data } = await supabase
      .from('price_history')
      .select('*')
      .eq('key_name', keyName)
      .order('completed_at', { ascending: false })
      .limit(limit);

    return (data ?? []) as PriceHistoryEntry[];
  },

  // Admin: fetch all key price history entries, newest first.
  async adminGetAll(search?: string): Promise<PriceHistoryEntry[]> {
    let query = supabase
      .from('price_history')
      .select('*')
      .eq('category', 'keys')
      .order('completed_at', { ascending: false })
      .limit(200);

    if (search?.trim()) {
      query = query.ilike('key_name', `%${search.trim()}%`);
    }

    const { data } = await query;
    return (data ?? []) as PriceHistoryEntry[];
  },

  // Admin: update the sold price on an entry.
  async adminUpdate(id: string, wantInReturn: string) {
    return supabase
      .from('price_history')
      .update({ want_in_return: wantInReturn.trim() || null })
      .eq('id', id);
  },

  // Admin: delete a price history entry.
  async adminDelete(id: string) {
    return supabase.from('price_history').delete().eq('id', id);
  },
};
