import { GlassView } from 'expo-glass-effect';
import type { LucideIcon } from 'lucide-react-native';
import { ActivityIndicator, View } from 'react-native';

import { cn } from '@/lib/cn';
import { useGlass } from '@/lib/glass';
import colors from '@/theme/colors';

import { PressableScale } from './PressableScale';
import { Text } from './Text';

// Solid look ("chunky", like the hand-drawn logo): ink outline with a thicker bottom
// edge. On iOS 26 the same buttons are drawn in Liquid Glass. (Not `isInteractive`:
// interactive glass keeps the touch for itself and the button never gets the press.)
const variants = {
  primary: {
    solid: 'bg-sun border-ink',
    glassTint: 'rgba(253,216,53,0.85)',
    text: 'text-ink',
    icon: colors.ink,
  },
  secondary: {
    solid: 'bg-surface border-ink',
    glassTint: 'rgba(255,255,255,0.6)',
    text: 'text-ink',
    icon: colors.ink,
  },
  danger: {
    solid: 'bg-danger border-[#7A1717]',
    glassTint: 'rgba(198,40,40,0.9)',
    text: 'text-surface',
    icon: colors.surface,
  },
  ghost: { solid: '', glassTint: undefined, text: 'text-ember-text', icon: colors['ember-text'] },
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
  const glass = useGlass() && variant !== 'ghost' && !inactive;
  const height = size === 'md' ? 52 : 44;

  const content = loading ? (
    <ActivityIndicator color={v.icon} />
  ) : (
    <View className="flex-row items-center justify-center gap-2">
      {Icon && <Icon size={size === 'md' ? 20 : 18} color={v.icon} />}
      <Text variant="label" className={cn('font-body-bold', size === 'md' && 'text-base', v.text)}>
        {title}
      </Text>
    </View>
  );

  const a11y = {
    accessibilityRole: 'button' as const,
    accessibilityLabel: title,
    accessibilityHint,
    accessibilityState: { disabled: inactive, busy: loading },
  };

  if (variant === 'ghost') {
    return (
      <PressableScale
        {...a11y}
        onPress={onPress}
        disabled={inactive}
        hitSlop={6}
        className={cn(
          'min-h-11 flex-row items-center justify-center px-2',
          inactive && 'opacity-50',
          className,
        )}
      >
        {content}
      </PressableScale>
    );
  }

  if (glass) {
    return (
      <PressableScale
        {...a11y}
        onPress={onPress}
        haptic
        className={cn(
          'rounded-full',
          // Light glass on the plain cream background needs an outline to read as a button.
          variant === 'secondary' && 'border-[1.5px] border-line',
          fullWidth && 'self-stretch',
          className,
        )}
      >
        <GlassView
          colorScheme="light"
          tintColor={v.glassTint}
          style={{
            minHeight: height,
            borderRadius: height / 2,
            paddingHorizontal: size === 'md' ? 24 : 16,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {content}
        </GlassView>
      </PressableScale>
    );
  }

  return (
    <PressableScale
      {...a11y}
      onPress={onPress}
      disabled={inactive}
      haptic
      className={cn(
        'flex-row items-center justify-center rounded-full border-2 border-b-[5px]',
        size === 'md' ? 'min-h-[52px] px-6' : 'min-h-11 px-4',
        fullWidth && 'self-stretch',
        v.solid,
        inactive && 'opacity-50',
        className,
      )}
    >
      {content}
    </PressableScale>
  );
}
