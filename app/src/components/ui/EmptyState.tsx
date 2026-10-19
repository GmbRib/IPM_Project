import type { LucideIcon } from 'lucide-react-native';
import { View } from 'react-native';
import Animated, { FadeIn, ZoomIn } from 'react-native-reanimated';

import colors from '@/theme/colors';

import { Button } from './Button';
import { Text } from './Text';

type EmptyStateProps = {
  icon: LucideIcon;
  title: string;
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
};

export function EmptyState({ icon: Icon, title, message, actionLabel, onAction }: EmptyStateProps) {
  return (
    <Animated.View
      entering={FadeIn.duration(300)}
      style={{ alignItems: 'center', gap: 12, paddingHorizontal: 24, paddingVertical: 48 }}
    >
      <Animated.View entering={ZoomIn.springify().damping(14)}>
        <View className="h-20 w-20 items-center justify-center rounded-full bg-sun-soft">
          <Icon size={36} color={colors.ember} />
        </View>
      </Animated.View>
      <Text variant="heading" className="text-center">
        {title}
      </Text>
      {!!message && <Text className="text-center text-muted">{message}</Text>}
      {!!actionLabel && onAction && (
        <Button title={actionLabel} onPress={onAction} className="mt-2" />
      )}
    </Animated.View>
  );
}
