import { Controller, type Control, type FieldValues, type Path } from 'react-hook-form';

import { PasswordField, TextField } from '@/components/ui';
import type { TextFieldProps } from '@/components/ui/TextField';

// TextField / PasswordField wired to a react-hook-form field: value, change, blur
// (for "validate when leaving the field") and the error message.

type Bound<T extends FieldValues> = Omit<TextFieldProps, 'value' | 'onChangeText' | 'error'> & {
  control: Control<T>;
  name: Path<T>;
};

export function FormTextField<T extends FieldValues>({ control, name, ...props }: Bound<T>) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <TextField
          {...props}
          ref={field.ref}
          value={field.value ?? ''}
          onChangeText={field.onChange}
          onBlur={field.onBlur}
          error={fieldState.error?.message}
        />
      )}
    />
  );
}

export function FormPasswordField<T extends FieldValues>({
  control,
  name,
  ...props
}: Omit<Bound<T>, 'secureTextEntry' | 'trailing'>) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <PasswordField
          {...props}
          ref={field.ref}
          value={field.value ?? ''}
          onChangeText={field.onChange}
          onBlur={field.onBlur}
          error={fieldState.error?.message}
        />
      )}
    />
  );
}
