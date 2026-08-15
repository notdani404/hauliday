import { config } from './config';

// Google Places API (New) — called directly from the client. The web key is
// referrer-restricted to hauliday.app (D-022). CORS-enabled, unlike the classic
// web service. Native builds need a separate key or a proxy.

const BASE = 'https://places.googleapis.com/v1';

export interface PlaceSuggestion {
  placeId: string;
  primary: string; // main text, e.g. "Matsukiyo"
  secondary: string; // address context
}

export interface PlaceDetail {
  placeId: string;
  name: string;
  address: string | null;
  lat: number | null;
  lng: number | null;
}

export const placesEnabled = (): boolean => !!config.googleMapsKey;

/** Autocomplete store/place suggestions for a query, optionally biased to a country. */
export async function placesAutocomplete(
  input: string,
  regionCode?: string,
): Promise<PlaceSuggestion[]> {
  if (!config.googleMapsKey || input.trim().length < 2) return [];
  try {
    const res = await fetch(`${BASE}/places:autocomplete`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': config.googleMapsKey,
      },
      body: JSON.stringify({
        input,
        includedPrimaryTypes: ['store', 'establishment'],
        ...(regionCode ? { regionCode: regionCode.toLowerCase() } : {}),
      }),
    });
    if (!res.ok) return [];
    const json = (await res.json()) as {
      suggestions?: Array<{
        placePrediction?: {
          placeId: string;
          structuredFormat?: { mainText?: { text: string }; secondaryText?: { text: string } };
          text?: { text: string };
        };
      }>;
    };
    return (json.suggestions ?? [])
      .map((s) => s.placePrediction)
      .filter((p): p is NonNullable<typeof p> => !!p?.placeId)
      .map((p) => ({
        placeId: p.placeId,
        primary: p.structuredFormat?.mainText?.text ?? p.text?.text ?? '',
        secondary: p.structuredFormat?.secondaryText?.text ?? '',
      }));
  } catch {
    return [];
  }
}

/** Resolve a place id to name/address/coords. */
export async function placeDetails(placeId: string): Promise<PlaceDetail | null> {
  if (!config.googleMapsKey) return null;
  try {
    const res = await fetch(`${BASE}/places/${encodeURIComponent(placeId)}`, {
      headers: {
        'X-Goog-Api-Key': config.googleMapsKey,
        'X-Goog-FieldMask': 'id,displayName,formattedAddress,location',
      },
    });
    if (!res.ok) return null;
    const j = (await res.json()) as {
      id: string;
      displayName?: { text: string };
      formattedAddress?: string;
      location?: { latitude: number; longitude: number };
    };
    return {
      placeId: j.id,
      name: j.displayName?.text ?? '',
      address: j.formattedAddress ?? null,
      lat: j.location?.latitude ?? null,
      lng: j.location?.longitude ?? null,
    };
  } catch {
    return null;
  }
}
