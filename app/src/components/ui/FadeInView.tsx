import type { ReactNode } from 'react';
import Animated, { FadeInDown, LinearTransition } from 'react-native-reanimated';

type Props = {
  /** Position in a list: items appear one after the other. */
  index?: number;
  children: ReactNode;
};

const STAGGER_MS = 60;
const MAX_DELAY_MS = 360;

/** Rises and fades in on mount; slides smoothly when siblings above it change. */
export function FadeInView({ index = 0, children }: Props) {
  return (
    <Animated.View
      entering={FadeInDown.delay(Math.min(index * STAGGER_MS, MAX_DELAY_MS)).duration(380)}
      layout={LinearTransition.duration(250)}
    >
      {children}
    </Animated.View>
  );
}
