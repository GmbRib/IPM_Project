import type { ReactNode } from 'react';
import Animated, { FadeInDown } from 'react-native-reanimated';

type Props = {
  /** Position in a list: items appear one after the other. */
  index?: number;
  children: ReactNode;
};

const STAGGER_MS = 45;
const MAX_DELAY_MS = 180;

// A short rise on a soft spring: the card settles instead of sliding in linearly.
// (No layout transition: on long screens it made cards jump while others changed.)
const rise = (index: number) =>
  FadeInDown.delay(Math.min(index * STAGGER_MS, MAX_DELAY_MS))
    .withInitialValues({ opacity: 0, transform: [{ translateY: 14 }] })
    .springify()
    .damping(20)
    .stiffness(180);

/** Rises and fades in on mount, one card after the other. */
export function FadeInView({ index = 0, children }: Props) {
  return <Animated.View entering={rise(index)}>{children}</Animated.View>;
}
