import { addDays, format } from 'date-fns';

import { DEMO_ACCOUNTS, DEMO_PASSWORD } from '@/data/demo';
import type {
  Category,
  ID,
  PackingItem,
  Role,
  TravelDocument,
  Trip,
  TripEvent,
  TripMember,
  TripReview,
} from '@/data/types';

import type { Db, StoredUser } from './db';
import { hashPassword } from './passwords';

// Demo data written the first time the server runs (or on "Repor dados de demonstração").
// Dates are relative to the day the data is created, so the demo never goes stale.
// Created on 19 Oct 2026, they match the sketches (Milão 20–22 Out, Genebra 27 Out–2 Nov…).
//
// The family: Teresa organises every trip; on Genebra, Rui is co-organiser and Pedro a
// participant (each has a bag; Teresa and Rui have each suggested something to Pedro).

const [TERESA, RUI, PEDRO] = DEMO_ACCOUNTS.map((a) => a.id);

type ItemSpec = [name: string, category: Category, quantity?: number];

function items(
  bag: { tripId: ID; memberId: ID },
  specs: ItemSpec[],
  packedCount: number,
  suggestedBy?: ID,
): PackingItem[] {
  return specs.map(([name, category, quantity = 1], i) => ({
    id: `${bag.tripId}-${bag.memberId}-${suggestedBy ? `from-${suggestedBy}` : 'item'}-${i}`,
    ...bag,
    ...(suggestedBy ? { suggestedBy } : {}),
    name,
    category,
    quantity,
    packed: i < packedCount,
    buyLater: false,
    source: suggestedBy ? 'manual' : 'generated',
  }));
}

const BASICS: ItemSpec[] = [
  ['Cartão de Cidadão', 'Documentos'],
  ['Carregador do telemóvel', 'Eletrónica'],
  ['Escova de dentes', 'Higiene'],
  ['Pasta de dentes', 'Higiene'],
  ['Desodorizante', 'Higiene'],
  ['Pijama', 'Roupa'],
  // Teresa is allergic to pollen.
  ['Anti-histamínico', 'Saúde'],
];
const BASICS_NO_ALLERGIES = BASICS.filter(([name]) => name !== 'Anti-histamínico');

