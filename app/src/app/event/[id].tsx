import { useLocalSearchParams } from 'expo-router';
import { CalendarX } from 'lucide-react-native';

import { EventForm } from '@/components/events/EventForm';
import { EmptyState, Header, Screen } from '@/components/ui';
import { useData } from '@/stores/data';

export default function EditEventScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const event = useData((s) => s.events.find((e) => e.id === id));

  return (
    <Screen scroll>
      <Header
        leading="back"
        title={
          event?.kind === 'suggested' && event.status === 'pending' ? 'Sugestão' : 'Editar evento'
        }
      />
      {event ? (
        <EventForm key={event.id} event={event} />
      ) : (
        <EmptyState icon={CalendarX} title="Este evento já não existe" />
      )}
    </Screen>
  );
}
