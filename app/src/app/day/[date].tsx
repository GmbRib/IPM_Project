import { isValid, parseISO } from 'date-fns';
import { router, useLocalSearchParams } from 'expo-router';
import { Plane } from 'lucide-react-native';
import { useEffect, useRef, type ComponentRef } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';

import { DayTimeline, HOUR_H } from '@/components/calendar/DayTimeline';
import { WeekStrip } from '@/components/calendar/WeekStrip';
import { Fab, Header, Screen, Text } from '@/components/ui';
import { todayISO } from '@/data/selectors';
import { useSuggestionActions } from '@/hooks/useSuggestionActions';
import type { TripEvent } from '@/data/types';
import { dayTitle, rangeLabel, toMinutes, tripsOn, visibleEventsOn } from '@/lib/calendar';
import colors from '@/theme/colors';
import { useData } from '@/stores/data';
import { useUi } from '@/stores/ui';

const DEFAULT_START_HOUR = 7;

export default function DayScreen() {
  const params = useLocalSearchParams<{ date: string }>();
  const today = todayISO();
  const date = params.date && isValid(parseISO(params.date)) ? params.date : today;

  const trips = useData((s) => s.trips);
  const allEvents = useData((s) => s.events);
  const selectTrip = useUi((s) => s.selectTrip);

  const events = visibleEventsOn(allEvents, date);
  const trip = tripsOn(trips, date)[0];
  const firstHour = events.length
    ? Math.floor(toMinutes(events[0].startTime) / 60)
    : DEFAULT_START_HOUR;
  const startHour = Math.min(DEFAULT_START_HOUR, firstHour);

  // Open scrolled to the first event (or 08:00 when the day is empty).
  const scroll = useRef<ComponentRef<typeof ScrollView>>(null);
  const timelineY = useRef(0);
  useEffect(() => {
    const target = events.length ? firstHour : 8;
    const id = setTimeout(
      () =>
        scroll.current?.scrollTo({
          y: timelineY.current + (target - startHour) * HOUR_H - 8,
          animated: false,
        }),
      0,
    );
    return () => clearTimeout(id);
    // Only when the day changes, not on every edit.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date]);

  const openNew = (time?: string) =>
    router.push({
      pathname: '/event/new',
      params: { date, ...(time ? { time } : {}), ...(trip ? { tripId: trip.id } : {}) },
    });
  const openEvent = (e: TripEvent) =>
    router.push({ pathname: '/event/[id]', params: { id: e.id } });

  const { accept, dismiss } = useSuggestionActions();

  return (
    <View className="flex-1">
      <Screen edges={['top']} className="px-0">
        <View className="px-5">
          <Header
            leading="back"
            title={dayTitle(date)}
            subtitle={date === today ? 'Hoje' : undefined}
          />
          {trip && (
            <Pressable
              onPress={() => {
                selectTrip(trip.id);
                router.navigate('/viagens');
              }}
              accessibilityRole="button"
              accessibilityLabel={`Viagem a ${trip.destination.name}, ${rangeLabel(trip.startDate, trip.endDate)}. Abre a viagem`}
              className="mb-2 flex-row items-center gap-2 self-start rounded-full bg-sun px-3 py-1.5 active:opacity-80"
            >
              <Plane size={16} color={colors.ink} />
              <Text variant="label" className="font-body-bold">
                {trip.destination.name} · {rangeLabel(trip.startDate, trip.endDate)}
              </Text>
            </Pressable>
          )}
          <WeekStrip
            selected={date}
            today={today}
            trips={trips}
            events={allEvents}
            onSelect={(d) => router.setParams({ date: d })}
          />
        </View>

        <ScrollView ref={scroll} className="mt-2 flex-1" contentContainerClassName="px-5 pb-28">
          <Text variant="caption" className="mb-3">
            {events.length === 0
              ? 'Sem eventos. Toca numa hora para criar um.'
              : 'Toca numa hora livre para criar um evento.'}
          </Text>
          <Animated.View
            key={date}
            entering={FadeIn.duration(250)}
            onLayout={(e) => (timelineY.current = e.nativeEvent.layout.y)}
          >
            <DayTimeline
              events={events}
              startHour={startHour}
              onSlotPress={openNew}
              onEventPress={openEvent}
              onAccept={accept}
              onDismiss={dismiss}
            />
          </Animated.View>
        </ScrollView>
      </Screen>
      <Fab accessibilityLabel="Novo evento neste dia" onPress={() => openNew()} />
    </View>
  );
}
