import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { Category } from '@/types';

type Counts = Record<Category, number>;

export function useListingCounts() {
  const [counts, setCounts] = useState<Counts>({ keys: 0, gear: 0, items: 0 });
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    setLoading(true);
    const [keys, gear, items] = await Promise.all([
      supabase
        .from('listings')
        .select('*', { count: 'exact', head: true })
        .eq('category', 'keys')
        .eq('is_active', true),
      supabase
        .from('listings')
        .select('*', { count: 'exact', head: true })
        .eq('category', 'gear')
        .eq('is_active', true),
      supabase
        .from('listings')
        .select('*', { count: 'exact', head: true })
        .eq('category', 'items')
        .eq('is_active', true),
    ]);
    setCounts({
      keys: keys.count ?? 0,
      gear: gear.count ?? 0,
      items: items.count ?? 0,
    });
    setLoading(false);
  }, []);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { counts, loading, refetch: fetch };
}
