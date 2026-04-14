import { useState, useEffect, useCallback } from 'react';
import { safetyService } from '@/services/safety.service';
import { useAuth } from '@/context/AuthContext';

export function useBlocks() {
  const { user } = useAuth();
  const [blockedIds, setBlockedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    if (!user) { setBlockedIds([]); return; }
    setLoading(true);
    const ids = await safetyService.getBlockedIds();
    setBlockedIds(ids);
    setLoading(false);
  }, [user]);

  useEffect(() => { load(); }, [load]);

  const blockUser = useCallback(async (id: string) => {
    const { error } = await safetyService.blockUser(id) as any;
    if (!error) setBlockedIds((prev) => [...prev, id]);
    return { error };
  }, []);

  const unblockUser = useCallback(async (id: string) => {
    const { error } = await safetyService.unblockUser(id) as any;
    if (!error) setBlockedIds((prev) => prev.filter((b) => b !== id));
    return { error };
  }, []);

  const isBlocked = useCallback((id: string) => blockedIds.includes(id), [blockedIds]);

  return { blockedIds, loading, blockUser, unblockUser, isBlocked };
}
