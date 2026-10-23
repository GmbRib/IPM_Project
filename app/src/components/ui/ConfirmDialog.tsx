import { Modal, Pressable, View } from 'react-native';
import Animated, { ZoomIn } from 'react-native-reanimated';

import { Button } from './Button';
import { Text } from './Text';

type ConfirmDialogProps = {
  open: boolean;
  title: string;
  message?: string;
  confirmLabel: string;
  /** Leave out for a single-button notice. */
  cancelLabel?: string;
  destructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

/** Centered dialog. Works on web too (react-native's Alert doesn't). */
export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel,
  cancelLabel,
  destructive = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  return (
    <Modal visible={open} transparent animationType="fade" onRequestClose={onCancel}>
      <View className="flex-1 items-center justify-center px-6">
        <Pressable
          onPress={onCancel}
          accessibilityRole="button"
          accessibilityLabel="Fechar"
          className="absolute inset-0 bg-ink/40"
        />
        {/* Pops in on a spring (styling sits on the inner View: classes don't reach Animated views). */}
        <Animated.View
          entering={ZoomIn.springify().damping(16).stiffness(260)}
          style={{ width: '100%', maxWidth: 384 }}
        >
          <View
            accessibilityViewIsModal
            accessibilityRole="alert"
            className="gap-4 rounded-card bg-cream p-6"
          >
            <Text variant="heading">{title}</Text>
            {!!message && <Text className="text-muted">{message}</Text>}
            <View className="gap-2">
              <Button
                title={confirmLabel}
                variant={destructive ? 'danger' : 'primary'}
                fullWidth
                onPress={onConfirm}
              />
              {!!cancelLabel && (
                <Button title={cancelLabel} variant="secondary" fullWidth onPress={onCancel} />
              )}
            </View>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}
