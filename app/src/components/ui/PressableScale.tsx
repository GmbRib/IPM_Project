import * as Haptics from 'expo-haptics';
import { cssInterop } from 'nativewind';
import { useEffect, type ComponentProps } from 'react';
import { Platform, Pressable, type StyleProp, type ViewStyle } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
} from 'react-native-reanimated';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

type Props = Omit<ComponentProps<typeof Pressable>, 'style'> & {
  className?: string;
  style?: StyleProp<ViewStyle>;
  /** 'strong' for buttons, 'soft' for big cards, 'none' to only keep the press feedback off. */
  bounce?: 'strong' | 'soft' | 'none';
  /** Light tap feedback on iOS/Android. */
  haptic?: boolean;
  /** Change this value to make it "pop" once (e.g. when a chip gets selected). */
  popKey?: unknown;
};

const PRESS = { damping: 16, stiffness: 420, mass: 0.5 };
const RELEASE = { damping: 9, stiffness: 260, mass: 0.6 };
const SETTLE = { damping: 12, stiffness: 220, mass: 0.6 };

const BOUNCE = {
  strong: { down: 0.92, up: 1.05 },
  soft: { down: 0.98, up: 1.01 },
  none: { down: 1, up: 1 },
};

/**
 * Pressable with a "bubbly" feel: squashes while pressed, overshoots a little on
 * release, then settles. Follows the system "reduce motion" setting.
 *
 * NativeWind is registered on this plain component (not on the Reanimated one):
 * that way `className` becomes a normal `style` on iOS/Android as well as on the web.
 */
function PressableScaleImpl({
  bounce = 'strong',
  haptic = false,
  popKey,
  onPressIn,
  onPressOut,
  style,
  ...props
}: Props) {
  const scale = useSharedValue(1);
  const animated = useAnimatedStyle(() => ({ transform: [{ scale: scale.get() }] }));
  const b = BOUNCE[bounce];

  useEffect(() => {
    if (popKey === undefined || popKey === false) return;
    scale.set(withSequence(withSpring(1.08, RELEASE), withSpring(1, SETTLE)));
  }, [popKey, scale]);

  return (
    <AnimatedPressable
      {...props}
      style={[style, animated]}
      onPressIn={(e) => {
        scale.set(withSpring(b.down, PRESS));
        if (haptic && Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onPressIn?.(e);
      }}
      onPressOut={(e) => {
        scale.set(withSequence(withSpring(b.up, RELEASE), withSpring(1, SETTLE)));
        onPressOut?.(e);
      }}
    />
  );
}

cssInterop(PressableScaleImpl, { className: 'style' });

export const PressableScale = PressableScaleImpl;
