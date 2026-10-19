import { X } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, View } from 'react-native';
import Animated, { SlideInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { IconButton } from './IconButton';
import { Text } from './Text';

type BottomSheetProps = {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
};

/**
 * Panel that slides up from the bottom and sizes itself to its content.
 * Controlled: render it anywhere and flip `open`. Closes on the ✕, a tap on the
 * backdrop, or the Android back button.
 */
export function BottomSheet({ open, onClose, title, children }: BottomSheetProps) {
  const insets = useSafeAreaInsets();

  return (
    <Modal
      visible={open}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1 justify-end"
      >
        <Pressable
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel="Fechar"
          className="absolute inset-0 bg-ink/40"
        />
        {/* NativeWind classes don't reach Reanimated views, so styling lives on the inner View. */}
        <Animated.View entering={SlideInDown.duration(250)} style={{ maxHeight: '90%' }}>
          <View
            accessibilityViewIsModal
            className="rounded-t-[28px] bg-cream px-5 pt-2"
            style={{ paddingBottom: insets.bottom + 16 }}
          >
            <View className="mb-2 h-1.5 w-11 self-center rounded-full bg-line" />
            {!!title && (
              <View className="mb-3 flex-row items-center justify-between">
                <Text variant="heading" className="flex-1">
                  {title}
                </Text>
                <IconButton icon={X} accessibilityLabel="Fechar" onPress={onClose} />
              </View>
            )}
            {children}
          </View>
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
