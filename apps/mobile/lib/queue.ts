import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from './supabase';

const QUEUE_KEY = 'hauliday.obsqueue.v1';

/** An observation captured locally, awaiting sync. Money is minor units. */
export interface PendingObservation {
  localId: string;
  variantId: string;
  retailerId?: string; // resolved chain; absent when the user typed a new one
  retailerName?: string; // free-text chain, resolved/created at sync time
  retailerCountry?: string; // where that chain was seen (for dedup on create)
  channel: 'in_store' | 'online';
  amountMinor: number;
  currency: string;
  taxInclusive: boolean;
  locality?: string; // city slug where seen (D-036), e.g. 'bangkok'
  observedOn: string; // YYYY-MM-DD, local shelf date
  createdAt: string; // ISO
  storeName?: string; // in-store: specific branch, resolved to a store at sync time
  storeArea?: string; // in-store: neighbourhood (free-text fallback)
  placeId?: string; // in-store: Google place id (preferred; resolves with coords)
  placeName?: string;
  placeAddress?: string;
  placeLat?: number;
  placeLng?: number;
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
    // Resolve the retailer (chain) first: prefer the picked id, else create/look
    // up the free-text chain the user typed (offline-first: name captured locally,
    // row resolved when back online). No retailer → can't insert; keep it queued.
    let retailerId = it.retailerId ?? null;
    if (!retailerId && it.retailerName) {
      const { data, error: rErr } = await supabase.rpc('find_or_create_retailer', {
        p_name: it.retailerName,
        p_country: (it.retailerCountry ?? '').toUpperCase(),
        p_channel: it.channel,
      });
      if (rErr || !data) {
        stillPending.push(it);
        continue;
      }
      retailerId = data as string;
    }
    if (!retailerId) {
      stillPending.push(it);
      continue;
    }

    // Resolve the specific store at sync time (offline-first: the name was
    // captured locally; the store row is created/looked up when back online).
    let storeId: string | null = null;
    if (it.channel === 'in_store' && it.placeId) {
      // Preferred: exact Google Place → store with coords.
      const { data, error: pErr } = await supabase.rpc('find_or_create_store_by_place', {
        p_retailer_id: retailerId,
        p_place_id: it.placeId,
        p_name: it.placeName ?? it.storeName ?? '',
        p_address: it.placeAddress ?? undefined,
        p_lat: it.placeLat ?? undefined,
        p_lng: it.placeLng ?? undefined,
      });
      if (pErr) {
        stillPending.push(it);
        continue;
      }
      storeId = (data as string | null) ?? null;
    } else if (it.channel === 'in_store' && it.storeName) {
      // Fallback: free-text branch + area.
      const { data, error: sErr } = await supabase.rpc('find_or_create_store', {
        p_retailer_id: retailerId,
        p_name: it.storeName,
        p_area: it.storeArea ?? undefined,
      });
      if (sErr) {
        stillPending.push(it);
        continue;
      }
      storeId = (data as string | null) ?? null;
    }

    const { error } = await supabase.from('observation').insert({
      variant_id: it.variantId,
      retailer_id: retailerId,
      store_id: storeId,
      channel: it.channel,
      amount_minor: it.amountMinor,
      currency: it.currency,
      tax_inclusive: it.taxInclusive,
      locality: it.locality ?? null,
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
