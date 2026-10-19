import { format, parse } from 'date-fns';
import { View } from 'react-native';

import { cn } from '@/lib/cn';
import colors from '@/theme/colors';

import type { DateFieldProps } from './DateField.types';
import { Text } from './Text';

const FORMATS = { date: 'yyyy-MM-dd', time: 'HH:mm' } as const;

/** Web version of DateField: the browser's own date/time input. */
export function DateField({
  label,
  value,
  onChange,
  mode = 'date',
  minimumDate,
  maximumDate,
  error,
  required,
  className,
}: DateFieldProps) {
  const fmt = FORMATS[mode];

  return (
    <View className={cn('gap-1.5', className)}>
      <Text variant="label">
        {label}
        {required && <Text className="text-ember-text"> *</Text>}
      </Text>
      <input
        type={mode}
        aria-label={label}
        aria-invalid={!!error}
        value={value ? format(value, fmt) : ''}
        min={minimumDate && mode === 'date' ? format(minimumDate, fmt) : undefined}
        max={maximumDate && mode === 'date' ? format(maximumDate, fmt) : undefined}
        onChange={(e) => {
          if (!e.target.value) return;
          const base = value ?? new Date();
          onChange(parse(e.target.value, fmt, base));
        }}
        style={{
          minHeight: 48,
          borderRadius: 16,
          border: `2px solid ${error ? colors.danger : colors.line}`,
          background: colors.surface,
          color: colors.ink,
          padding: '0 16px',
          fontFamily: 'Nunito_400Regular',
          fontSize: 16,
          accentColor: colors.ember,
        }}
      />
      {!!error && (
        <Text variant="caption" className="text-danger">
          {error}
        </Text>
      )}
    </View>
  );
}
