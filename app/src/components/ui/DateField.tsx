import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { CalendarDays, Clock } from 'lucide-react-native';
import { Platform, Pressable, View } from 'react-native';

import { cn } from '@/lib/cn';
import { formatDate, formatTime } from '@/lib/dates';
import colors from '@/theme/colors';

import type { DateFieldProps } from './DateField.types';
import { Text } from './Text';

/**
 * Date or time input. Android opens the system dialog; iOS shows the compact native
 * picker inside the field. The web version lives in DateField.web.tsx.
 */
export function DateField({
  label,
  value,
  onChange,
  mode = 'date',
  minimumDate,
  maximumDate,
  placeholder = mode === 'date' ? 'dd/mm/aaaa' : '--:--',
  error,
  required,
  className,
}: DateFieldProps) {
  const Icon = mode === 'date' ? CalendarDays : Clock;
  const shown = value ? (mode === 'date' ? formatDate(value) : formatTime(value)) : null;
  const box = cn(
    'min-h-12 flex-row items-center gap-3 rounded-2xl border-2 bg-surface px-4',
    error ? 'border-danger' : 'border-line',
  );

  return (
    <View className={cn('gap-1.5', className)}>
      <Text variant="label">
        {label}
        {required && <Text className="text-ember-text"> *</Text>}
      </Text>
      {Platform.OS === 'ios' ? (
        <View className={box}>
          <Icon size={20} color={colors.muted} />
          <View className="flex-1 items-start">
            <DateTimePicker
              value={value ?? minimumDate ?? new Date()}
              mode={mode}
              display="compact"
              locale="pt-PT"
              accentColor={colors.ember}
              minimumDate={minimumDate}
              maximumDate={maximumDate}
              onValueChange={(_, date) => onChange(date)}
              accessibilityLabel={label}
            />
          </View>
        </View>
      ) : (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={label}
          accessibilityValue={{ text: shown ?? 'Sem valor' }}
          onPress={() =>
            DateTimePickerAndroid.open({
              value: value ?? minimumDate ?? new Date(),
              mode,
              is24Hour: true,
              minimumDate,
              maximumDate,
              onValueChange: (_, date) => onChange(date),
            })
          }
          className={cn(box, 'active:opacity-80')}
        >
          <Icon size={20} color={colors.muted} />
          <Text className={shown ? 'text-ink' : 'text-muted'}>{shown ?? placeholder}</Text>
        </Pressable>
      )}
      {!!error && (
        <Text variant="caption" className="text-danger" accessibilityLiveRegion="polite">
          {error}
        </Text>
      )}
    </View>
  );
}
