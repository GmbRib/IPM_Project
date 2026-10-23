import { Check } from 'lucide-react-native';

import { cn } from '@/lib/cn';
import colors from '@/theme/colors';

import { PressableScale } from './PressableScale';
import { Text } from './Text';

type ChipProps = {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  className?: string;
};

/** Toggleable pill. Selection is shown with a check icon too, not only with color. */
export function Chip({ label, selected = false, onPress, className }: ChipProps) {
  return (
    <PressableScale
      onPress={onPress}
      accessibilityRole="checkbox"
      accessibilityLabel={label}
      accessibilityState={{ checked: selected }}
      popKey={selected}
      haptic
      className={cn(
        'min-h-11 flex-row items-center gap-1.5 rounded-full border-2 px-4 ',
        selected ? 'border-gold bg-sun-soft' : 'border-line bg-surface',
        className,
      )}
    >
      {selected && <Check size={16} color={colors.ink} strokeWidth={3} />}
      <Text variant="label">{label}</Text>
    </PressableScale>
  );
}
