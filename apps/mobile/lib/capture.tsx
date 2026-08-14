import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';
import type { ResolvedVariant, HomeEstimates } from './catalog';

/** The in-flight scan: what we identified, the home estimates, and the price entered. */
export interface CaptureSession {
  gtin: string;
  variant: ResolvedVariant | null; // null = barcode not in catalogue
  home: HomeEstimates | null;
  destShelfMinor: bigint | null;
}

interface CaptureState {
  session: CaptureSession | null;
  begin: (s: Omit<CaptureSession, 'destShelfMinor'>) => void;
  setDestShelfMinor: (minor: bigint) => void;
  clear: () => void;
}

const CaptureContext = createContext<CaptureState | null>(null);

export function CaptureProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<CaptureSession | null>(null);

  const value = useMemo<CaptureState>(
    () => ({
      session,
      begin: (s) => setSession({ ...s, destShelfMinor: null }),
      setDestShelfMinor: (minor) =>
        setSession((prev) => (prev ? { ...prev, destShelfMinor: minor } : prev)),
      clear: () => setSession(null),
    }),
    [session],
  );

  return <CaptureContext.Provider value={value}>{children}</CaptureContext.Provider>;
}

export function useCapture(): CaptureState {
  const ctx = useContext(CaptureContext);
  if (!ctx) throw new Error('useCapture must be used within a CaptureProvider');
  return ctx;
}
