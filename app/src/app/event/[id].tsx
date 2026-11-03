import { useLocalSearchParams } from 'expo-router';
import { CalendarX } from 'lucide-react-native';

import { EventDetails } from '@/components/events/EventDetails';
import { EventForm } from '@/components/events/EventForm';
import { EmptyState, Header, Screen } from '@/components/ui';
import { can } from '@/domain/permissions';
import { useTripRole } from '@/hooks/useTripRole';
import { useData } from '@/stores/data';

export default function EditEventScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const event = useData((s) => s.events.find((e) => e.id === id));
  const role = useTripRole(event?.tripId);
  // Participants see the trip's agenda; the organisers change it.
  const readOnly = !!event?.tripId && !can(role, 'events.manage');

  let title = 'Editar evento';
  if (readOnly) title = 'Evento';
  else if (event?.kind === 'suggested' && event.status === 'pending') title = 'Sugestão';

  return (
    <Screen scroll>
      <Header leading="back" title={title} />
      {event && readOnly && <EventDetails event={event} />}
      {event && !readOnly && <EventForm key={event.id} event={event} />}
      {!event && <EmptyState icon={CalendarX} title="Este evento já não existe" />}
    </Screen>
  );
}
