import { useState, useCallback, useEffect } from 'react';
import { lfgService } from '@/services/lfg.service';
import { LFGPost, LFGFilters } from '@/types';

export function useLFG(filters: LFGFilters = {}) {
  const [posts, setPosts] = useState<LFGPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const filterKey = JSON.stringify(filters);

  const fetch = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    const { data } = await lfgService.fetchPosts(filters);
    setPosts(data);

    if (isRefresh) setRefreshing(false);
    else setLoading(false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterKey]);

  useEffect(() => { fetch(); }, [fetch]);

  const refetch = useCallback(() => fetch(true), [fetch]);

  const removePost = useCallback((postId: string) => {
    setPosts((prev) => prev.filter((p) => p.id !== postId));
  }, []);

  const prependPost = useCallback((post: LFGPost) => {
    setPosts((prev) => [post, ...prev.filter((p) => p.user_id !== post.user_id)]);
  }, []);

  return { posts, loading, refreshing, refetch, removePost, prependPost };
}
