import { useState, type ComponentRef, type ReactNode, type Ref } from 'react';
import { TextInput, View, type TextInputProps } from 'react-native';

import { cn } from '@/lib/cn';
import colors from '@/theme/colors';

import { Text } from './Text';

export type TextFieldProps = Omit<TextInputProps, 'className'> & {
  label: string;
  hint?: string;
  error?: string;
  required?: boolean;
  /** Shown inside the field on the right (e.g. the show-password button). */
  trailing?: ReactNode;
  ref?: Ref<ComponentRef<typeof TextInput>>;
  className?: string;
};

export function TextField({
  label,
  hint,
  error,
  required,
  trailing,
  ref,
  className,
  onFocus,
  onBlur,
  ...props
}: TextFieldProps) {
  const [focused, setFocused] = useState(false);

  return (
    <View className={cn('gap-1.5', className)}>
      <Text variant="label">
        {label}
        {required && <Text className="text-ember-text"> *</Text>}
      </Text>
      <View
        className={cn(
          'min-h-12 flex-row items-center rounded-2xl border-2 bg-surface',
          error ? 'border-danger' : focused ? 'border-gold' : 'border-line',
        )}
      >
        <TextInput
          ref={ref}
          accessibilityLabel={label}
          accessibilityHint={error ?? hint}
          placeholderTextColor={colors.muted}
          onFocus={(e) => {
            setFocused(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            onBlur?.(e);
          }}
          className="min-h-12 flex-1 px-4 font-body text-base text-ink outline-none"
          {...props}
        />
        {trailing}
      </View>
      {error ? (
        <Text variant="caption" className="text-danger" accessibilityLiveRegion="polite">
          {error}
        </Text>
      ) : (
        hint && <Text variant="caption">{hint}</Text>
      )}
    </View>
  );
}
