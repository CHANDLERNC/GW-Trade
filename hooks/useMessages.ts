import { useState, useEffect, useCallback } from 'react';
import { messagesService } from '@/services/messages.service';
import { Conversation, Message } from '@/types';

export function useConversations(userId: string | undefined) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async (isRefresh = false) => {
    if (!userId) {
      setLoading(false);
      return;
    }
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);

    const { data, error: err } = await messagesService.getConversations(userId);
    if (err) setError((err as any).message ?? 'Failed to load conversations');
    else setConversations((data as Conversation[]) ?? []);

    if (isRefresh) setRefreshing(false);
    else setLoading(false);
  }, [userId]);

  const refetch = useCallback(() => fetchData(true), [fetchData]);

  useEffect(() => {
    fetchData(false);
  }, [userId]);

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
