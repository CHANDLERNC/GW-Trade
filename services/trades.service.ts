import { supabase } from '@/lib/supabase';
import { Trade, TradeRating } from '@/types';

export const tradesService = {
  // Get the trade record for a conversation (null if none exists yet)
  async getTradeForConversation(conversationId: string): Promise<Trade | null> {
    const { data } = await supabase
      .from('trades')
      .select('*')
      .eq('conversation_id', conversationId)
      .maybeSingle();
    return data ?? null;
  },

  // Called when a user taps "Mark Trade Complete"
  async markComplete(
    conversationId: string,
    listingId: string | null,
    userId: string,
    partnerId: string,
  ): Promise<{ data: Trade | null; error: Error | null }> {
    const existing = await this.getTradeForConversation(conversationId);

    if (!existing) {
      // First party to confirm — create the trade record
      const { data, error } = await supabase
        .from('trades')
        .insert({
          conversation_id: conversationId,
          listing_id: listingId,
          party_one: userId,
          party_two: partnerId,
          party_one_confirmed: true,
        })
        .select()
        .single();
      return { data: data ?? null, error: error as Error | null };
    }

    // Second party confirming — update and mark completed
    const isPartyOne = existing.party_one === userId;
    const update: Partial<Trade> & { completed_at?: string } = isPartyOne
      ? { party_one_confirmed: true }
      : { party_two_confirmed: true };

    const otherAlreadyConfirmed = isPartyOne
      ? existing.party_two_confirmed
      : existing.party_one_confirmed;

    if (otherAlreadyConfirmed) {
      update.completed_at = new Date().toISOString();
    }

    const { data, error } = await supabase
      .from('trades')
      .update(update)
      .eq('id', existing.id)
      .select()
      .single();

    return { data: data ?? null, error: error as Error | null };
  },

  // Submit a thumbs up or down rating
  async submitRating(
    tradeId: string,
    raterId: string,
    ratedId: string,
    isPositive: boolean,
  ): Promise<{ data: TradeRating | null; error: Error | null }> {
    const { data, error } = await supabase
      .from('trade_ratings')
      .insert({ trade_id: tradeId, rater_id: raterId, rated_id: ratedId, is_positive: isPositive })
      .select()
      .single();
    return { data: data ?? null, error: error as Error | null };
  },

  // Check if the current user has already rated this trade
  async getMyRating(tradeId: string, raterId: string): Promise<TradeRating | null> {
    const { data } = await supabase
      .from('trade_ratings')
      .select('*')
      .eq('trade_id', tradeId)
      .eq('rater_id', raterId)
      .maybeSingle();
    return data ?? null;
  },
};
