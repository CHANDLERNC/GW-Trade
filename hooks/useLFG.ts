import { useCallback } from 'react';
import { lfgService } from '@/services/lfg.service';
import { LFGPost, LFGFilters } from '@/types';
import { useQuery } from '@/hooks/useQuery';

export function useLFG(filters: LFGFilters = {}) {
  const filterKey = JSON.stringify(filters);
  const { data: posts, setData: setPosts, loading, refreshing, refetch } = useQuery<LFGPost>(
    () => lfgService.fetchPosts(JSON.parse(filterKey) as LFGFilters),
    [filterKey]
  );

  const removePost = useCallback((postId: string) => {
    setPosts((prev) => prev.filter((p) => p.id !== postId));
  }, [setPosts]);

  const prependPost = useCallback((post: LFGPost) => {
    setPosts((prev) => [post, ...prev.filter((p) => p.user_id !== post.user_id)]);
  }, [setPosts]);

  return { posts, loading, refreshing, refetch, removePost, prependPost };
}
