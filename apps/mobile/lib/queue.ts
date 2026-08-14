import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from './supabase';

const QUEUE_KEY = 'hauliday.obsqueue.v1';

/** An observation captured locally, awaiting sync. Money is minor units. */
export interface PendingObservation {
  localId: string;
  variantId: string;
  retailerId: string;
  channel: 'in_store' | 'online';
  amountMinor: number;
  currency: string;
  taxInclusive: boolean;
  observedOn: string; // YYYY-MM-DD, local shelf date
  createdAt: string; // ISO
}

async function readQueue(): Promise<PendingObservation[]> {
  const raw = await AsyncStorage.getItem(QUEUE_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as PendingObservation[];
  } catch {
    return [];
  }
}

async function writeQueue(items: PendingObservation[]): Promise<void> {
  await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(items));
}

export async function enqueue(item: PendingObservation): Promise<void> {
  const items = await readQueue();
  items.push(item);
  await writeQueue(items);
}

export async function pending(): Promise<PendingObservation[]> {
  return readQueue();
}

/**
 * Try to sync queued observations to the ledger. Each success is removed from
 * the queue; failures (offline, RLS) stay for the next attempt. Offline-first:
 * capture never blocks on connectivity (non-negotiable #6).
 */
export async function flush(): Promise<{ synced: number; remaining: number }> {
  const items = await readQueue();
  if (items.length === 0) return { synced: 0, remaining: 0 };

  const stillPending: PendingObservation[] = [];
  let synced = 0;

  for (const it of items) {
    const { error } = await supabase.from('observation').insert({
      variant_id: it.variantId,
      retailer_id: it.retailerId,
      channel: it.channel,
      amount_minor: it.amountMinor,
      currency: it.currency,
      tax_inclusive: it.taxInclusive,
      source: 'human',
      observed_on: it.observedOn,
    });
    if (error) {
      stillPending.push(it);
    } else {
      synced += 1;
    }
  }

  await writeQueue(stillPending);
  return { synced, remaining: stillPending.length };
}
