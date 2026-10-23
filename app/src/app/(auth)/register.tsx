import { router } from 'expo-router';
import { useRef, type ComponentRef } from 'react';
import { useForm } from 'react-hook-form';
import { TextInput, View } from 'react-native';

import { FormPasswordField, FormTextField } from '@/components/form/FormFields';
import { Banner, Button, Header, Screen, Text } from '@/components/ui';
import { AuthError } from '@/data/repositories';
import { zodResolver } from '@/lib/zodResolver';
import { PASSWORD_MIN, registerSchema, type RegisterValues } from '@/lib/validation';
import { useSession } from '@/stores/session';

export default function RegisterScreen() {
  const register = useSession((s) => s.register);
  const passwordRef = useRef<ComponentRef<typeof TextInput>>(null);
  const confirmRef = useRef<ComponentRef<typeof TextInput>>(null);

  const {
    control,
    handleSubmit,
    setError,
    formState: { errors, isValid, isSubmitting },
  } = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    mode: 'onTouched',
    defaultValues: { email: '', password: '', confirm: '' },
  });

  async function createAccount({ email, password }: RegisterValues) {
    try {
      await register(email, password);
    } catch (err) {
      if (err instanceof AuthError && err.code === 'email_taken') {
        setError('email', { message: err.message }, { shouldFocus: true });
      } else {
        setError('root', { message: 'Não foi possível criar a conta. Tenta outra vez.' });
      }
    }
  }

  return (
    <Screen scroll>
      <Header leading="back" title="Criar conta" subtitle="Demora menos de um minuto." />
      <View className="mt-4 gap-4">
        {!!errors.root?.message && <Banner tone="danger" message={errors.root.message} />}
        <FormTextField
          control={control}
          name="email"
          label="Email"
          placeholder="ana@mail.pt"
          autoCapitalize="none"
          autoComplete="email"
          keyboardType="email-address"
          textContentType="emailAddress"
          returnKeyType="next"
          submitBehavior="submit"
          onSubmitEditing={() => passwordRef.current?.focus()}
        />
        <FormPasswordField
          control={control}
          name="password"
          label="Palavra-passe"
          hint={`Pelo menos ${PASSWORD_MIN} caracteres`}
          ref={passwordRef}
          autoComplete="new-password"
          textContentType="newPassword"
          returnKeyType="next"
          submitBehavior="submit"
          onSubmitEditing={() => confirmRef.current?.focus()}
        />
        <FormPasswordField
          control={control}
          name="confirm"
          label="Confirmar palavra-passe"
          ref={confirmRef}
          autoComplete="new-password"
          textContentType="newPassword"
          returnKeyType="go"
          onSubmitEditing={() => handleSubmit(createAccount)()}
        />
        <Button
          title="Criar conta"
          fullWidth
          loading={isSubmitting}
          disabled={!isValid}
          onPress={handleSubmit(createAccount)}
        />
        <View className="flex-row items-center justify-center">
          <Text variant="caption">Já tens conta?</Text>
          <Button
            title="Entrar"
            variant="ghost"
            size="sm"
            className="px-2"
            onPress={() => router.replace('/login')}
          />
        </View>
      </View>
    </Screen>
  );
}
