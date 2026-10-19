import { useState } from 'react';
import { View } from 'react-native';

import { ConfirmDialog, Header, StepProgress } from '@/components/ui';
import { useSession } from '@/stores/session';
import { goBack } from '@/lib/navigation';

export const ONBOARDING_STEPS = 2;

type Props = { step: number; title: string; subtitle?: string };

/**
 * Header shared by the onboarding steps: ✕ (skip the whole onboarding, after asking)
 * on step 1, ‹ back on later steps, plus the step bar.
 */
export function OnboardingHeader({ step, title, subtitle }: Props) {
  const updateUser = useSession((s) => s.updateUser);
  const [confirmSkip, setConfirmSkip] = useState(false);

  return (
    <View className="gap-3 pb-2">
      <Header
        leading={step === 1 ? 'close' : 'back'}
        onLeadingPress={step === 1 ? () => setConfirmSkip(true) : () => goBack()}
      />
      <StepProgress step={step} total={ONBOARDING_STEPS} />
      <Header title={title} subtitle={subtitle} />
      <ConfirmDialog
        open={confirmSkip}
        title="Saltar a configuração?"
        message="Sem estes dados a mala fica menos personalizada. Podes completar tudo mais tarde no Perfil."
        confirmLabel="Saltar"
        cancelLabel="Continuar a configurar"
        onConfirm={() => updateUser({ onboarded: true })}
        onCancel={() => setConfirmSkip(false)}
      />
    </View>
  );
}
