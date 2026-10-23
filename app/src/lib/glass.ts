import { isGlassEffectAPIAvailable, isLiquidGlassAvailable } from 'expo-glass-effect';
import { useSyncExternalStore } from 'react';
import { AccessibilityInfo, Platform } from 'react-native';

// Liquid Glass (iOS 26+) for system-like elements: buttons, floating actions, sheets.
// Everywhere else (web, Android, older iOS) components use their solid style.

function checkSupport() {
  if (Platform.OS !== 'ios') return false;
  try {
    // The API check guards against iOS 26 betas where the API is missing and crashes.
    return isGlassEffectAPIAvailable() && isLiquidGlassAvailable();
  } catch {
    return false;
  }
}

const supported = checkSupport();

// "Reduce transparency" (Settings → Accessibility) turns glass off: solid styles read better.
let reduceTransparency = false;
const listeners = new Set<() => void>();

if (supported) {
  AccessibilityInfo.isReduceTransparencyEnabled().then((on) => {
    reduceTransparency = on;
    listeners.forEach((l) => l());
  });
  AccessibilityInfo.addEventListener('reduceTransparencyChanged', (on) => {
    reduceTransparency = on;
    listeners.forEach((l) => l());
  });
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** True when components should draw themselves in Liquid Glass. */
export function useGlass() {
  return useSyncExternalStore(
    subscribe,
    () => supported && !reduceTransparency,
    () => false,
  );
}
