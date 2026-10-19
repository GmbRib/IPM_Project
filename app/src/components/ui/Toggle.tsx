import { Pressable, Switch, View } from 'react-native';

import { cn } from '@/lib/cn';
import colors from '@/theme/colors';

import { Text } from './Text';

type ToggleProps = {
  label: string;
  description?: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
  className?: string;
};

/** A labelled switch; the whole row is tappable. */
export function Toggle({ label, description, value, onValueChange, className }: ToggleProps) {
  return (
    <Pressable
      onPress={() => onValueChange(!value)}
      accessibilityRole="switch"
      accessibilityLabel={label}
      accessibilityHint={description}
      accessibilityState={{ checked: value }}
      className={cn('min-h-12 flex-row items-center gap-3 py-2', className)}
    >
      <View className="flex-1">
        <Text variant="label">{label}</Text>
        {!!description && <Text variant="caption">{description}</Text>}
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: colors.line, true: colors.gold }}
        thumbColor={colors.surface}
        ios_backgroundColor={colors.line}
        // react-native-web ignores thumbColor when on and uses this instead.
        {...({ activeThumbColor: colors.surface } as object)}
        // The row already carries the accessible switch.
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
      />
    </Pressable>
  );
}
