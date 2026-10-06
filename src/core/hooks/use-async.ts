import { useCallback, useEffect, useState } from 'react';

export function useAsync<T>(loader: () => Promise<T>, dependencies: unknown[] = []) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try { setData(await loader()); } catch (caught) { setError(caught instanceof Error ? caught : new Error('Unable to load data.')); } finally { setLoading(false); }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, dependencies);
  useEffect(() => { void reload(); }, [reload]);
  return { data, loading, error, reload };
}
