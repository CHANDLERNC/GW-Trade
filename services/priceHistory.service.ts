import { supabase } from '@/lib/supabase';
import { PriceHistoryEntry } from '@/types';

export const priceHistoryService = {
  // Returns recent completed trades for items with a similar name.
  // Used on the listing detail screen to show market context.
  async getRecentTrades(itemName: string, limit = 5): Promise<PriceHistoryEntry[]> {
    const { data } = await supabase
      .from('price_history')
      .select('*')
      .ilike('item_name', `%${itemName}%`)
      .order('completed_at', { ascending: false })
      .limit(limit);

    return (data ?? []) as PriceHistoryEntry[];
  },
};
