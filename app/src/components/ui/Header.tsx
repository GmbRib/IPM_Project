import { ChevronLeft, X } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { View } from 'react-native';

import { goBack } from '@/lib/navigation';

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

/**
 * Screen title row. The ‹ / ✕ button sits on the title's line (not halfway down a
 * two-line block) and is a glass button on iOS 26.
 */
export function Header({ title, subtitle, leading, onLeadingPress, trailing }: HeaderProps) {
  const onPress = onLeadingPress ?? (() => goBack());

  return (
    <View className="flex-row items-start gap-3 pb-4 pt-2">
      {leading && (
        <IconButton
          icon={leading === 'back' ? ChevronLeft : X}
          variant="glass"
          accessibilityLabel={leading === 'back' ? 'Voltar' : 'Fechar'}
          onPress={onPress}
          // 44pt button centred on the 34pt title line.
          className="-mt-[5px]"
        />
      )}
      <View className="flex-1 gap-1">
        {!!title && <Text variant="title">{title}</Text>}
        {!!subtitle && <Text variant="caption">{subtitle}</Text>}
      </View>
      {trailing}
    </View>
  );
}
