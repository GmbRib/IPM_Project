import { View } from 'react-native';

import { Header, StepProgress } from '@/components/ui';
import { confirm } from '@/lib/dialogs';
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

  async function skip() {
    const ok = await confirm({
      title: 'Saltar a configuração?',
      message:
        'Sem estes dados a mala fica menos personalizada. Podes completar tudo mais tarde no Perfil.',
      confirmLabel: 'Saltar',
      cancelLabel: 'Continuar a configurar',
    });
    if (ok) updateUser({ onboarded: true });
  }

  return (
    <View className="gap-3 pb-2">
      <Header
        leading={step === 1 ? 'close' : 'back'}
        onLeadingPress={step === 1 ? skip : () => goBack()}
      />
      <StepProgress step={step} total={ONBOARDING_STEPS} />
      <Header title={title} subtitle={subtitle} />
    </View>
  );
}
