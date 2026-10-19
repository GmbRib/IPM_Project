import { cssInterop } from 'nativewind';
import type { ComponentProps } from 'react';
import { Pressable } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

// Reanimated components don't get NativeWind classes on their own; registering this
// one lets it take `className` like a normal Pressable.
const AnimatedPressable = Animated.createAnimatedComponent(Pressable);
cssInterop(AnimatedPressable, { className: 'style' });

type Props = ComponentProps<typeof Pressable> & {
  className?: string;
  /** How small it gets while pressed (1 = no effect). */
  pressedScale?: number;
};

const SPRING = { damping: 18, stiffness: 320, mass: 0.6 };

/**
 * Pressable that shrinks slightly while pressed and springs back: the tactile feel of
 * buttons, cards and chips. Follows the system "reduce motion" setting.
 */
export function PressableScale({
  pressedScale = 0.96,
  onPressIn,
  onPressOut,
  style,
  ...props
}: Props) {
  const scale = useSharedValue(1);
  const animated = useAnimatedStyle(() => ({ transform: [{ scale: scale.get() }] }));

  return (
    <AnimatedPressable
      {...props}
      style={[style as object, animated]}
      onPressIn={(e) => {
        scale.set(withSpring(pressedScale, SPRING));
        onPressIn?.(e);
      }}
      onPressOut={(e) => {
        scale.set(withSpring(1, SPRING));
        onPressOut?.(e);
      }}
    />
  );
}
