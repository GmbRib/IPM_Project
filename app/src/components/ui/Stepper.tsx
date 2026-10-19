import { Minus, Plus } from 'lucide-react-native';
import { Pressable, View } from 'react-native';

import { cn } from '@/lib/cn';
import colors from '@/theme/colors';

import { Text } from './Text';

type StepperProps = {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  className?: string;
};

/** Number input with − / + buttons (e.g. "Número de pessoas"). */
export function Stepper({ label, value, onChange, min = 0, max = 99, className }: StepperProps) {
  const dec = () => value > min && onChange(value - 1);
  const inc = () => value < max && onChange(value + 1);

  return (
    <View
      accessible
      accessibilityRole="adjustable"
      accessibilityLabel={label}
      accessibilityValue={{ min, max, now: value }}
      accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
      onAccessibilityAction={(e) => (e.nativeEvent.actionName === 'increment' ? inc() : dec())}
      className={cn('gap-2', className)}
    >
      <Text variant="label">{label}</Text>
      <View className="flex-row items-center self-start overflow-hidden rounded-full border-2 border-line bg-surface">
        <StepButton icon="minus" onPress={dec} disabled={value <= min} />
        <Text variant="heading" className="min-w-12 text-center">
          {value}
        </Text>
        <StepButton icon="plus" onPress={inc} disabled={value >= max} />
      </View>
    </View>
  );
}

function StepButton({
  icon,
  onPress,
  disabled,
}: {
  icon: 'minus' | 'plus';
  onPress: () => void;
  disabled: boolean;
}) {
  const Icon = icon === 'minus' ? Minus : Plus;
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      importantForAccessibility="no"
      className={cn(
        'h-12 w-12 items-center justify-center active:bg-sun-soft',
        disabled && 'opacity-30',
      )}
    >
      <Icon size={20} color={colors.ink} strokeWidth={2.5} />
    </Pressable>
  );
}
