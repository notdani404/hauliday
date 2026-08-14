import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { HOME_MARKETS, DESTINATIONS, marketByCode, type Market } from './markets';

const STORAGE_KEY = 'hauliday.trip.v1';

interface TripState {
  home: Market;
  dest: Market | null;
  hydrated: boolean;
  setHome: (m: Market) => void;
  setDest: (m: Market) => void;
}

const defaultHome = HOME_MARKETS[0]!;

const TripContext = createContext<TripState | null>(null);

export function TripProvider({ children }: { children: ReactNode }) {
  const [home, setHomeState] = useState<Market>(defaultHome);
  const [dest, setDestState] = useState<Market | null>(null);
  const [hydrated, setHydrated] = useState(false);

  // Load persisted trip once.
  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => {
        if (raw) {
          const saved = JSON.parse(raw) as { home?: string; dest?: string };
          if (saved.home) setHomeState(marketByCode(saved.home) ?? defaultHome);
          if (saved.dest) setDestState(marketByCode(saved.dest) ?? null);
        }
      })
      .catch(() => {})
      .finally(() => setHydrated(true));
  }, []);

  // Persist on change (after hydration, so we don't clobber saved state).
  useEffect(() => {
    if (!hydrated) return;
    void AsyncStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ home: home.code, dest: dest?.code ?? null }),
    );
  }, [home, dest, hydrated]);

  const value = useMemo<TripState>(
    () => ({
      home,
      dest,
      hydrated,
      setHome: setHomeState,
      setDest: setDestState,
    }),
    [home, dest, hydrated],
  );

  return <TripContext.Provider value={value}>{children}</TripContext.Provider>;
}

export function useTrip(): TripState {
  const ctx = useContext(TripContext);
  if (!ctx) throw new Error('useTrip must be used within a TripProvider');
  return ctx;
}

export { HOME_MARKETS, DESTINATIONS };
