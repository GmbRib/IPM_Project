import { useLocalSearchParams } from 'expo-router';
import { Luggage } from 'lucide-react-native';
import { useState } from 'react';
import { View } from 'react-native';

import { PlaneScene } from '@/components/animations/PlaneScene';
import { Button, Chip, EmptyState, Header, Screen, Stepper, TagInput, Text } from '@/components/ui';
import { rangeLabel } from '@/lib/calendar';
import { useData } from '@/stores/data';
import { useUi } from '@/stores/ui';
import { goBack } from '@/lib/navigation';

const COMMONLY_FORGOTTEN = [
  'Carregador do telemóvel',
  'Guarda-chuva',
  'Adaptador de tomada',
  'Medicação',
];

/** "Como correu?": what was forgotten and what wasn't used. Feeds the Histórico. */
export default function ReviewScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const trip = useData((s) => s.trips.find((t) => t.id === id));
  // Select the stable array and filter here: a selector returning a new array loops forever.
  const packing = useData((s) => s.packing);
  const existing = useData((s) => s.reviews.find((r) => r.tripId === id));
  const saveReview = useData((s) => s.saveReview);
  const showToast = useUi((s) => s.showToast);

  const [forgotten, setForgotten] = useState<string[]>(existing?.forgotten ?? []);
  const [unused, setUnused] = useState<Record<string, number>>(
    Object.fromEntries((existing?.unused ?? []).map((u) => [u.name, u.qty])),
  );
  const [saving, setSaving] = useState(false);
  const [landed, setLanded] = useState(false);

  if (!trip) {
    return (
      <Screen>
        <Header leading="back" />
        <EmptyState icon={Luggage} title="Esta viagem já não existe" />
      </Screen>
    );
  }

  const items = packing.filter((i) => i.tripId === trip.id);
  const packed = items.filter((i) => i.packed);
  const notPacked = items.filter((i) => !i.packed).map((i) => i.name);

  async function save() {
    setSaving(true);
    await saveReview({
      tripId: trip!.id,
      forgotten,
      unused: Object.entries(unused).map(([name, qty]) => ({ name, qty })),
    });
    setLanded(true);
  }

  // After saving: the plane lands, then back to where the user came from.
  if (landed) {
    return (
      <Screen className="justify-center">
        <PlaneScene
          mode="landing"
          onDone={() => {
            showToast({ message: 'Obrigado! Vamos lembrar-nos disto na próxima mala.' });
            goBack();
          }}
        >
          <Text variant="heading" className="text-center" accessibilityLiveRegion="polite">
            Bem-vindo(a) de volta!
          </Text>
          <Text variant="caption" className="text-center">
            Guardámos o que aprendeste em {trip.destination.name}.
          </Text>
        </PlaneScene>
      </Screen>
    );
  }

  return (
    <Screen scroll>
      <Header
        leading="back"
        title="Como correu?"
        subtitle={`${trip.destination.name} · ${rangeLabel(trip.startDate, trip.endDate)}`}
      />

      <View className="mt-2 gap-8">
        <View className="gap-2">
          <Text variant="heading">Esqueceste-te de alguma coisa?</Text>
          <Text variant="caption">Na próxima viagem parecida, vai estar na mala.</Text>
          <TagInput
            label="O que esqueceste"
            placeholder="Ex.: carregador"
            values={forgotten}
            onChange={setForgotten}
            suggestions={[...new Set([...notPacked, ...COMMONLY_FORGOTTEN])].slice(0, 8)}
          />
        </View>

        <View className="gap-2">
          <Text variant="heading">O que levaste e não usaste?</Text>
          <Text variant="caption">Para levares menos da próxima vez.</Text>
          {packed.length === 0 ? (
            <Text className="text-muted">Não marcaste nenhum item como arrumado nesta viagem.</Text>
          ) : (
            <View className="flex-row flex-wrap gap-2">
              {packed.map((i) => {
                const on = i.name in unused;
                return (
                  <Chip
                    key={i.id}
                    label={i.name}
                    selected={on}
                    onPress={() =>
                      setUnused((u) => {
                        const next = { ...u };
                        if (on) delete next[i.name];
                        else next[i.name] = 1;
                        return next;
                      })
                    }
                  />
                );
              })}
            </View>
          )}
          {packed
            .filter((i) => i.name in unused && i.quantity > 1)
            .map((i) => (
              <Stepper
                key={i.id}
                label={`${i.name}: quantos não usaste? (levaste ${i.quantity})`}
                value={unused[i.name]}
                min={1}
                max={i.quantity}
                onChange={(n) => setUnused((u) => ({ ...u, [i.name]: n }))}
              />
            ))}
        </View>

        <Button title="Guardar" fullWidth loading={saving} onPress={save} />
      </View>
    </Screen>
  );
}
