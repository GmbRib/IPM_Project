import { CalendarDays, Clock, MapPin, Plane, type LucideIcon } from 'lucide-react-native';
import { View } from 'react-native';

import { Banner, Card, Text } from '@/components/ui';
import type { TripEvent } from '@/data/types';
import { dayTitle } from '@/lib/calendar';
import { useData } from '@/stores/data';
import colors from '@/theme/colors';

/** A trip event seen by a participant: the organisers manage the trip's agenda. */
export function EventDetails({ event }: { event: TripEvent }) {
  const trip = useData((s) => s.trips.find((t) => t.id === event.tripId));
  const rows: { icon: LucideIcon; label: string }[] = [
    { icon: CalendarDays, label: dayTitle(event.date) },
    { icon: Clock, label: event.endTime ? `${event.startTime}–${event.endTime}` : event.startTime },
    ...(event.location ? [{ icon: MapPin, label: event.location }] : []),
    ...(trip ? [{ icon: Plane, label: `Viagem a ${trip.destination.name}` }] : []),
  ];

  return (
    <View className="gap-5">
      <Text variant="title">{event.title}</Text>
      <Card>
        <View className="gap-3">
          {rows.map((r) => (
            <View key={r.label} className="flex-row items-center gap-3">
              <r.icon size={20} color={colors.ember} />
              <Text className="flex-1">{r.label}</Text>
            </View>
          ))}
        </View>
      </Card>
      {!!event.notes && <Text>{event.notes}</Text>}
      <Banner tone="info" message="Só os organizadores da viagem podem alterar os eventos." />
    </View>
  );
}
