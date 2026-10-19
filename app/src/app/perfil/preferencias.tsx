import { ProfileForm } from '@/components/profile/ProfileForm';
import { Header, Screen } from '@/components/ui';
import { useUi } from '@/stores/ui';
import { goBack } from '@/lib/navigation';

export default function PreferenciasScreen() {
  const showToast = useUi((s) => s.showToast);
  return (
    <Screen scroll>
      <Header
        leading="back"
        title="Preferências"
        subtitle="Usadas nas próximas malas que criares."
      />
      <ProfileForm
        submitLabel="Guardar"
        onSaved={() => {
          showToast({ message: 'Preferências guardadas' });
          goBack();
        }}
      />
    </Screen>
  );
}
