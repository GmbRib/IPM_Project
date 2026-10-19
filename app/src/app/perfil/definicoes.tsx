import { View } from 'react-native';

import { Card, Header, Screen, SegmentedControl, Text, Toggle } from '@/components/ui';
import { DEFAULT_SETTINGS } from '@/data/types';
import { useSession } from '@/stores/session';

export default function DefinicoesScreen() {
  const settings = useSession((s) => s.user?.settings) ?? DEFAULT_SETTINGS;
  const updateUser = useSession((s) => s.updateUser);
  const set = (patch: Partial<typeof settings>) =>
    updateUser({ settings: { ...settings, ...patch } });

  return (
    <Screen scroll>
      <Header leading="back" title="Definições" />
      <View className="gap-4">
        <Card>
          <SegmentedControl
            label="Temperatura"
            value={settings.tempUnit}
            onChange={(tempUnit) => set({ tempUnit })}
            options={[
              { value: 'C', label: 'Celsius (°C)' },
              { value: 'F', label: 'Fahrenheit (°F)' },
            ]}
          />
        </Card>
        <Card>
          <Toggle
            label="Lembrete para fazer a mala"
            description="Dois dias antes de cada viagem."
            value={settings.packingReminder}
            onValueChange={(packingReminder) => set({ packingReminder })}
          />
        </Card>
        <Card title="Sobre o Pack&Sun">
          <Text className="text-muted">
            A mala certa para cada viagem. Projeto de Interação Pessoa-Máquina, NOVA FCT, Grupo 03
            (2026/27). A previsão do tempo é do Open-Meteo.
          </Text>
        </Card>
      </View>
    </Screen>
  );
}
