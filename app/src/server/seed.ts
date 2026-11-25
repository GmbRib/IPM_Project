import { addDays, format } from 'date-fns';

import { DEMO_ACCOUNTS, DEMO_PASSWORD } from '@/data/demo';
import type { PackingItem, TravelDocument, Trip, TripEvent, TripMember } from '@/data/types';
import { generatePackingList } from '@/domain/packing';
import { suggestEvents } from '@/domain/suggestions';

import type { Db, StoredUser } from './db';
import { hashPassword } from './passwords';

// Demo data written the first time the server runs (or on "Repor dados de demonstração").
//
// Only the usability-test scenarios (stage 4 report): Oslo, Madrid and Paris, on their fixed
// dates and already created, organised by Teresa. The tester starts from the trip, not the
// wizard. Their bags and suggested events come from the same rules as a trip created in the
// app. Rui and Pedro have accounts but no trips: Teresa can invite them.

const [TERESA, RUI, PEDRO] = DEMO_ACCOUNTS.map((a) => a.id);

export function buildSeed(today: Date): Db {
  const day = (offset: number) => format(addDays(today, offset), 'yyyy-MM-dd');
  const createdAt = today.toISOString();

  const conditions = { wheelchair: false, allergies: [] as string[], medication: [] as string[] };
  const users: StoredUser[] = DEMO_ACCOUNTS.map((a) => ({
    id: a.id,
    email: a.email,
    name: a.name,
    conditions: a.id === TERESA ? { ...conditions, allergies: ['Pólen'] } : conditions,
    onboarded: true,
    createdAt,
    ...hashPassword(DEMO_PASSWORD),
  }));

  const documents: TravelDocument[] = [
    {
      id: 'demo-doc-cc',
      userId: TERESA,
      type: 'cc',
      name: 'Cartão de Cidadão',
      number: '12345678 9 ZZ1',
      // Valid for every scenario trip (scenario 2: "o teu Cartão de Cidadão é válido").
      expiresAt: '2031-06-30',
    },
    {
      // Expires a week before Paris: the trip flags it (scenario 3: "resolve o que a
      // aplicação assinalar").
      id: 'demo-doc-passport',
      userId: TERESA,
      type: 'passport',
      name: 'Passaporte',
      number: 'CB123456',
      expiresAt: '2027-03-15',
    },
    {
      id: 'demo-doc-driving',
      userId: TERESA,
      type: 'driving',
      name: 'Carta de Condução',
      number: 'L-1234567 8',
      expiresAt: day(2000),
    },
    {
      id: 'demo-doc-cc-rui',
      userId: RUI,
      type: 'cc',
      name: 'Cartão de Cidadão',
      number: '23456789 0 ZZ2',
      expiresAt: day(900),
    },
    {
      id: 'demo-doc-cc-pedro',
      userId: PEDRO,
      type: 'cc',
      name: 'Cartão de Cidadão',
      number: '34567890 1 ZZ3',
      expiresAt: day(1500),
    },
  ];

  const trip = (t: Omit<Trip, 'createdBy' | 'createdAt'>): Trip => ({
    ...t,
    createdBy: TERESA,
    createdAt,
  });

  const trips: Trip[] = [
    // Cenário 1: trabalho, 2 dias de conferências e 1 livre.
    trip({
      id: 'demo-trip-oslo',
      destination: {
        name: 'Oslo',
        country: 'Noruega',
        countryCode: 'NO',
        lat: 59.9139,
        lon: 10.7522,
      },
      startDate: '2026-12-14',
      endDate: '2026-12-16',
      adults: 1,
      children: 0,
      purpose: 'work',
      activities: ['meeting', 'dinner_out', 'nightlife', 'museums_formal'],
    }),
    // Cenário 2: fim de semana de lazer, sozinha.
    trip({
      id: 'demo-trip-madrid',
      destination: {
        name: 'Madrid',
        country: 'Espanha',
        countryCode: 'ES',
        lat: 40.4168,
        lon: -3.7038,
      },
      startDate: '2027-05-07',
      endDate: '2027-05-09',
      adults: 1,
      children: 0,
      purpose: 'leisure',
      activities: ['dinner_out', 'museums_formal'],
    }),
    // Cenário 3: família (2 adultos, 2 crianças), Disneyland e Paris.
    trip({
      id: 'demo-trip-paris',
      destination: {
        name: 'Paris',
        country: 'França',
        countryCode: 'FR',
        lat: 48.8566,
        lon: 2.3522,
      },
      startDate: '2027-03-22',
      endDate: '2027-03-26',
      adults: 2,
      children: 2,
      purpose: 'leisure',
      activities: ['theme_park', 'museums_formal', 'dinner_out'],
    }),
  ];

  const members: TripMember[] = trips.map((t) => ({
    id: `${t.id}-${TERESA}`,
    tripId: t.id,
    userId: TERESA,
    role: 'owner',
    joinedAt: createdAt,
  }));

  // Teresa's bag as the app would generate it (no forecast yet), nothing packed.
  const teresa = users.find((u) => u.id === TERESA)!;
  const packing: PackingItem[] = trips.flatMap((t) =>
    generatePackingList(
      { trip: t, conditions: teresa.conditions },
      { tripId: t.id, memberId: TERESA },
    ).map((item, i): PackingItem => ({ ...item, id: `${t.id}-${TERESA}-item-${i}` })),
  );

  const events: TripEvent[] = [
    // The scenario trips' suggestions, waiting to be accepted or ignored.
    ...trips.flatMap((t) =>
      suggestEvents(t).map((e, i): TripEvent => ({ ...e, id: `${t.id}-suggestion-${i}` })),
    ),
    {
      id: 'demo-event-aula',
      userId: TERESA,
      date: day(0),
      startTime: '14:00',
      endTime: '16:00',
      title: 'Aula de IPM',
      location: 'FCT NOVA',
      kind: 'user',
      status: 'accepted',
    },
  ];

  return {
    rev: 1,
    users,
    sessions: [],
    documents,
    trips,
    members,
    invites: [],
    packing,
    events,
    reviews: [],
  };
}
