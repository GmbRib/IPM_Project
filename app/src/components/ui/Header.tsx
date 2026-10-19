import { goBack } from '@/lib/navigation';
import { ChevronLeft, X } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { View } from 'react-native';

import { IconButton } from './IconButton';
import { Text } from './Text';

type HeaderProps = {
  title?: string;
  subtitle?: string;
  /** 'back' shows ‹ (stack screens), 'close' shows ✕ (wizards and modals). */
  leading?: 'back' | 'close';
  onLeadingPress?: () => void;
  trailing?: ReactNode;
};

export function Header({ title, subtitle, leading, onLeadingPress, trailing }: HeaderProps) {
  const onPress = onLeadingPress ?? (() => goBack());

  return (
    <View className="min-h-14 flex-row items-center gap-1 py-2">
      {leading && (
        <IconButton
          icon={leading === 'back' ? ChevronLeft : X}
          accessibilityLabel={leading === 'back' ? 'Voltar' : 'Fechar'}
          onPress={onPress}
          className="-ml-2"
        />
      )}
      <View className="flex-1">
        {!!title && <Text variant="title">{title}</Text>}
        {!!subtitle && <Text variant="caption">{subtitle}</Text>}
      </View>
      {trailing}
    </View>
  );
}
