import { useState, useEffect, useCallback } from 'react';
import { messagesService } from '@/services/messages.service';
import { Conversation, Message } from '@/types';

export function useConversations(userId: string | undefined) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async (isRefresh = false) => {
    if (!userId) {
      setLoading(false);
      return;
    }
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    const { data } = await messagesService.getConversations(userId);
    setConversations((data as Conversation[]) ?? []);
    if (isRefresh) {
      setRefreshing(false);
    } else {
      setLoading(false);
    }
  }, [userId]);

  const refetch = useCallback(() => fetchData(true), [fetchData]);

  useEffect(() => {
    fetchData(false);
  }, [userId]);

  return { conversations, loading, refreshing, refetch };
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

    // Realtime subscription
    const channel = messagesService.subscribeToMessages(conversationId, (payload) => {
      setMessages((prev) => [...prev, payload.new as Message]);
    });

    return () => {
      channel.unsubscribe();
    };
  }, [conversationId]);

  return { messages, loading };
}
