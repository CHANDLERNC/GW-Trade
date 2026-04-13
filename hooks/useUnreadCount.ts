import { useState, useEffect, useCallback } from 'react';
import { useFocusEffect } from 'expo-router';
import { messagesService } from '@/services/messages.service';

export function useUnreadCount(userId: string | undefined) {
  const [count, setCount] = useState(0);

  const fetch = useCallback(async () => {
    if (!userId) return;
    setCount(await messagesService.getUnreadCount(userId));
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
