import { useState, useEffect, useCallback } from 'react';
import { useFocusEffect } from 'expo-router';
import { supabase } from '@/lib/supabase';

export function useUnreadCount(userId: string | undefined) {
  const [count, setCount] = useState(0);

  const fetch = useCallback(async () => {
    if (!userId) return;

    const { data: conversations } = await supabase
      .from('conversations')
      .select('id')
      .or(`participant_one.eq.${userId},participant_two.eq.${userId}`);

    if (!conversations?.length) {
      setCount(0);
      return;
    }

    const ids = conversations.map((c) => c.id);
    const { count: unread } = await supabase
      .from('messages')
      .select('*', { count: 'exact', head: true })
      .in('conversation_id', ids)
      .neq('sender_id', userId)
      .eq('is_read', false);

    setCount(unread ?? 0);
  }, [userId]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  // Re-check whenever the tab bar comes into focus
  useFocusEffect(
    useCallback(() => {
      fetch();
    }, [fetch])
  );

  return count;
}
