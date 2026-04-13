import { useState, useEffect } from 'react';
import { messagesService } from '@/services/messages.service';
import { Conversation, Message } from '@/types';
import { useQuery } from '@/hooks/useQuery';

export function useConversations(userId: string | undefined) {
  const { data: conversations, loading, refreshing, error, refetch } = useQuery<Conversation>(
    async () => {
      if (!userId) return { data: [], error: null };
      return messagesService.getConversations(userId) as Promise<{ data: Conversation[]; error: any }>;
    },
    [userId]
  );
  return { conversations, loading, refreshing, error, refetch };
}

export function useMessages(conversationId: string | undefined) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!conversationId) {
      setLoading(false);
      return;
    }

    // Initial load
    messagesService.getMessages(conversationId).then(({ data }) => {
      setMessages((data as Message[]) ?? []);
      setLoading(false);
    });

    // Realtime subscription — fetch the full row (with profiles join) on new message
    const channel = messagesService.subscribeToMessages(conversationId, () => {
      messagesService.getMessages(conversationId).then(({ data }) => {
        if (data) setMessages(data as Message[]);
      });
    });

    return () => {
      channel.unsubscribe();
    };
  }, [conversationId]);

  return { messages, loading };
}
