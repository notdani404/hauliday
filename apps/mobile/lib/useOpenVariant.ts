import { router } from 'expo-router';
import { useTrip } from './trip';
import { useCapture } from './capture';
import { getHomeEstimates, type ResolvedVariant } from './catalog';

/**
 * Open a catalogue variant into the capture flow: fetch home estimates, seed the
 * capture session, and navigate to the product screen. Shared by the catalogue,
 * category, and watchlist screens.
 */
export function useOpenVariant() {
  const { home } = useTrip();
  const { begin } = useCapture();

  return async (variant: ResolvedVariant, gtin: string | null) => {
    let estimates = null;
    try {
      estimates = await getHomeEstimates(variant.variantId, home.code);
    } catch {
      // navigate anyway rather than trap the user
    }
    begin({ gtin: gtin ?? '', variant, home: estimates });
    router.push('/product');
  };
}
