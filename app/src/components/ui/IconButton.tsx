import { GlassView } from 'expo-glass-effect';
import type { LucideIcon } from 'lucide-react-native';

import { cn } from '@/lib/cn';
import { useGlass } from '@/lib/glass';
import colors from '@/theme/colors';

import { PressableScale } from './PressableScale';

type IconButtonProps = {
  icon: LucideIcon;
  /** Required: icon-only buttons have no visible text for screen readers. */
  accessibilityLabel: string;
  onPress?: () => void;
  /**
   * plain: just the icon. filled: yellow circle (main action).
   * glass: system-style button (back, close, menu) — Liquid Glass on iOS 26, plain elsewhere.
   */
  variant?: 'plain' | 'filled' | 'glass';
  color?: string;
  className?: string;
};

const SIZE = 44;

/** 44×44 round button holding a single icon. */
export function IconButton({
  icon: Icon,
  accessibilityLabel,
  onPress,
  variant = 'plain',
  color = colors.ink,
  className,
}: IconButtonProps) {
  const glass = useGlass() && variant !== 'plain';

  if (glass) {
    return (
      <PressableScale
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        hitSlop={4}
        haptic
        className={cn('rounded-full', className)}
      >
        <GlassView
          colorScheme="light"
          tintColor={variant === 'filled' ? 'rgba(253,216,53,0.85)' : undefined}
          style={{
            width: SIZE,
            height: SIZE,
            borderRadius: SIZE / 2,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Icon size={22} color={color} />
        </GlassView>
      </PressableScale>
    );
  }

  return (
    <PressableScale
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      hitSlop={4}
      haptic={variant === 'filled'}
      className={cn(
        'h-11 w-11 items-center justify-center rounded-full',
        variant === 'filled' && 'border-2 border-b-4 border-ink bg-sun',
        className,
      )}
    >
      <Icon size={22} color={color} />
    </PressableScale>
  );
}
