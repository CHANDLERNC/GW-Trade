import { useState, useEffect, useCallback, Dispatch, SetStateAction } from 'react';

interface QueryResult<T> {
  data: T[];
  setData: Dispatch<SetStateAction<T[]>>;
  loading: boolean;
  refreshing: boolean;
  error: string | null;
  refetch: () => void;
}

/**
 * Generic fetch hook for list queries with loading/refreshing/error states.
 * Pass `deps` the same way you would a useCallback dependency array.
 * `setData` is exposed so callers can do optimistic updates (prepend, remove, etc).
 */
export function useQuery<T>(
  fetcher: () => Promise<{ data: T[] | null; error: any }>,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  deps: readonly any[]
): QueryResult<T> {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const execute = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);
    const { data: result, error: err } = await fetcher();
    if (err) setError(err.message ?? 'Error');
    else setData(result ?? []);
    if (isRefresh) setRefreshing(false);
    else setLoading(false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  const refetch = useCallback(() => execute(true), [execute]);
  useEffect(() => { execute(); }, [execute]);

  return { data, setData, loading, refreshing, error, refetch };
}
