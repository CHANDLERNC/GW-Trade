import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { commentsService } from '@/services/comments.service';
import { Comment } from '@/types';

export function useComments(listingId: string) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);

  const fetch = useCallback(async () => {
    const { data } = await commentsService.getComments(listingId);
    setComments((data as Comment[]) ?? []);
    setLoading(false);
  }, [listingId]);

  useEffect(() => {
    fetch();
    const channel = commentsService.subscribe(listingId, fetch);
    return () => { supabase.removeChannel(channel); };
  }, [listingId, fetch]);

  const addComment = async (userId: string, content: string) => {
    setPosting(true);
    const { error } = await commentsService.addComment(listingId, userId, content);
    if (!error) {
      await fetch(); // refetch with full profile join
    }
    setPosting(false);
    return { error };
  };

  const deleteComment = async (id: string) => {
    setComments((prev) => prev.filter((c) => c.id !== id));
    await commentsService.deleteComment(id);
  };

  return { comments, loading, posting, addComment, deleteComment };
}
