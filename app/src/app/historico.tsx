import { router } from 'expo-router';
import { ChevronRight, History, Lightbulb, RotateCcw } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, View } from 'react-native';

import {
  BottomSheet,
  Button,
  Card,
  EmptyState,
  FadeInView,
  Header,
  Screen,
  Text,
} from '@/components/ui';
import { pastTrips } from '@/data/selectors';
import type { Trip, TripReview } from '@/data/types';
import { rangeLabel } from '@/lib/calendar';
import { paxLabel, PURPOSES } from '@/lib/labels';
import { useData } from '@/stores/data';
import colors from '@/theme/colors';

/** Lessons from past trips, and the trips themselves. */
export default function HistoricoScreen() {
  const trips = useData((s) => s.trips);
  const reviews = useData((s) => s.reviews);
  const packing = useData((s) => s.packing);
  // Kept while the sheet fades out, so its content doesn't vanish mid-animation.
  const [selected, setSelected] = useState<Trip | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  const past = pastTrips(trips);
  const reviewOf = (t: Trip) => reviews.find((r) => r.tripId === t.id);
  const insights = buildInsights(past, reviewOf);

  return (
    <Screen scroll>
      <Header leading="back" title="Histórico" />

      {past.length === 0 ? (
        <EmptyState
          icon={History}
          title="Ainda não tens viagens passadas"
          message="Depois de cada viagem, diz-nos como correu. Aprendemos contigo para as próximas malas."
        />
      ) : (
        <View className="gap-4">
          {insights.length > 0 && (
            <Card>
              <View className="mb-2 flex-row items-center gap-2">
                <Lightbulb size={20} color={colors.ember} />
                <Text variant="heading" className="text-lg">
                  Com base nas tuas viagens anteriores
                </Text>
              </View>
              <View className="gap-1.5">
                {insights.map((line) => (
                  <View key={line} className="flex-row gap-2">
                    <Text>•</Text>
                    <Text className="flex-1">{line}</Text>
                  </View>
                ))}
              </View>
            </Card>
          )}

          <Text variant="heading">Viagens anteriores</Text>
          {past.map((t, i) => {
            const r = reviewOf(t);
            const count = packing.filter((i) => i.tripId === t.id).length;
            const summary = r
              ? `${count} itens · ${r.forgotten.length} ${r.forgotten.length === 1 ? 'esquecido' : 'esquecidos'}`
              : `${count} itens · por rever`;
            return (
              <FadeInView key={t.id} index={i + 1}>
                <Pressable
                  onPress={() => {
                    setSelected(t);
                    setSheetOpen(true);
                  }}
                  accessibilityRole="button"
                  accessibilityLabel={`${t.destination.name}, ${rangeLabel(t.startDate, t.endDate)}, ${PURPOSES[t.purpose]}, ${summary}`}
                  className="flex-row items-center gap-3 rounded-card border border-line bg-surface p-4 active:opacity-80"
                >
                  <View className="flex-1 gap-0.5">
                    <Text variant="heading" className="text-lg">
                      {t.destination.name}
                    </Text>
                    <Text variant="caption">
                      {rangeLabel(t.startDate, t.endDate)} · {PURPOSES[t.purpose]} ·{' '}
                      {paxLabel(t.adults, t.children)}
                    </Text>
                    <Text
                      variant="caption"
                      className={r ? undefined : 'font-body-bold text-ember-text'}
                    >
                      {summary}
                    </Text>
                  </View>
                  <ChevronRight size={20} color={colors.muted} />
                </Pressable>
              </FadeInView>
            );
          })}
        </View>
      )}

      <BottomSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        title={
          selected
            ? `${selected.destination.name} · ${rangeLabel(selected.startDate, selected.endDate)}`
            : undefined
        }
      >
        {selected && (
          <TripDetail
            trip={selected}
            review={reviewOf(selected)}
            onClose={() => setSheetOpen(false)}
          />
        )}
      </BottomSheet>
    </Screen>
  );
}

function TripDetail({
  trip,
  review,
  onClose,
}: {
  trip: Trip;
  review?: TripReview;
  onClose: () => void;
}) {
  const go = (fn: () => void) => {
    onClose();
    fn();
  };
  return (
    <View className="gap-4">
      <Text variant="caption">
        {PURPOSES[trip.purpose]} · {paxLabel(trip.adults, trip.children)}
      </Text>
      {review ? (
        <>
          <View className="gap-1 rounded-2xl border border-line bg-surface p-3">
            <Text variant="label" className="font-body-bold">
              Esqueceste:
            </Text>
            {review.forgotten.length ? (
              review.forgotten.map((f) => <Text key={f}>• {f}</Text>)
            ) : (
              <Text className="text-muted">Nada. Boa!</Text>
            )}
          </View>
          {review.unused.length > 0 && (
            <View className="gap-1 rounded-2xl border border-line bg-surface p-3">
              <Text variant="label" className="font-body-bold">
                Levaste a mais:
              </Text>
              {review.unused.map((u) => (
                <Text key={u.name}>
                  • {u.name} {u.qty > 1 ? `(×${u.qty})` : ''}
                </Text>
              ))}
            </View>
          )}
        </>
      ) : (
        <Text className="text-muted">Ainda não disseste como correu esta viagem.</Text>
      )}
      <Button
        title="Usar como base para a próxima viagem"
        fullWidth
        onPress={() =>
          go(() => router.push({ pathname: '/trip/new', params: { baseTripId: trip.id } }))
        }
      />
      <Button
        title={review ? 'Editar o que correu' : 'Dizer como correu'}
        variant="secondary"
        icon={RotateCcw}
        fullWidth
        onPress={() =>
          go(() => router.push({ pathname: '/trip/[id]/review', params: { id: trip.id } }))
        }
      />
      <Button title="Fechar" variant="ghost" onPress={onClose} />
    </View>
  );
}

/** Plain-language lessons: things forgotten more than once first, then over-packing. */
function buildInsights(past: Trip[], reviewOf: (t: Trip) => TripReview | undefined) {
  const forgottenIn = new Map<string, string[]>();
  const lines: string[] = [];
  for (const t of past) {
    const r = reviewOf(t);
    if (!r) continue;
    for (const f of r.forgotten)
      forgottenIn.set(f, [...(forgottenIn.get(f) ?? []), t.destination.name]);
  }
  // "X: item" reads right in Portuguese for any item (no article to guess).
  for (const [item, places] of [...forgottenIn].sort((a, b) => b[1].length - a[1].length)) {
    lines.push(
      places.length > 1
        ? `Esqueceste ${places.length} vezes: ${lower(item)}.`
        : `Em ${places[0]} esqueceste: ${lower(item)}.`,
    );
  }
  for (const t of past) {
    for (const u of reviewOf(t)?.unused ?? []) {
      lines.push(
        `Em ${t.destination.name} levaste a mais: ${lower(u.name)}${u.qty > 1 ? ` (${u.qty})` : ''}.`,
      );
    }
  }
  return lines.slice(0, 5);
}

const lower = (s: string) => s.charAt(0).toLowerCase() + s.slice(1);
