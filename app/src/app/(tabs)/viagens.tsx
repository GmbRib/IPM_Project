import { router } from 'expo-router';
import {
  CalendarDays,
  ChevronDown,
  CircleCheck,
  MapPin,
  Plane,
  Plus,
  Sparkles,
  Trash2,
  TriangleAlert,
} from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, View } from 'react-native';
import Animated, { FadeOut, LinearTransition } from 'react-native-reanimated';

import { TripsSheet } from '@/components/trips/TripsSheet';
import { WeatherCard } from '@/components/trips/WeatherCard';
import {
  Button,
  Card,
  ConfirmDialog,
  EmptyState,
  FadeInView,
  IconButton,
  ProgressBar,
  Screen,
  Text,
} from '@/components/ui';
import { currentTrip, daysUntil, packingProgress, tripStatus } from '@/data/selectors';
import { DEFAULT_SETTINGS, type Trip } from '@/data/types';
import { documentIssues } from '@/domain/documents';
import { useSuggestionActions } from '@/hooks/useSuggestionActions';
import { dayTitle, rangeLabel } from '@/lib/calendar';
import { paxLabel, PURPOSES } from '@/lib/labels';
import { useData } from '@/stores/data';
import { useSession } from '@/stores/session';
import { useUi } from '@/stores/ui';
import colors from '@/theme/colors';

