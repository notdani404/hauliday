import { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { getWatchlistIds, addWatch, removeWatch } from './catalog';

/** Manages the current user's watchlist set with optimistic toggling. */
export function useWatch() {
  const [ids, setIds] = useState<Set<string>>(new Set());

  const reload = useCallback(() => {
    void getWatchlistIds().then(setIds);
  }, []);

  useFocusEffect(
    useCallback(() => {
      reload();
    }, [reload]),
  );

  const toggle = useCallback(
    async (variantId: string) => {
      const has = ids.has(variantId);
      setIds((prev) => {
        const next = new Set(prev);
        if (has) next.delete(variantId);
        else next.add(variantId);
        return next;
      });
      try {
        if (has) await removeWatch(variantId);
        else await addWatch(variantId);
      } catch {
        reload(); // revert to server truth on failure
      }
    },
    [ids, reload],
  );

  return { ids, toggle, reload };
}
