import { useRef, useState } from 'react';
import { Text, View, TextInput, StyleSheet, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { CameraView, useCameraPermissions, type BarcodeScanningResult } from 'expo-camera';
import { useTrip } from '../lib/trip';
import { useCapture } from '../lib/capture';
import { resolveBarcode, getHomeEstimates } from '../lib/catalog';
import { Button } from '../lib/ui';
import { theme } from '../lib/theme';

export default function Scan() {
  const { home } = useTrip();
  const { begin } = useCapture();
  const [permission, requestPermission] = useCameraPermissions();
  const [manual, setManual] = useState('');
  const [busy, setBusy] = useState(false);
  const handled = useRef(false);

  async function handleGtin(gtin: string) {
    if (handled.current) return;
    handled.current = true;
    setBusy(true);
    const variant = await resolveBarcode(gtin);
    const estimates = variant ? await getHomeEstimates(variant.variantId, home.code) : null;
    begin({ gtin, variant, home: estimates });
    router.replace('/product');
  }

  const onBarcode = (r: BarcodeScanningResult) => {
    if (r.data) void handleGtin(r.data.trim());
  };

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.camWrap}>
        {permission?.granted ? (
          <CameraView
            style={StyleSheet.absoluteFill}
            barcodeScannerSettings={{ barcodeTypes: ['ean13', 'ean8', 'upc_a', 'upc_e', 'qr'] }}
            onBarcodeScanned={busy ? undefined : onBarcode}
          />
        ) : (
          <View style={styles.permBox}>
            <Text style={styles.permText}>
              {permission ? 'Camera access is needed to scan barcodes.' : 'Checking camera…'}
            </Text>
            {permission && !permission.granted && (
              <Button title="Allow camera" onPress={() => void requestPermission()} />
            )}
          </View>
        )}
        <View style={styles.reticle} pointerEvents="none" />
      </View>

      <Text style={styles.hint}>{busy ? 'Looking it up…' : 'Point at the barcode on the package.'}</Text>

      <View style={styles.manual}>
        <Text style={styles.manualLabel}>No camera? Type the barcode.</Text>
        <View style={styles.manualRow}>
          <TextInput
            style={styles.input}
            value={manual}
            onChangeText={setManual}
            placeholder="e.g. 4901872046508"
            keyboardType="number-pad"
            editable={!busy}
          />
          <Pressable
            style={[styles.go, (!manual || busy) && styles.goDisabled]}
            disabled={!manual || busy}
            onPress={() => void handleGtin(manual.trim())}
          >
            <Text style={styles.goText}>Look up</Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: theme.bg, paddingHorizontal: 20, paddingTop: 8 },
  camWrap: {
    flex: 1,
    borderRadius: 18,
    overflow: 'hidden',
    backgroundColor: '#1D1D22',
    marginTop: 8,
  },
  permBox: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 14, padding: 24 },
  permText: { color: theme.white, textAlign: 'center', fontSize: 14 },
  reticle: {
    position: 'absolute',
    top: '30%',
    bottom: '30%',
    left: '12%',
    right: '12%',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.7)',
    borderRadius: 14,
  },
  hint: { textAlign: 'center', color: theme.slate, fontSize: 13, paddingVertical: 12 },
  manual: { paddingBottom: 24, gap: 8 },
  manualLabel: { fontSize: 12, color: theme.slate },
  manualRow: { flexDirection: 'row', gap: 8 },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: theme.line,
    borderRadius: 11,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: theme.white,
    color: theme.ink,
  },
  go: { backgroundColor: theme.coral, borderRadius: 11, paddingHorizontal: 16, justifyContent: 'center' },
  goDisabled: { opacity: 0.45 },
  goText: { color: theme.white, fontWeight: '700' },
});
