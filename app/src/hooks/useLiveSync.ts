import { useEffect } from 'react';
import { AppState } from 'react-native';

import { useSession } from '@/stores/session';

/** Often enough to see a co-organiser's suggestion arrive; cheap when nothing changed. */
const EVERY_MS = 5000;

/** Keeps the data in step with the other phones while the app is open. */
export function useLiveSync(enabled: boolean) {
  useEffect(() => {
    if (!enabled) return;
    const refresh = () => {
      if (AppState.currentState === 'active') void useSession.getState().refresh();
    };
    const timer = setInterval(refresh, EVERY_MS);
    // Coming back to the app: catch up straight away.
    const subscription = AppState.addEventListener('change', refresh);
    return () => {
      clearInterval(timer);
      subscription.remove();
    };
  }, [enabled]);
}
