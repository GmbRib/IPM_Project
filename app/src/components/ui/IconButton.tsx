import type { LucideIcon } from 'lucide-react-native';

import { cn } from '@/lib/cn';
import colors from '@/theme/colors';

import { PressableScale } from './PressableScale';

type IconButtonProps = {
  icon: LucideIcon;
  /** Required: icon-only buttons have no visible text for screen readers. */
  accessibilityLabel: string;
  onPress?: () => void;
  variant?: 'plain' | 'filled';
  color?: string;
  className?: string;
};

/** 44×44 round button holding a single icon. */
export function IconButton({
  icon: Icon,
  accessibilityLabel,
  onPress,
  variant = 'plain',
  color = colors.ink,
  className,
}: IconButtonProps) {
  return (
    <PressableScale
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      hitSlop={4}
      className={cn(
        'h-11 w-11 items-center justify-center rounded-full ',
        variant === 'filled' && 'bg-sun',
        className,
      )}
    >
      <Icon size={22} color={color} />
    </PressableScale>
  );
}
