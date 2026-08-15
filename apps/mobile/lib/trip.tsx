import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  HOME_MARKETS,
  DESTINATION_CITIES,
  cityById,
  marketByCode,
  type Market,
  type DestinationCity,
} from './markets';

// v2: dest is now a city, not a country (D-036). Old v1 country-shaped dest is dropped.
const STORAGE_KEY = 'hauliday.trip.v2';

export type TripMode = 'abroad' | 'home';

interface TripState {
  home: Market;
  dest: DestinationCity | null;
  /** 'abroad' = haul comparison vs home; 'home' = local price check between stores. */
  mode: TripMode;
  /** Where you're shopping right now: dest when abroad, home when home. */
  shopping: Market | null;
  hydrated: boolean;
  setHome: (m: Market) => void;
  setDest: (c: DestinationCity) => void;
  setMode: (m: TripMode) => void;
}

const defaultHome = HOME_MARKETS[0]!;

const TripContext = createContext<TripState | null>(null);

export function TripProvider({ children }: { children: ReactNode }) {
  const [home, setHomeState] = useState<Market>(defaultHome);
  const [dest, setDestState] = useState<DestinationCity | null>(null);
  const [mode, setModeState] = useState<TripMode>('abroad');
  const [hydrated, setHydrated] = useState(false);

  // Load persisted trip once.
  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => {
        if (raw) {
          const saved = JSON.parse(raw) as { home?: string; destCity?: string; mode?: TripMode };
          if (saved.home) setHomeState(marketByCode(saved.home) ?? defaultHome);
          if (saved.destCity) setDestState(cityById(saved.destCity) ?? null);
          if (saved.mode === 'home' || saved.mode === 'abroad') setModeState(saved.mode);
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
      JSON.stringify({ home: home.code, destCity: dest?.cityId ?? null, mode }),
    );
  }, [home, dest, mode, hydrated]);

  const value = useMemo<TripState>(
    () => ({
      home,
      dest,
      mode,
      shopping: mode === 'home' ? home : dest,
      hydrated,
      setHome: setHomeState,
      setDest: setDestState,
      setMode: setModeState,
    }),
    [home, dest, mode, hydrated],
  );

  return <TripContext.Provider value={value}>{children}</TripContext.Provider>;
}

export function useTrip(): TripState {
  const ctx = useContext(TripContext);
  if (!ctx) throw new Error('useTrip must be used within a TripProvider');
  return ctx;
}

export { HOME_MARKETS, DESTINATION_CITIES, destinationsByCountry } from './markets';
