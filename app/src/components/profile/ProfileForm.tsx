import { Controller, useForm, useWatch } from 'react-hook-form';
import { View } from 'react-native';

import { FormTextField } from '@/components/form/FormFields';
import { Button, TagInput, Text, Toggle } from '@/components/ui';
import { ALLERGY_SUGGESTIONS, MEDICATION_SUGGESTIONS } from '@/lib/labels';
import { profileSchema, type ProfileValues } from '@/lib/validation';
import { zodResolver } from '@/lib/zodResolver';
import { useSession } from '@/stores/session';

type Props = { submitLabel: string; onSaved: () => void };

/** Name + special needs. Used in onboarding (passo 1) and Perfil → Preferências. */
export function ProfileForm({ submitLabel, onSaved }: Props) {
  const user = useSession((s) => s.user);
  const updateUser = useSession((s) => s.updateUser);
  const c = user?.conditions;

  const { control, handleSubmit, formState } = useForm<ProfileValues>({
    resolver: zodResolver(profileSchema),
    mode: 'onTouched',
    defaultValues: {
      name: user?.name ?? '',
      wheelchair: c?.wheelchair ?? false,
      hasAllergies: (c?.allergies.length ?? 0) > 0,
      allergies: c?.allergies ?? [],
      hasMedication: (c?.medication.length ?? 0) > 0,
      medication: c?.medication ?? [],
    },
  });
  const [hasAllergies, hasMedication] = useWatch({
    control,
    name: ['hasAllergies', 'hasMedication'],
  });

  async function save(v: ProfileValues) {
    await updateUser({
      name: v.name,
      conditions: {
        wheelchair: v.wheelchair,
        allergies: v.hasAllergies ? v.allergies : [],
        medication: v.hasMedication ? v.medication : [],
      },
    });
    onSaved();
  }

  return (
    <View className="gap-6">
      <FormTextField
        control={control}
        name="name"
        label="Como te chamas?"
        required
        placeholder="O teu nome"
        autoComplete="given-name"
        textContentType="givenName"
        autoCapitalize="words"
        returnKeyType="done"
      />

      <View className="gap-3">
        <View className="gap-1">
          <Text variant="heading">Precisas de algo especial?</Text>
          <Text variant="caption">Juntamos à mala o que for preciso. Só tu vês estes dados.</Text>
        </View>

        <View className="rounded-card border border-line bg-surface px-4">
          <Controller
            control={control}
            name="wheelchair"
            render={({ field }) => (
              <Toggle
                label="Uso cadeira de rodas"
                value={field.value}
                onValueChange={field.onChange}
                className="py-3"
              />
            )}
          />
          <View className="h-px bg-line" />

          <Controller
            control={control}
            name="hasAllergies"
            render={({ field }) => (
              <Toggle
                label="Tenho alergias"
                value={field.value}
                onValueChange={field.onChange}
                className="py-3"
              />
            )}
          />
          {hasAllergies && (
            <Controller
              control={control}
              name="allergies"
              render={({ field, fieldState }) => (
                <TagInput
                  label="Quais?"
                  placeholder="Ex.: pólen"
                  values={field.value}
                  onChange={field.onChange}
                  suggestions={ALLERGY_SUGGESTIONS}
                  error={fieldState.error?.message}
                  className="pb-4"
                />
              )}
            />
          )}
          <View className="h-px bg-line" />

          <Controller
            control={control}
            name="hasMedication"
            render={({ field }) => (
              <Toggle
                label="Tomo medicação"
                value={field.value}
                onValueChange={field.onChange}
                className="py-3"
              />
            )}
          />
          {hasMedication && (
            <Controller
              control={control}
              name="medication"
              render={({ field, fieldState }) => (
                <TagInput
                  label="Qual?"
                  placeholder="Ex.: insulina"
                  values={field.value}
                  onChange={field.onChange}
                  suggestions={MEDICATION_SUGGESTIONS}
                  error={fieldState.error?.message}
                  className="pb-4"
                />
              )}
            />
          )}
        </View>
      </View>

      <Button
        title={submitLabel}
        fullWidth
        loading={formState.isSubmitting}
        onPress={handleSubmit(save)}
      />
    </View>
  );
}
