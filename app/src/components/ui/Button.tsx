import type { LucideIcon } from 'lucide-react-native';
import { ActivityIndicator, View } from 'react-native';

import { cn } from '@/lib/cn';
import colors from '@/theme/colors';

import { PressableScale } from './PressableScale';
import { Text } from './Text';

const variants = {
  primary: { box: 'bg-sun border-sun', text: 'text-ink', icon: colors.ink },
  secondary: { box: 'bg-surface border-ink', text: 'text-ink', icon: colors.ink },
  ghost: {
    box: 'bg-transparent border-transparent',
    text: 'text-ember-text',
    icon: colors['ember-text'],
  },
  danger: { box: 'bg-danger border-danger', text: 'text-surface', icon: colors.surface },
} as const;

type ButtonProps = {
  title: string;
  onPress?: () => void;
  variant?: keyof typeof variants;
  size?: 'md' | 'sm';
  icon?: LucideIcon;
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  accessibilityHint?: string;
  className?: string;
};

export function Button({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  icon: Icon,
  disabled = false,
  loading = false,
  fullWidth = false,
  accessibilityHint,
  className,
}: ButtonProps) {
  const v = variants[variant];
  const inactive = disabled || loading;

  return (
    <PressableScale
      onPress={onPress}
      disabled={inactive}
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: inactive, busy: loading }}
      className={cn(
        'flex-row items-center justify-center rounded-full border-2 ',
        size === 'md' ? 'min-h-12 px-6' : 'min-h-11 px-4',
        fullWidth && 'self-stretch',
        v.box,
        inactive && 'opacity-50',
        className,
      )}
    >
      {loading ? (
        <ActivityIndicator color={v.icon} />
      ) : (
        <View className="flex-row items-center gap-2">
          {Icon && <Icon size={size === 'md' ? 20 : 18} color={v.icon} />}
          <Text variant="label" className={cn('font-body-bold', v.text)}>
            {title}
          </Text>
        </View>
      )}
    </PressableScale>
  );
}
