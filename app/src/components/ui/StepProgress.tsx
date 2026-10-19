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

import { Text } from './Text';

type StepProgressProps = { step: number; total: number; className?: string };

/** "Passo 1 de 3" with one bar per step; bars fill smoothly as you advance. */
export function StepProgress({ step, total, className }: StepProgressProps) {
  return (
    <View
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={`Passo ${step} de ${total}`}
      accessibilityValue={{ min: 1, max: total, now: step }}
      className={cn('gap-2', className)}
    >
      <View className="flex-row gap-2">
        {Array.from({ length: total }, (_, i) => (
          <StepBar key={i} filled={i < step} />
        ))}
      </View>
      <Text variant="caption">
        Passo {step} de {total}
      </Text>
    </View>
  );
}

function StepBar({ filled }: { filled: boolean }) {
  const amount = useSharedValue(filled ? 100 : 0);
  useEffect(() => {
    amount.set(withTiming(filled ? 100 : 0, { duration: 350, easing: Easing.out(Easing.cubic) }));
  }, [filled, amount]);
  const fill = useAnimatedStyle(() => ({ width: `${amount.get()}%` }));

  return (
    <View className="h-2 flex-1 overflow-hidden rounded-full bg-line">
      <Animated.View style={[{ height: '100%', backgroundColor: colors.gold }, fill]} />
    </View>
  );
}
