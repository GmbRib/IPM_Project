import { GlassView } from 'expo-glass-effect';
import { X } from 'lucide-react-native';
import { useEffect, useState, type ReactNode } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  useWindowDimensions,
  View,
} from 'react-native';
import {
  GestureDetector,
  GestureHandlerRootView,
  usePanGesture,
} from 'react-native-gesture-handler';
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { scheduleOnRN } from 'react-native-worklets';

import { useGlass } from '@/lib/glass';
import colors from '@/theme/colors';

import { IconButton } from './IconButton';
import { Text } from './Text';

type BottomSheetProps = {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
};

const OPEN = { damping: 20, stiffness: 220, mass: 0.8 };
/** Drag further than this (or flick down) to close. */
const CLOSE_DISTANCE = 110;
const CLOSE_VELOCITY = 900;
const RADIUS = 32;

/**
 * Panel that slides up from the bottom and sizes itself to its content. Closes on the
 * ✕, a tap on the backdrop, the Android back button, or dragging the handle down; it
 * slides away instead of vanishing. Liquid Glass on iOS 26.
 */
export function BottomSheet({ open, onClose, title, children }: BottomSheetProps) {
  const insets = useSafeAreaInsets();
  const { height: screen } = useWindowDimensions();
  const glass = useGlass();
  // Stays true while the closing animation runs, so the modal doesn't vanish mid-way.
  const [shown, setShown] = useState(false);

  const offset = useSharedValue(screen);
  const drag = useSharedValue(0);
  const height = useSharedValue(screen);

  useEffect(() => {
    if (open) {
      drag.set(0);
      offset.set(withSpring(0, OPEN));
    } else {
      offset.set(
        withTiming(
          height.get() + 40,
          { duration: 220, easing: Easing.in(Easing.cubic) },
          (done) => {
            if (done) scheduleOnRN(setShown, false);
          },
        ),
      );
    }
  }, [open, offset, drag, height]);

  const pan = usePanGesture({
    activeOffsetY: 6,
    onUpdate: (e) => {
      'worklet';
      drag.set(Math.max(0, e.translationY));
    },
    onDeactivate: (e) => {
      'worklet';
      if (e.translationY > CLOSE_DISTANCE || e.velocityY > CLOSE_VELOCITY) {
        // Continue the close from where the finger left it.
        offset.set(drag.get());
        drag.set(0);
        scheduleOnRN(onClose);
      } else {
        drag.set(withSpring(0, OPEN));
      }
    },
  });

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: offset.get() + drag.get() }],
  }));
  const backdropStyle = useAnimatedStyle(() => ({
    opacity: interpolate(offset.get() + drag.get(), [0, height.get()], [1, 0], 'clamp'),
  }));

  const body = (
    <View style={{ paddingHorizontal: 20, paddingBottom: insets.bottom + 16 }}>
      <GestureDetector gesture={pan}>
        <View>
          <View
            className="mb-3 mt-2.5 h-1.5 w-11 self-center rounded-full bg-muted/40"
            accessibilityElementsHidden
          />
          {!!title && (
            <View className="mb-4 flex-row items-center justify-between gap-3">
              <Text variant="heading" className="flex-1">
                {title}
              </Text>
              <IconButton icon={X} variant="glass" accessibilityLabel="Fechar" onPress={onClose} />
            </View>
          )}
        </View>
      </GestureDetector>
      {children}
    </View>
  );

  return (
    <Modal
      visible={open || shown}
      transparent
      animationType="none"
      onShow={() => setShown(true)}
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <GestureHandlerRootView style={{ flex: 1 }}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={{ flex: 1, justifyContent: 'flex-end' }}
        >
          <Animated.View style={[{ position: 'absolute', inset: 0 }, backdropStyle]}>
            <Pressable
              onPress={onClose}
              accessibilityRole="button"
              accessibilityLabel="Fechar"
              className={glass ? 'flex-1 bg-ink/25' : 'flex-1 bg-ink/40'}
            />
          </Animated.View>
          <Animated.View
            style={[{ maxHeight: '90%' }, sheetStyle]}
            onLayout={(e) => height.set(e.nativeEvent.layout.height)}
            accessibilityViewIsModal
          >
            {glass ? (
              <GlassView
                colorScheme="light"
                tintColor="rgba(255,251,234,0.72)"
                style={{
                  borderTopLeftRadius: RADIUS,
                  borderTopRightRadius: RADIUS,
                  overflow: 'hidden',
                }}
              >
                {body}
              </GlassView>
            ) : (
              <View
                style={{
                  backgroundColor: colors.cream,
                  borderTopLeftRadius: RADIUS,
                  borderTopRightRadius: RADIUS,
                }}
              >
                {body}
              </View>
            )}
          </Animated.View>
        </KeyboardAvoidingView>
      </GestureHandlerRootView>
    </Modal>
  );
}
