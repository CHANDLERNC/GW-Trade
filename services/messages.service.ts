import { supabase } from '@/lib/supabase';
import { RealtimeChannel } from '@supabase/supabase-js';
import { notificationsService } from '@/services/notifications.service';

const PROFILE_FIELDS = 'id, username, display_name, avatar_url';

export const messagesService = {
  async getConversations(userId: string) {
    const { data: convs, error } = await supabase
      .from('conversations')
      .select(`
        *,
        profiles_one:participant_one (${PROFILE_FIELDS}),
        profiles_two:participant_two (${PROFILE_FIELDS}),
        listings:listing_id (id, title, category, faction)
      `)
      .or(`participant_one.eq.${userId},participant_two.eq.${userId}`)
      .order('last_message_at', { ascending: false });

    if (error || !convs?.length) return { data: convs ?? [], error };

    // Fetch all unread messages across the user's conversations in one query
    const ids = convs.map((c) => c.id);
    const { data: unread } = await supabase
      .from('messages')
      .select('conversation_id')
      .in('conversation_id', ids)
      .neq('sender_id', userId)
      .eq('is_read', false);

    const unreadMap: Record<string, number> = {};
    for (const m of unread ?? []) {
      unreadMap[m.conversation_id] = (unreadMap[m.conversation_id] ?? 0) + 1;
    }

    return {
      data: convs.map((c) => ({ ...c, unread_count: unreadMap[c.id] ?? 0 })),
      error: null,
    };
  },

  async getConversationCountForListing(listingId: string): Promise<number> {
    const { count } = await supabase
      .from('conversations')
      .select('*', { count: 'exact', head: true })
      .eq('listing_id', listingId);
    return count ?? 0;
  },

  async getOrCreateConversation(
    userId: string,
    otherUserId: string,
    listingId?: string
  ) {
    // Look for existing conversation between these two users on this listing
    const filter = listingId
      ? `and(participant_one.eq.${userId},participant_two.eq.${otherUserId},listing_id.eq.${listingId}),and(participant_one.eq.${otherUserId},participant_two.eq.${userId},listing_id.eq.${listingId})`
      : `and(participant_one.eq.${userId},participant_two.eq.${otherUserId}),and(participant_one.eq.${otherUserId},participant_two.eq.${userId})`;

    const { data: existing } = await supabase
      .from('conversations')
      .select('id')
      .or(filter)
      .maybeSingle();

    if (existing) return { data: existing, error: null };

    return supabase
      .from('conversations')
      .insert({
        participant_one: userId,
        participant_two: otherUserId,
        listing_id: listingId ?? null,
      })
      .select('id')
      .single();
  },

  async getMessages(conversationId: string) {
    return supabase
      .from('messages')
      .select(`*, profiles:sender_id (${PROFILE_FIELDS})`)
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });
  },

  async sendMessage(conversationId: string, senderId: string, content: string) {
    const { data, error } = await supabase
      .from('messages')
      .insert({ conversation_id: conversationId, sender_id: senderId, content })
      .select()
      .single();

    if (!error) {
      const preview = content.length > 60 ? content.slice(0, 57) + '...' : content;

      // Update conversation preview and fire push notification in parallel
      await Promise.all([
        supabase
          .from('conversations')
          .update({ last_message_at: new Date().toISOString(), last_message_preview: preview })
          .eq('id', conversationId),
        sendNotificationToRecipient(conversationId, senderId, content),
      ]);
    }

    return { data, error };
  },

  async getUnreadCount(userId: string) {
    const { data: convs } = await supabase
      .from('conversations')
      .select('id')
      .or(`participant_one.eq.${userId},participant_two.eq.${userId}`);

    if (!convs?.length) return 0;

    const { count } = await supabase
      .from('messages')
      .select('*', { count: 'exact', head: true })
      .in('conversation_id', convs.map((c) => c.id))
      .neq('sender_id', userId)
      .eq('is_read', false);

    return count ?? 0;
  },

  async markAsRead(conversationId: string, userId: string) {
    return supabase
      .from('messages')
      .update({ is_read: true })
      .eq('conversation_id', conversationId)
      .neq('sender_id', userId)
      .eq('is_read', false);
  },

  subscribeToMessages(
    conversationId: string,
    callback: (payload: any) => void
  ): RealtimeChannel {
    return supabase
      .channel(`messages:${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        callback
      )
      .subscribe();
  },
};

// Internal helper — fetch recipient push token and send notification
async function sendNotificationToRecipient(
  conversationId: string,
  senderId: string,
  content: string
) {
  try {
    const { data: conv } = await supabase
      .from('conversations')
      .select('participant_one, participant_two')
      .eq('id', conversationId)
      .single();

    if (!conv) return;

    const recipientId =
      conv.participant_one === senderId ? conv.participant_two : conv.participant_one;

    const [{ data: sender }, { data: recipient }] = await Promise.all([
      supabase.from('profiles').select('username').eq('id', senderId).single(),
      supabase.from('profiles').select('push_token').eq('id', recipientId).single(),
    ]);

    if (recipient?.push_token) {
      const preview = content.length > 80 ? content.slice(0, 77) + '...' : content;
      await notificationsService.sendPushNotification(
        recipient.push_token,
        `${sender?.username ?? 'Someone'} sent you a message`,
        preview
      );
    }
  } catch {
    // Never block messaging on notification failure
  }
}
