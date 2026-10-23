import { addMonths, isSameMonth, parseISO, startOfMonth } from 'date-fns';
import { router } from 'expo-router';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, View } from 'react-native';
import Animated, { FadeIn, SlideInLeft, SlideInRight } from 'react-native-reanimated';

import { MonthGrid } from '@/components/calendar/MonthGrid';
import { UpcomingList } from '@/components/calendar/UpcomingList';
import { Button, Fab, Header, IconButton, Screen, Text } from '@/components/ui';
import { todayISO } from '@/data/selectors';
import { monthTitle } from '@/lib/calendar';
import { useData } from '@/stores/data';
import { useSession } from '@/stores/session';
import { useUi } from '@/stores/ui';

export default function CalendarioScreen() {
  const name = useSession((s) => s.user?.name);
  const trips = useData((s) => s.trips);
  const events = useData((s) => s.events);
  const selectTrip = useUi((s) => s.selectTrip);
  const today = todayISO();
  const [month, setMonth] = useState(() => startOfMonth(new Date()));
  const [direction, setDirection] = useState(0);
  const moveMonth = (by: number) => {
    setDirection(by);
    setMonth((m) => addMonths(m, by));
  };
  const isCurrentMonth = isSameMonth(month, parseISO(today));

  return (
    <View className="flex-1">
      <Screen edges={['top']} scroll>
        <Header
          title={name ? `Olá, ${name}` : 'Olá!'}
          subtitle="Vamos ver a tua agenda!"
          trailing={
            <Pressable
              onPress={() => router.navigate('/perfil')}
              accessibilityRole="button"
              accessibilityLabel="Perfil"
              className="h-11 w-11 items-center justify-center rounded-full bg-sun active:opacity-80"
            >
              <Text variant="heading">{name?.charAt(0).toUpperCase() || '?'}</Text>
            </Pressable>
          }
        />

        <View className="mt-2 rounded-card border border-line bg-surface p-3">
          <View className="mb-2 flex-row items-center">
            <IconButton
              icon={ChevronLeft}
              accessibilityLabel="Mês anterior"
              onPress={() => moveMonth(-1)}
            />
            <Text variant="heading" className="flex-1 text-center" accessibilityLiveRegion="polite">
              {monthTitle(month)}
            </Text>
            <IconButton
              icon={ChevronRight}
              accessibilityLabel="Mês seguinte"
              onPress={() => moveMonth(1)}
            />
          </View>
          <Animated.View
            key={month.toISOString()}
            entering={(direction > 0
              ? SlideInRight
              : direction < 0
                ? SlideInLeft
                : FadeIn
            ).duration(250)}
          >
            <MonthGrid
              month={month}
              today={today}
              trips={trips}
              events={events}
              onDayPress={(day) => router.push({ pathname: '/day/[date]', params: { date: day } })}
              onTripPress={(trip) => {
                selectTrip(trip.id);
                router.navigate('/viagens');
              }}
            />
          </Animated.View>
        </View>

        <View className="mb-6 mt-3 flex-row items-center justify-between">
          <Text variant="caption">Toca num dia para ver a agenda.</Text>
          {!isCurrentMonth && (
            <Button
              title="Hoje"
              variant="ghost"
              size="sm"
              onPress={() => {
                setDirection(0);
                setMonth(startOfMonth(new Date()));
              }}
            />
          )}
        </View>
        <UpcomingList
          today={today}
          trips={trips}
          events={events}
          onDayPress={(day) => router.push({ pathname: '/day/[date]', params: { date: day } })}
          onTripPress={(trip) => {
            selectTrip(trip.id);
            router.navigate('/viagens');
          }}
        />
        {/* Room for the floating "+ Evento" button. */}
        <View className="h-20" />
      </Screen>
      <Fab
        label="Evento"
        accessibilityLabel="Novo evento"
        onPress={() => router.push({ pathname: '/event/new', params: { date: today } })}
      />
    </View>
  );
}
