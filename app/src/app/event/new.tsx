import { useLocalSearchParams } from 'expo-router';

import { EventForm } from '@/components/events/EventForm';
import { Header, Screen } from '@/components/ui';

/** /event/new?date=2026-10-20&time=14:00&tripId=… (all optional). */
export default function NewEventScreen() {
  const { date, time, tripId } = useLocalSearchParams<{
    date?: string;
    time?: string;
    tripId?: string;
  }>();

  return (
    <Screen scroll>
      <Header leading="close" title="Novo evento" />
      <EventForm initial={{ date, time, tripId }} />
    </Screen>
  );
}
