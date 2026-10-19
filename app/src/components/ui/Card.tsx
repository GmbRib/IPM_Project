import { ChevronRight } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { View } from 'react-native';

import { cn } from '@/lib/cn';
import colors from '@/theme/colors';

import { PressableScale } from './PressableScale';
import { Text } from './Text';

type CardProps = {
  title?: string;
  /** Makes the whole card a button and shows a chevron (the "*" in the sketches). */
  onPress?: () => void;
  accessibilityLabel?: string;
  children?: ReactNode;
  className?: string;
};

export function Card({ title, onPress, accessibilityLabel, children, className }: CardProps) {
  const body = (
    <>
      {!!title && (
        <View className="mb-2 flex-row items-center justify-between">
          <Text variant="heading" className="text-lg">
            {title}
          </Text>
          {onPress && <ChevronRight size={20} color={colors.muted} />}
        </View>
      )}
      {children}
    </>
  );
  const box = cn('rounded-card border border-line bg-surface p-4', className);

  if (!onPress) return <View className={box}>{body}</View>;
  return (
    <PressableScale
      onPress={onPress}
      pressedScale={0.98}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? title}
      className={cn(box, '')}
    >
      {body}
    </PressableScale>
  );
}
