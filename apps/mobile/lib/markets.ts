import type { CurrencyCode } from '@hauliday/money';
import { taxFreeRate } from '@hauliday/verdict';

/**
 * A market with the currency it implies. `cityId` is the price locality — prices
 * vary by city, so it's the unit crowd observations aggregate on (D-036). Home
 * markets are single-city (Singapore); destinations are cities in a country cluster.
 */
export interface Market {
  code: string; // ISO 3166-1 alpha-2 (the country cluster)
  name: string; // what screens render (city name for destinations)
  flag: string;
  currency: CurrencyCode;
  cityId: string; // stable locality slug, e.g. 'singapore', 'bangkok'
}

/**
 * Home markets. The wedge is Singapore; Malaysia is the second (D-037) — the
 * verdict now computes in the chosen home's currency. A market only carries a
 * useful verdict once it has home-price data (Phase B, per market).
 */
export const HOME_MARKETS: Market[] = [
  { code: 'SG', name: 'Singapore', flag: '🇸🇬', currency: 'SGD', cityId: 'singapore' },
  { code: 'MY', name: 'Malaysia', flag: '🇲🇾', currency: 'MYR', cityId: 'kuala-lumpur' },
];

/**
 * Country cluster: what's uniform nationally (currency, tax-free/VAT rules via
 * taxFreeRate, FX). Cities inherit these; only the price locality differs.
 */
export interface Country {
  code: string;
  name: string;
  flag: string;
  currency: CurrencyCode;
}

export const DESTINATION_COUNTRIES: Country[] = [
  { code: 'TH', name: 'Thailand', flag: '🇹🇭', currency: 'THB' },
  { code: 'JP', name: 'Japan', flag: '🇯🇵', currency: 'JPY' },
  { code: 'KR', name: 'South Korea', flag: '🇰🇷', currency: 'KRW' },
  { code: 'TW', name: 'Taiwan', flag: '🇹🇼', currency: 'TWD' },
];

/** A destination city — national attrs inherited flat from its country cluster. */
export interface DestinationCity extends Market {
  cityId: string;
  city: string; // display city name
  country: string; // display country name
}

// Bangkok is the first live corridor; the rest give the model its shape.
const CITY_DEFS: { cityId: string; city: string; country: string }[] = [
  { cityId: 'bangkok', city: 'Bangkok', country: 'TH' },
  { cityId: 'chiang-mai', city: 'Chiang Mai', country: 'TH' },
  { cityId: 'phuket', city: 'Phuket', country: 'TH' },
  { cityId: 'tokyo', city: 'Tokyo', country: 'JP' },
  { cityId: 'osaka', city: 'Osaka', country: 'JP' },
  { cityId: 'seoul', city: 'Seoul', country: 'KR' },
  { cityId: 'taipei', city: 'Taipei', country: 'TW' },
];

export const DESTINATION_CITIES: DestinationCity[] = CITY_DEFS.map((d) => {
  const c = DESTINATION_COUNTRIES.find((x) => x.code === d.country);
  if (!c) throw new Error(`Unknown country cluster ${d.country} for city ${d.cityId}`);
  return {
    cityId: d.cityId,
    city: d.city,
    country: c.name,
    code: c.code,
    currency: c.currency,
    name: d.city, // dest.name renders the city
    flag: c.flag,
  };
});

/** Destination cities grouped by their country cluster, for the picker. */
export function destinationsByCountry(): { country: Country; cities: DestinationCity[] }[] {
  return DESTINATION_COUNTRIES.map((country) => ({
    country,
    cities: DESTINATION_CITIES.filter((c) => c.code === country.code),
  })).filter((g) => g.cities.length > 0);
}

export function cityById(cityId: string): DestinationCity | undefined {
  return DESTINATION_CITIES.find((c) => c.cityId === cityId);
}

/** Home/market lookup by ISO code (home markets + country clusters). */
export function marketByCode(code: string): Market | undefined {
  const home = HOME_MARKETS.find((m) => m.code === code);
  if (home) return home;
  const c = DESTINATION_COUNTRIES.find((x) => x.code === code);
  return c ? { code: c.code, name: c.name, flag: c.flag, currency: c.currency, cityId: '' } : undefined;
}

/** Tourist tax-refund rate for a market (0 if none). Re-exported from @hauliday/verdict. */
export { taxFreeRate };
