import { supabase } from '@/lib/supabase';
import { SupportTicket } from '@/types';

export type SupportCategory = 'bug' | 'feature' | 'content' | 'other';

export const supportService = {
  async submitTicket(
    userId: string,
    category: SupportCategory,
    message: string,
  ): Promise<{ error: Error | null }> {
    const { error } = await supabase
      .from('support_tickets')
      .insert({ user_id: userId, category, message: message.trim() });
    return { error: error as Error | null };
  },

  // Admin only — fetches all tickets with submitter profile joined
  async fetchTickets(
    filter: { status?: 'open' | 'resolved'; category?: SupportCategory } = {},
  ): Promise<{ data: SupportTicket[]; error: Error | null }> {
    let query = supabase
      .from('support_tickets')
      .select('*, profiles(username, display_name)')
      .order('created_at', { ascending: false });

    if (filter.status) query = query.eq('status', filter.status);
    if (filter.category) query = query.eq('category', filter.category);

    const { data, error } = await query;
    return { data: (data as SupportTicket[]) ?? [], error: error as Error | null };
  },

  // Admin only — mark a ticket open or resolved
  async updateStatus(
    ticketId: string,
    status: 'open' | 'resolved',
  ): Promise<{ error: Error | null }> {
    const { error } = await supabase
      .from('support_tickets')
      .update({ status })
      .eq('id', ticketId);
    return { error: error as Error | null };
  },
};
