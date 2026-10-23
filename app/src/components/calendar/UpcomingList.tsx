import { CalendarDays, ChevronRight, Plane, type LucideIcon } from 'lucide-react-native';
import { Pressable, View } from 'react-native';

import { Card, Text } from '@/components/ui';
import { tripStatus } from '@/data/selectors';
import type { ISODate, Trip, TripEvent } from '@/data/types';
import { dayTitle, rangeLabel } from '@/lib/calendar';
import colors from '@/theme/colors';

type Item = {
  key: string;
  sort: string;
  icon: LucideIcon;
  title: string;
  subtitle: string;
  onPress: () => void;
};

type Props = {
  today: ISODate;
  trips: Trip[];
  events: TripEvent[];
  onTripPress: (trip: Trip) => void;
  onDayPress: (day: ISODate) => void;
};

const MAX = 4;

/** "Próximos": the next few events and trips, under the month grid. */
export function UpcomingList({ today, trips, events, onTripPress, onDayPress }: Props) {
  const items: Item[] = [
    ...events
      .filter((e) => e.status === 'accepted' && e.date >= today)
      .map((e) => ({
        key: e.id,
        sort: `${e.date} ${e.startTime}`,
        icon: CalendarDays,
        title: e.title,
        subtitle: `${dayTitle(e.date)} · ${e.startTime}${e.location ? ` · ${e.location}` : ''}`,
        onPress: () => onDayPress(e.date),
      })),
    ...trips
      .filter((t) => tripStatus(t, today) !== 'past')
      .map((t) => ({
        key: t.id,
        sort: `${t.startDate} 00:00`,
        icon: Plane,
        title: `Viagem a ${t.destination.name}`,
        subtitle: rangeLabel(t.startDate, t.endDate),
        onPress: () => onTripPress(t),
      })),
  ]
    .sort((a, b) => a.sort.localeCompare(b.sort))
    .slice(0, MAX);

  return (
    <Card title="Próximos">
      {items.length === 0 ? (
        <Text className="text-muted">Nada marcado nos próximos dias.</Text>
      ) : (
        <View className="-mx-2">
          {items.map((item, i) => (
            <Pressable
              key={item.key}
              onPress={item.onPress}
              accessibilityRole="button"
              accessibilityLabel={`${item.title}, ${item.subtitle}`}
              className={`min-h-14 flex-row items-center gap-3 rounded-2xl px-2 py-2 active:bg-sun-soft ${i ? 'mt-1' : ''}`}
            >
              <View className="h-10 w-10 items-center justify-center rounded-full bg-sun-soft">
                <item.icon size={20} color={colors.ember} />
              </View>
              <View className="flex-1">
                <Text variant="label" numberOfLines={1}>
                  {item.title}
                </Text>
                <Text variant="caption" numberOfLines={1}>
                  {item.subtitle}
                </Text>
              </View>
              <ChevronRight size={18} color={colors.muted} />
            </Pressable>
          ))}
        </View>
      )}
    </Card>
  );
}
