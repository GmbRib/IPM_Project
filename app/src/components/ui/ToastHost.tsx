import { useEffect } from 'react';
import { Pressable, View } from 'react-native';
import Animated, { FadeInDown, FadeOutDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useUi } from '@/stores/ui';

import { Text } from './Text';

// Long enough to read and reach "Anular" (WCAG 2.2.1: enough time).
const DURATION_MS = 8000;

/** Renders the current toast. Mounted once in the root layout. */
export function ToastHost() {
  const toast = useUi((s) => s.toast);
  const hideToast = useUi((s) => s.hideToast);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(hideToast, DURATION_MS);
    return () => clearTimeout(timer);
  }, [toast, hideToast]);

  if (!toast) return null;

  return (
    <Animated.View
      key={toast.id}
      entering={FadeInDown.springify().damping(18).stiffness(220)}
      exiting={FadeOutDown.duration(150)}
      pointerEvents="box-none"
      style={{ position: 'absolute', left: 16, right: 16, bottom: insets.bottom + 80 }}
    >
      <View
        accessibilityLiveRegion="polite"
        accessibilityRole="alert"
        className="min-h-12 flex-row items-center gap-3 rounded-2xl bg-ink px-4 py-2"
      >
        <Text className="flex-1 text-cream">{toast.message}</Text>
        {!!toast.actionLabel && (
          <Pressable
            onPress={() => {
              toast.onAction?.();
              hideToast();
            }}
            accessibilityRole="button"
            accessibilityLabel={toast.actionLabel}
            hitSlop={8}
            className="min-h-11 justify-center px-2 active:opacity-70"
          >
            <Text variant="label" className="font-body-bold text-sun">
              {toast.actionLabel}
            </Text>
          </Pressable>
        )}
      </View>
    </Animated.View>
  );
}
