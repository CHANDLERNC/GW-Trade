import { supabase } from '@/lib/supabase';
import { Trade, TradeRating } from '@/types';

// Maps Postgres exception messages from confirm_trade RPC → user-facing strings
function mapConfirmError(message: string): string {
  if (message.includes('insufficient_messages'))
    return 'Both players need to send at least one message before a trade can be confirmed.';
  if (message.includes('pair_cooldown'))
    return 'You can only complete one rated trade with the same player per 8 hours.';
  if (message.includes('not_a_participant') || message.includes('not_a_party'))
    return 'You are not a participant in this trade.';
  if (message.includes('conversation_not_found'))
    return 'Conversation not found.';
  return message;
}

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

  // Called when a user taps "Mark Trade Complete".
  // Delegates entirely to the confirm_trade RPC which enforces all anti-abuse rules:
  //   - Both parties must have sent ≥1 message
  //   - 7-day cooldown per pair (prevents farming)
  //   - Only sets the caller's confirmation flag (can't flip partner's)
  //   - Sets completed_at server-side (client can't forge it)
  async markComplete(
    conversationId: string,
  ): Promise<{ data: Trade | null; error: Error | null }> {
    const { data, error } = await supabase.rpc('confirm_trade', {
      p_conversation_id: conversationId,
    });

    if (error) {
      return {
        data: null,
        error: new Error(mapConfirmError(error.message)),
      };
    }

    // RPC returns SETOF trades — first row is our updated trade
    const trade = Array.isArray(data) ? (data[0] as Trade ?? null) : (data as Trade | null);
    return { data: trade, error: null };
  },

  // Submit a thumbs up or down rating.
  // The ratings_insert RLS policy (enforced server-side) verifies:
  //   - Trade is completed
  //   - Rater is a party to the trade
  //   - Rated is the other party (not rater, not a random user)
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
