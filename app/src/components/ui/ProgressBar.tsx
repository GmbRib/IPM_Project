import { useEffect } from 'react';
import { View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { cn } from '@/lib/cn';
import colors from '@/theme/colors';

type ProgressBarProps = {
  /** 0 to 1. */
  value: number;
  accessibilityLabel?: string;
  className?: string;
};

/** Fills smoothly when the value changes (e.g. ticking an item in the packing list). */
export function ProgressBar({ value, accessibilityLabel, className }: ProgressBarProps) {
  const pct = Math.round(Math.min(1, Math.max(0, value)) * 100);
  const width = useSharedValue(0);

  useEffect(() => {
    width.set(withTiming(pct, { duration: 450, easing: Easing.out(Easing.cubic) }));
  }, [pct, width]);

  const fill = useAnimatedStyle(() => ({ width: `${width.get()}%` }));

  return (
    <View
      accessibilityRole="progressbar"
      accessibilityLabel={accessibilityLabel}
      accessibilityValue={{ min: 0, max: 100, now: pct }}
      className={cn('h-3 overflow-hidden rounded-full bg-line', className)}
    >
      <Animated.View
        style={[{ height: '100%', borderRadius: 999, backgroundColor: colors.gold }, fill]}
      />
    </View>
  );
}
