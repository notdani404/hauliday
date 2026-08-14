import { enqueue, flush, type PendingObservation } from './queue';

/** Local calendar date (what day it was on the shelf), not UTC. */
export function localDateISO(d: Date = new Date()): string {
  const offsetMs = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - offsetMs).toISOString().slice(0, 10);
}

export interface ObservationInput {
  variantId: string;
  retailerId: string;
  channel: 'in_store' | 'online';
  amountMinor: number;
  currency: string;
  taxInclusive: boolean;
}

/**
 * Capture a price observation: always queue it locally first (offline-first),
 * then attempt to sync. The user's contribution is never lost to a dead signal.
 */
export async function captureObservation(
  input: ObservationInput,
): Promise<{ synced: boolean; remaining: number }> {
  const item: PendingObservation = {
    localId: `${Date.now()}-${Math.round(Math.random() * 1e9)}`,
    createdAt: new Date().toISOString(),
    observedOn: localDateISO(),
    ...input,
  };
  await enqueue(item);
  const res = await flush();
  return { synced: res.synced > 0, remaining: res.remaining };
}
