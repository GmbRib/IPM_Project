import { Pressable, View } from 'react-native';

import { cn } from '@/lib/cn';

import { Text } from './Text';

type Option<T extends string> = { value: T; label: string };

type SegmentedControlProps<T extends string> = {
  label?: string;
  options: Option<T>[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
};

/** Pick exactly one of a few options (e.g. Lazer / Trabalho). */
export function SegmentedControl<T extends string>({
  label,
  options,
  value,
  onChange,
  className,
}: SegmentedControlProps<T>) {
  return (
    <View className={cn('gap-2', className)}>
      {!!label && <Text variant="label">{label}</Text>}
      <View
        accessibilityRole="radiogroup"
        accessibilityLabel={label}
        className="flex-row rounded-full border-2 border-line bg-surface p-1"
      >
        {options.map((o) => {
          const selected = o.value === value;
          return (
            <Pressable
              key={o.value}
              onPress={() => onChange(o.value)}
              accessibilityRole="radio"
              accessibilityState={{ selected }}
              className={cn(
                'min-h-11 flex-1 items-center justify-center rounded-full',
                selected && 'bg-sun',
              )}
            >
              <Text variant="label" className={selected ? 'font-body-bold' : 'text-muted'}>
                {o.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
