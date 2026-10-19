import { addDays, format, parseISO } from 'date-fns';

import type { Activity, NewOf, Trip, TripEvent } from '@/data/types';

import { tripDays } from './packing';

// "Eventos sugeridos": a few ideas per trip from its activities. Known cities get
// real places; anywhere else gets a generic suggestion. Plan §7.

type Idea = { title: string; location: string; time: string };

const PLACES: Record<string, Partial<Record<Activity, Idea>>> = {
  milão: {
    dinner_out: { title: 'Jantar', location: 'Casa Cusi', time: '20:00' },
    museums_formal: { title: 'Visita ao Duomo', location: 'Duomo di Milano', time: '10:00' },
    nightlife: { title: 'Sair', location: 'Navigli', time: '22:00' },
  },
  genebra: {
    nightlife: { title: 'Sair', location: 'Petit Palace', time: '22:00' },
    hiking: { title: 'Caminhada no Salève', location: 'Mont Salève', time: '09:30' },
    museums_formal: { title: 'Museu', location: "Musée d'Art et d'Histoire", time: '10:30' },
  },
  londres: {
    museums_formal: { title: 'Museu', location: 'British Museum', time: '10:00' },
    dinner_out: { title: 'Jantar', location: 'Dishoom Covent Garden', time: '20:00' },
  },
  paris: {
    museums_formal: { title: 'Museu', location: "Musée d'Orsay", time: '10:00' },
    dinner_out: { title: 'Jantar', location: 'Le Bouillon Chartier', time: '20:00' },
  },
  sevilha: {
    dinner_out: { title: 'Tapas', location: 'El Rinconcillo', time: '21:00' },
    museums_formal: { title: 'Visita', location: 'Real Alcázar', time: '10:00' },
  },
  barcelona: {
    beach: { title: 'Praia', location: 'Barceloneta', time: '11:00' },
    museums_formal: { title: 'Visita', location: 'Sagrada Família', time: '10:00' },
  },
};

const GENERIC: Partial<Record<Activity, (city: string) => Idea>> = {
  dinner_out: (c) => ({ title: 'Jantar', location: `Restaurante típico em ${c}`, time: '20:00' }),
  museums_formal: (c) => ({ title: 'Visita a um museu', location: c, time: '10:30' }),
  hiking: (c) => ({ title: 'Caminhada', location: `Arredores de ${c}`, time: '09:30' }),
  beach: (c) => ({ title: 'Praia', location: c, time: '11:00' }),
  nightlife: (c) => ({ title: 'Sair à noite', location: c, time: '22:00' }),
  theme_park: (c) => ({ title: 'Parque temático', location: c, time: '10:00' }),
  sport: (c) => ({ title: 'Desporto', location: c, time: '18:00' }),
};

const MAX_SUGGESTIONS = 4;

export function suggestEvents(
  trip: Pick<Trip, 'id' | 'userId' | 'startDate' | 'endDate' | 'activities' | 'destination'>,
): NewOf<TripEvent>[] {
  const city = trip.destination.name;
  const known = PLACES[city.toLowerCase()] ?? {};
  const days = tripDays(trip);

  return trip.activities
    .map((a) => known[a] ?? GENERIC[a]?.(city))
    .filter((idea): idea is Idea => !!idea)
    .slice(0, MAX_SUGGESTIONS)
    .map((idea, i) => ({
      userId: trip.userId,
      tripId: trip.id,
      // Spread over the trip, starting on the first day.
      date: format(addDays(parseISO(trip.startDate), i % days), 'yyyy-MM-dd'),
      startTime: idea.time,
      title: idea.title,
      location: idea.location,
      kind: 'suggested' as const,
      status: 'pending' as const,
    }));
}
