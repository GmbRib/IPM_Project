import { addDays, format } from 'date-fns';

import type {
  Category,
  ID,
  PackingItem,
  TravelDocument,
  Trip,
  TripEvent,
  TripReview,
  User,
} from './types';

// Demo account used in development and in user tests (plan §8, Fase 7).
// Dates are relative to the day the data is created, so the demo never goes stale.
// Created on 19 Oct 2026, they match the sketches (Milão 20–22 Out, Genebra 27 Out–2 Nov…).
export const DEMO_EMAIL = 'ana@packsun.pt';
export const DEMO_PASSWORD = 'ana12345';

const USER_ID = 'demo-user-ana';

type ItemSpec = [name: string, category: Category, quantity?: number];

function items(tripId: ID, specs: ItemSpec[], packedCount: number): PackingItem[] {
  return specs.map(([name, category, quantity = 1], i) => ({
    id: `${tripId}-item-${i}`,
    tripId,
    name,
    category,
    quantity,
    packed: i < packedCount,
    buyLater: false,
    source: 'generated',
  }));
}

const BASICS: ItemSpec[] = [
  ['Cartão de Cidadão', 'Documentos'],
  ['Carregador do telemóvel', 'Eletrónica'],
  ['Escova de dentes', 'Higiene'],
  ['Pasta de dentes', 'Higiene'],
  ['Desodorizante', 'Higiene'],
  ['Pijama', 'Roupa'],
  ['Anti-histamínico', 'Saúde'],
];

export function buildDemoData(today: Date) {
  const day = (offset: number) => format(addDays(today, offset), 'yyyy-MM-dd');
  const createdAt = today.toISOString();

  const users: (User & { password: string })[] = [
    {
      id: USER_ID,
      email: DEMO_EMAIL,
      password: DEMO_PASSWORD,
      name: 'Ana',
      conditions: { wheelchair: false, allergies: ['Pólen'], medication: [] },
      onboarded: true,
      createdAt,
    },
  ];

  const documents: TravelDocument[] = [
    {
      id: 'demo-doc-cc',
      userId: USER_ID,
      type: 'cc',
      name: 'Cartão de Cidadão',
      number: '12345678 9 ZZ1',
      // Expires during the Milão trip: the dashboard flags it ("precisa de atenção").
      expiresAt: day(2),
    },
    {
      // Expires in ~4 months: under the 6-month rule, so it "precisa de atenção".
      id: 'demo-doc-passport',
      userId: USER_ID,
      type: 'passport',
      name: 'Passaporte',
      number: 'CB123456',
      expiresAt: day(120),
    },
    {
      id: 'demo-doc-driving',
      userId: USER_ID,
      type: 'driving',
      name: 'Carta de Condução',
      number: 'L-1234567 8',
      expiresAt: day(2000),
    },
  ];

  const trip = (t: Omit<Trip, 'userId' | 'createdAt'>): Trip => ({
    ...t,
    userId: USER_ID,
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
      adults: 1,
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

  const packing: PackingItem[] = [
    // Milão: 10/24 arrumados, as in the sketch.
    ...items(
      'demo-trip-milao',
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
      'demo-trip-genebra',
      [
        ...BASICS,
        ['Passaporte', 'Documentos'],
        ['Ténis de caminhada', 'Roupa'],
        ['Casaco impermeável', 'Roupa'],
        ['Gorro', 'Acessórios'],
        ['Roupa interior', 'Roupa', 8],
        ['Meias', 'Roupa', 8],
        ['T-shirt', 'Roupa', 6],
        ['Calças', 'Roupa', 2],
        ['Mochila de dia', 'Acessórios'],
        ['Garrafa de água', 'Acessórios'],
        ['Protetor solar', 'Saúde'],
      ],
      0,
    ),
    // Past trips: everything was packed.
    ...items(
      'demo-trip-sevilha',
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
      'demo-trip-londres',
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

  const event = (e: Omit<TripEvent, 'userId'>): TripEvent => ({ ...e, userId: USER_ID });

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
  ];

  const reviews: TripReview[] = [
    {
      id: 'demo-review-sevilha',
      tripId: 'demo-trip-sevilha',
      forgotten: ['Carregador do telemóvel'],
      unused: [{ name: 'Calções', qty: 2 }],
    },
    {
      id: 'demo-review-londres',
      tripId: 'demo-trip-londres',
      forgotten: ['Guarda-chuva'],
      unused: [],
    },
  ];

  return { users, documents, trips, packing, events, reviews };
}