export default function ViagensScreen() {
  const user = useSession((s) => s.user);
  const { trips, packing, events, documents, reviews, removeTrip } = useData();
  const selectedId = useUi((s) => s.selectedTripId);
  const selectTrip = useUi((s) => s.selectTrip);
  const showToast = useUi((s) => s.showToast);
  const { accept, dismiss } = useSuggestionActions();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  // A trip picked elsewhere (calendar bar, trips sheet), otherwise the current/next one.
  const trip = trips.find((t) => t.id === selectedId) ?? currentTrip(trips);

  if (!trip) {
    return (
      <Screen edges={['top']}>
        <View className="flex-1 justify-center">
          <EmptyState
            icon={Plane}
            title="Ainda não tens viagens"
            message="Diz-nos para onde vais e preparamos a mala por ti."
            actionLabel="Criar viagem"
            onAction={() => router.push('/trip/new')}
          />
          {trips.length > 0 && (
            <Button
              title="Ver histórico"
              variant="ghost"
              onPress={() => router.push('/historico')}
            />
          )}
        </View>
      </Screen>
    );
  }

  const unit = user?.settings?.tempUnit ?? DEFAULT_SETTINGS.tempUnit;
  const status = tripStatus(trip);
  const progress = packingProgress(packing, trip.id);
  const tripEvents = events.filter((e) => e.tripId === trip.id);
  const suggestions = tripEvents
    .filter((e) => e.status === 'pending')
    .sort((a, b) => (a.date + a.startTime).localeCompare(b.date + b.startTime));
  const agenda = tripEvents
    .filter((e) => e.status === 'accepted')
    .sort((a, b) => (a.date + a.startTime).localeCompare(b.date + b.startTime));
  const issues = documentIssues(documents, trip);
  const reviewed = reviews.some((r) => r.tripId === trip.id);

  async function deleteTrip(t: Trip) {
    setConfirmDelete(false);
    selectTrip(null);
    await removeTrip(t.id);
    showToast({ message: `Viagem a ${t.destination.name} eliminada` });
  }

  return (
    <Screen edges={['top']} scroll>
      <View className="flex-row items-start gap-2 py-2">
        <Pressable
          onPress={() => setSheetOpen(true)}
          accessibilityRole="button"
          accessibilityLabel={`A tua viagem: ${trip.destination.name}. Mudar de viagem`}
          className="flex-1 active:opacity-70"
        >
          <Text variant="caption">A tua viagem</Text>
          <View className="flex-row items-center gap-1">
            <Text variant="title" numberOfLines={1} className="shrink">
              {trip.destination.name}
            </Text>
            <ChevronDown size={26} color={colors.ink} />
          </View>
        </Pressable>
        <IconButton
          icon={Plus}
          variant="filled"
          accessibilityLabel="Nova viagem"
          onPress={() => router.push('/trip/new')}
          className="mt-3"
        />
      </View>

      <View className="mb-4 flex-row flex-wrap items-center gap-2">
        <Text variant="caption">
          {rangeLabel(trip.startDate, trip.endDate)} · {paxLabel(trip.adults, trip.children)} ·{' '}
          {PURPOSES[trip.purpose]}
        </Text>
        <Countdown trip={trip} />
      </View>

      <View className="gap-3">
        {status === 'past' && !reviewed && (
          <FadeInView index={0}>
            <Card
              title="Como correu a viagem?"
              onPress={() =>
                router.push({ pathname: '/trip/[id]/review', params: { id: trip.id } })
              }
            >
              <Text className="text-muted">
                Diz-nos o que esqueceste e o que levaste a mais. Usamos isso nas próximas malas.
              </Text>
            </Card>
          </FadeInView>
        )}

        <FadeInView index={1}>
          <WeatherCard trip={trip} unit={unit} />
        </FadeInView>

        <FadeInView index={2}>
          <Card
            title="A tua mala"
            onPress={() => router.push({ pathname: '/trip/[id]/mala', params: { id: trip.id } })}
            accessibilityLabel={`A tua mala: ${progress.packed} de ${progress.total} itens arrumados. Abrir mala`}
          >
            <Text className="mb-2">
              {progress.packed}/{progress.total} itens arrumados
            </Text>
            <ProgressBar value={progress.ratio} />
          </Card>
        </FadeInView>

        {suggestions.length > 0 && (
          <FadeInView index={3}>
            <Card title="Eventos sugeridos">
              <View className="gap-3">
                {suggestions.map((s) => (
                  <Animated.View
                    key={s.id}
                    exiting={FadeOut.duration(200)}
                    layout={LinearTransition.duration(250)}
                    style={{
                      gap: 8,
                      borderRadius: 16,
                      borderWidth: 2,
                      borderStyle: 'dashed',
                      borderColor: colors.gold,
                      padding: 12,
                    }}
                  >
                    <Pressable
                      onPress={() =>
                        router.push({ pathname: '/day/[date]', params: { date: s.date } })
                      }
                      accessibilityRole="button"
                      accessibilityLabel={`${s.title}, ${dayTitle(s.date)}, ${s.startTime}${s.location ? `, ${s.location}` : ''}. Ver no dia`}
                      className="gap-0.5 active:opacity-70"
                    >
                      <View className="flex-row items-center gap-1.5">
                        <Sparkles size={14} color={colors['ember-text']} />
                        <Text variant="caption" className="font-body-bold text-ember-text">
                          {dayTitle(s.date)} · {s.startTime}
                        </Text>
                      </View>
                      <Text variant="label" className="font-body-bold">
                        {s.title}
                        {s.location ? ` · ${s.location}` : ''}
                      </Text>
                    </Pressable>
                    <View className="flex-row gap-2">
                      <Button
                        title="Aceitar"
                        size="sm"
                        onPress={() => accept(s)}
                        className="flex-1"
                      />
                      <Button
                        title="Ignorar"
                        size="sm"
                        variant="secondary"
                        onPress={() => dismiss(s)}
                        className="flex-1"
                      />
                    </View>
                  </Animated.View>
                ))}
              </View>
            </Card>
          </FadeInView>
        )}

        <FadeInView index={4}>
          <Card title="Agenda da viagem">
            {agenda.length === 0 ? (
              <View className="gap-2">
                <Text className="text-muted">Ainda não tens nada marcado.</Text>
                <Button
                  title="Abrir o primeiro dia"
                  variant="secondary"
                  size="sm"
                  icon={CalendarDays}
                  className="self-start"
                  onPress={() =>
                    router.push({ pathname: '/day/[date]', params: { date: trip.startDate } })
                  }
                />
              </View>
            ) : (
              <View className="gap-1">
                {agenda.slice(0, 4).map((e) => (
                  <Pressable
                    key={e.id}
                    onPress={() =>
                      router.push({ pathname: '/day/[date]', params: { date: e.date } })
                    }
                    accessibilityRole="button"
                    accessibilityLabel={`${e.title}, ${dayTitle(e.date)}, ${e.startTime}. Ver no dia`}
                    className="min-h-11 flex-row items-center gap-3 rounded-xl px-1 active:bg-sun-soft"
                  >
                    <View className="w-14">
                      <Text variant="caption" className="font-body-bold">
                        {rangeLabel(e.date, e.date)}
                      </Text>
                      <Text variant="caption">{e.startTime}</Text>
                    </View>
                    <View className="flex-1">
                      <Text variant="label" numberOfLines={1}>
                        {e.title}
                      </Text>
                      {!!e.location && (
                        <View className="flex-row items-center gap-1">
                          <MapPin size={12} color={colors.muted} />
                          <Text variant="caption" numberOfLines={1}>
                            {e.location}
                          </Text>
                        </View>
                      )}
                    </View>
                  </Pressable>
                ))}
                {agenda.length > 4 && <Text variant="caption">+ {agenda.length - 4} eventos</Text>}
              </View>
            )}
          </Card>
        </FadeInView>

        {status !== 'past' && (
          <FadeInView index={5}>
            <Card
              title="Documentos"
              onPress={() => router.push('/perfil/documentos')}
              accessibilityLabel={
                issues.length
                  ? `Documentos: ${issues.length} ${issues.length === 1 ? 'precisa' : 'precisam'} de atenção. Abrir documentos`
                  : 'Documentos: tudo em ordem. Abrir documentos'
              }
            >
              {issues.length === 0 ? (
                <View className="flex-row items-center gap-2">
                  <CircleCheck size={18} color={colors.success} />
                  <Text>Tudo em ordem para esta viagem.</Text>
                </View>
              ) : (
                <View className="gap-1.5">
                  <Text variant="label" className="font-body-bold text-ember-text">
                    {issues.length === 1
                      ? '1 doc precisa de atenção'
                      : `${issues.length} docs precisam de atenção`}
                  </Text>
                  {issues.map((i) => (
                    <View key={i.message} className="flex-row gap-2">
                      <TriangleAlert
                        size={16}
                        color={colors['ember-text']}
                        style={{ marginTop: 3 }}
                      />
                      <Text className="flex-1 text-[15px] leading-5">{i.message}</Text>
                    </View>
                  ))}
                </View>
              )}
            </Card>
          </FadeInView>
        )}

        <Button
          title="Eliminar viagem"
          variant="ghost"
          icon={Trash2}
          onPress={() => setConfirmDelete(true)}
          className="mt-2"
        />
      </View>

      <TripsSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        trips={trips}
        packing={packing}
        selectedId={trip.id}
        onSelect={selectTrip}
      />
      <ConfirmDialog
        open={confirmDelete}
        title={`Eliminar a viagem a ${trip.destination.name}?`}
        message="A mala, os eventos e o histórico desta viagem também são apagados."
        confirmLabel="Eliminar"
        cancelLabel="Cancelar"
        destructive
        onConfirm={() => deleteTrip(trip)}
        onCancel={() => setConfirmDelete(false)}
      />
    </Screen>
  );
}

function Countdown({ trip }: { trip: Trip }) {
  const status = tripStatus(trip);
  const until = daysUntil(trip.startDate);
  const label =
    status === 'past'
      ? 'Terminou'
      : status === 'ongoing'
        ? `Dia ${-until + 1} de ${daysUntil(trip.endDate, trip.startDate) + 1}`
        : until === 0
          ? 'É hoje!'
          : until === 1
            ? 'Falta 1 dia'
            : `Faltam ${until} dias`;
  return (
    <View className="rounded-full bg-sun px-2.5 py-0.5">
      <Text variant="caption" className="font-body-bold text-ink">
        {label}
      </Text>
    </View>
  );
}
