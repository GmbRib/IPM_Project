import { router } from 'expo-router';
import { useRef, useState, type ComponentRef } from 'react';
import { useForm } from 'react-hook-form';
import { TextInput, View } from 'react-native';

import { FormPasswordField, FormTextField } from '@/components/form/FormFields';
import { Banner, Button, Header, Screen, Text } from '@/components/ui';
import { confirm } from '@/lib/dialogs';
import { AuthError } from '@/data/repositories';
import { DEMO_EMAIL, DEMO_PASSWORD } from '@/data/seed';
import { zodResolver } from '@/lib/zodResolver';
import { loginSchema, type LoginValues } from '@/lib/validation';
import { useSession } from '@/stores/session';

export default function LoginScreen() {
  const login = useSession((s) => s.login);
  const [serverError, setServerError] = useState<string>();
  const passwordRef = useRef<ComponentRef<typeof TextInput>>(null);

  const {
    control,
    handleSubmit,
    formState: { isValid, isSubmitting },
  } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    mode: 'onTouched',
    defaultValues: { email: '', password: '' },
  });

  async function signIn({ email, password }: LoginValues) {
    setServerError(undefined);
    try {
      await login(email, password);
    } catch (err) {
      setServerError(
        err instanceof AuthError ? err.message : 'Não foi possível entrar. Tenta outra vez.',
      );
    }
  }

  return (
    <Screen scroll>
      <Header leading="back" title="Entrar" subtitle="Bem-vindo(a) de volta!" />
      <View className="mt-4 gap-4">
        {!!serverError && <Banner tone="danger" message={serverError} />}
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
        <View className="gap-1">
          <FormPasswordField
            control={control}
            name="password"
            label="Palavra-passe"
            ref={passwordRef}
            autoComplete="current-password"
            textContentType="password"
            returnKeyType="go"
            onSubmitEditing={() => handleSubmit(signIn)()}
          />
          <Button
            title="Esqueci-me da palavra-passe"
            variant="ghost"
            size="sm"
            className="self-end px-0"
            onPress={() =>
              confirm({
                title: 'Recuperar palavra-passe',
                message:
                  'Na versão final enviamos-te um email com um link para criares uma nova palavra-passe. Neste protótipo ainda não está disponível.',
                confirmLabel: 'Percebi',
              })
            }
          />
        </View>
        <Button
          title="Entrar"
          fullWidth
          loading={isSubmitting}
          disabled={!isValid}
          onPress={handleSubmit(signIn)}
        />
        <View className="flex-row items-center justify-center">
          <Text variant="caption">Ainda não tens conta?</Text>
          <Button
            title="Criar conta"
            variant="ghost"
            size="sm"
            className="px-2"
            onPress={() => router.replace('/register')}
          />
        </View>
        {__DEV__ && (
          <Button
            title="Entrar com a conta demo (Ana)"
            variant="secondary"
            size="sm"
            onPress={() => signIn({ email: DEMO_EMAIL, password: DEMO_PASSWORD })}
          />
        )}
      </View>
    </Screen>
  );
}
