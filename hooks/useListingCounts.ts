import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { Category } from '@/types';

type Counts = Record<Category, number>;

export function useListingCounts() {
  const [counts, setCounts] = useState<Counts>({ keys: 0, gear: 0, items: 0 });
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from('listings')
      .select('category')
      .eq('is_active', true)
      .or('expires_at.is.null,expires_at.gt.' + new Date().toISOString());

    const next: Counts = { keys: 0, gear: 0, items: 0 };
    for (const row of data ?? []) {
      if (row.category in next) next[row.category as Category]++;
    }
    setCounts(next);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { counts, loading, refetch: fetch };
}
