import { router } from 'expo-router';

import { OnboardingHeader } from '@/components/onboarding/OnboardingHeader';
import { ProfileForm } from '@/components/profile/ProfileForm';
import { Screen } from '@/components/ui';

export default function OnboardingStep1() {
  return (
    <Screen scroll>
      <OnboardingHeader step={1} title="Sobre ti" subtitle="Ajuda-nos a preparar a mala certa." />
      <ProfileForm submitLabel="Continuar" onSaved={() => router.push('/step-2')} />
    </Screen>
  );
}