const GENEBRA_CLOTHES: ItemSpec[] = [
  ['Ténis de caminhada', 'Roupa'],
  ['Casaco impermeável', 'Roupa'],
  ['Roupa interior', 'Roupa', 8],
  ['Meias', 'Roupa', 8],
  ['T-shirt', 'Roupa', 6],
  ['Calças', 'Roupa', 2],
];

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
      // Expires during the Milão trip: the dashboard flags it ("precisa de atenção").
      expiresAt: day(2),
    },
    {
      // Expires in ~4 months: under the 6-month rule, so it "precisa de atenção".
      id: 'demo-doc-passport',
      userId: TERESA,
      type: 'passport',
      name: 'Passaporte',
      number: 'CB123456',
      expiresAt: day(120),
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
    trip({
      id: 'demo-trip-milao',
      destination: { name: 'Milão', country: 'Itália', countryCode: 'IT', lat: 45.4642, lon: 9.19 },
      startDate: day(1),
      endDate: day(3),
      adults: 1,
      children: 0,
      purpose: 'work',
      activities: ['meeting', 'dinner_out'],
    }),
    trip({
      id: 'demo-trip-genebra',
      destination: {
        name: 'Genebra',
        country: 'Suíça',
        countryCode: 'CH',
        lat: 46.2044,
        lon: 6.1432,
      },
      startDate: day(8),
      endDate: day(14),
      adults: 3,
      children: 0,
      purpose: 'leisure',
      activities: ['hiking', 'museums_formal'],
    }),
    trip({
      id: 'demo-trip-sevilha',
      destination: {
        name: 'Sevilha',
        country: 'Espanha',
        countryCode: 'ES',
        lat: 37.3891,
        lon: -5.9845,
      },
      startDate: day(-106),
      endDate: day(-103),
      adults: 2,
      children: 0,
      purpose: 'leisure',
      activities: ['beach', 'dinner_out'],
    }),
    trip({
      id: 'demo-trip-londres',
      destination: {
        name: 'Londres',
        country: 'Reino Unido',
        countryCode: 'GB',
        lat: 51.5072,
        lon: -0.1276,
      },
      startDate: day(-259),
      endDate: day(-257),
      adults: 1,
      children: 0,
      purpose: 'work',
      activities: ['meeting'],
    }),
  ];

  const member = (tripId: ID, userId: ID, role: Role): TripMember => ({
    id: `${tripId}-${userId}`,
    tripId,
    userId,
    role,
    joinedAt: createdAt,
  });

  const members: TripMember[] = [
    ...trips.map((t) => member(t.id, TERESA, 'owner')),
    member('demo-trip-genebra', RUI, 'admin'),
    member('demo-trip-genebra', PEDRO, 'member'),
  ];

  const bag = (tripId: ID, memberId: ID) => ({ tripId, memberId });

  const packing: PackingItem[] = [
    // Milão: 10/24 arrumados, as in the sketch.
    ...items(
      bag('demo-trip-milao', TERESA),
      [
        ...BASICS,
        ['Portátil', 'Eletrónica'],
        ['Carregador do portátil', 'Eletrónica'],
        ['Fato', 'Roupa'],
        ['Camisa', 'Roupa', 3],
        ['Sapatos formais', 'Roupa'],
        ['Roupa interior', 'Roupa', 4],
        ['Meias', 'Roupa', 4],
        ['Calças de ganga', 'Roupa'],
        ['Camisola', 'Roupa'],
        ['Guarda-chuva', 'Acessórios'],
        ['Cartões de visita', 'Outros'],
        ['Adaptador de tomada', 'Eletrónica'],
        ['Perfume', 'Higiene'],
        ['Óculos de sol', 'Acessórios'],
        ['Livro', 'Outros'],
        ['Auriculares', 'Eletrónica'],
        ['Garrafa de água', 'Acessórios'],
      ],
      10,
    ),
    ...items(
      bag('demo-trip-genebra', TERESA),
      [
        ...BASICS,
        ['Passaporte', 'Documentos'],
        ...GENEBRA_CLOTHES,
        ['Gorro', 'Acessórios'],
        ['Mochila de dia', 'Acessórios'],
        ['Garrafa de água', 'Acessórios'],
        ['Protetor solar', 'Saúde'],
      ],
      0,
    ),
    ...items(
      bag('demo-trip-genebra', RUI),
      [
        ...BASICS_NO_ALLERGIES,
        ...GENEBRA_CLOTHES,
        ['Máquina de barbear', 'Higiene'],
        ['Mochila de dia', 'Acessórios'],
        ['Garrafa de água', 'Acessórios'],
      ],
      5,
    ),
    ...items(
      bag('demo-trip-genebra', PEDRO),
      [
        ...BASICS_NO_ALLERGIES,
        ...GENEBRA_CLOTHES,
        ['Consola portátil', 'Eletrónica'],
        ['Auriculares', 'Eletrónica'],
      ],
      3,
    ),
    // What the organisers added to Pedro's bag ("Sugerido por …").
    ...items(bag('demo-trip-genebra', PEDRO), [['Gorro', 'Acessórios']], 0, TERESA),
    ...items(bag('demo-trip-genebra', PEDRO), [['Luvas', 'Acessórios']], 0, RUI),
    // Past trips: everything was packed.
    ...items(
      bag('demo-trip-sevilha', TERESA),
      [
        ...BASICS,
        ['Fato de banho', 'Roupa', 2],
        ['Toalha de praia', 'Acessórios', 2],
        ['Protetor solar', 'Saúde'],
        ['Óculos de sol', 'Acessórios', 2],
        ['Chapéu', 'Acessórios', 2],
        ['Calções', 'Roupa', 6],
        ['T-shirt', 'Roupa', 8],
        ['Vestido', 'Roupa', 2],
        ['Sandálias', 'Roupa', 2],
        ['Roupa interior', 'Roupa', 8],
        ['Meias', 'Roupa', 4],
        ['Ténis', 'Roupa', 2],
        ['Leque', 'Acessórios'],
        ['Garrafa de água', 'Acessórios', 2],
        ['Powerbank', 'Eletrónica'],
        ['Câmara fotográfica', 'Eletrónica'],
        ['Livro', 'Outros'],
        ['Após-sol', 'Saúde'],
        ['Mochila', 'Acessórios'],
        ['Perfume', 'Higiene'],
        ['Champô', 'Higiene'],
        ['Gel de banho', 'Higiene'],
      ],
      29,
    ).filter((i) => i.name !== 'Carregador do telemóvel'),
    ...items(
      bag('demo-trip-londres', TERESA),
      [
        ...BASICS,
        ['Portátil', 'Eletrónica'],
        ['Adaptador de tomada', 'Eletrónica'],
        ['Fato', 'Roupa'],
        ['Camisa', 'Roupa', 2],
        ['Sapatos formais', 'Roupa'],
        ['Roupa interior', 'Roupa', 3],
        ['Casaco', 'Roupa'],
      ],
      14,
    ),
  ];

  const event = (e: Omit<TripEvent, 'userId'>, userId = TERESA): TripEvent => ({ ...e, userId });

  const events: TripEvent[] = [
    event({
      id: 'demo-event-aula',
      date: day(0),
      startTime: '14:00',
      endTime: '16:00',
      title: 'Aula de IPM',
      location: 'FCT NOVA',
      kind: 'user',
      status: 'accepted',
    }),
    event({
      id: 'demo-event-reuniao',
      tripId: 'demo-trip-milao',
      date: day(2),
      startTime: '10:00',
      endTime: '12:00',
      title: 'Reunião com cliente',
      location: 'Escritório de Milão',
      kind: 'user',
      status: 'accepted',
    }),
    event({
      id: 'demo-event-casa-cusi',
      tripId: 'demo-trip-milao',
      date: day(1),
      startTime: '20:00',
      title: 'Jantar',
      location: 'Casa Cusi',
      kind: 'suggested',
      status: 'pending',
    }),
    event({
      id: 'demo-event-petit-palace',
      tripId: 'demo-trip-genebra',
      date: day(9),
      startTime: '22:00',
      title: 'Sair',
      location: 'Petit Palace',
      kind: 'suggested',
      status: 'pending',
    }),
    // Added by the co-organiser: everyone on the trip sees it.
    event(
      {
        id: 'demo-event-jantar-familia',
        tripId: 'demo-trip-genebra',
        date: day(10),
        startTime: '20:00',
        title: 'Jantar de família',
        location: 'Café du Soleil',
        kind: 'user',
        status: 'accepted',
      },
      RUI,
    ),
  ];

  const reviews: TripReview[] = [
    {
      id: 'demo-review-sevilha',
      tripId: 'demo-trip-sevilha',
      userId: TERESA,
      forgotten: ['Carregador do telemóvel'],
      unused: [{ name: 'Calções', qty: 2 }],
    },
    {
      id: 'demo-review-londres',
      tripId: 'demo-trip-londres',
      userId: TERESA,
      forgotten: ['Guarda-chuva'],
      unused: [],
    },
  ];

  return {
    rev: 1,
    users,
    sessions: [],
    documents,
    trips,
    members,
    // A fixed code, so it can be typed during a demo.
    invites: [
      {
        id: 'demo-invite-genebra',
        tripId: 'demo-trip-genebra',
        code: 'GENEVA',
        createdBy: TERESA,
        expiresAt: addDays(today, 7).toISOString(),
      },
    ],
    packing,
    events,
    reviews,
  };
}
