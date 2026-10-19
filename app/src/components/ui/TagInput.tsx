import { Plus, X } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, View } from 'react-native';

import { cn } from '@/lib/cn';
import colors from '@/theme/colors';

import { Chip } from './Chip';
import { IconButton } from './IconButton';
import { Text } from './Text';
import { TextField } from './TextField';

type TagInputProps = {
  label: string;
  values: string[];
  onChange: (values: string[]) => void;
  /** One-tap options shown under the field (hidden once added). */
  suggestions?: string[];
  placeholder?: string;
  error?: string;
  className?: string;
};

/** A list of short free-text values (allergies, medication…). */
export function TagInput({
  label,
  values,
  onChange,
  suggestions = [],
  placeholder,
  error,
  className,
}: TagInputProps) {
  const [draft, setDraft] = useState('');
  const has = (v: string) => values.some((x) => x.toLowerCase() === v.toLowerCase());

  function add(raw: string) {
    const value = raw.trim();
    if (value && !has(value)) onChange([...values, value]);
    setDraft('');
  }

  const remaining = suggestions.filter((s) => !has(s));

  return (
    <View className={cn('gap-2', className)}>
      <TextField
        label={label}
        value={draft}
        onChangeText={setDraft}
        placeholder={placeholder}
        error={error}
        returnKeyType="done"
        submitBehavior="submit"
        onSubmitEditing={() => add(draft)}
        trailing={
          draft.trim() ? (
            <IconButton
              icon={Plus}
              accessibilityLabel={`Adicionar ${draft.trim()}`}
              onPress={() => add(draft)}
              className="mr-1"
            />
          ) : null
        }
      />
      {values.length > 0 && (
        <View className="flex-row flex-wrap gap-2">
          {values.map((v) => (
            <Pressable
              key={v}
              onPress={() => onChange(values.filter((x) => x !== v))}
              accessibilityRole="button"
              accessibilityLabel={`Remover ${v}`}
              className="min-h-11 flex-row items-center gap-1.5 rounded-full border-2 border-gold bg-sun-soft pl-4 pr-3 active:opacity-80"
            >
              <Text variant="label">{v}</Text>
              <X size={16} color={colors.ink} />
            </Pressable>
          ))}
        </View>
      )}
      {remaining.length > 0 && (
        <View className="gap-2">
          <Text variant="caption">Sugestões</Text>
          <View className="flex-row flex-wrap gap-2">
            {remaining.map((s) => (
              <Chip key={s} label={`+ ${s}`} onPress={() => add(s)} />
            ))}
          </View>
        </View>
      )}
    </View>
  );
}
