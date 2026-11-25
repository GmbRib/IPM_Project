import { addDays, format } from 'date-fns';

import { DEMO_ACCOUNTS } from '@/data/demo';
import type { Category, ID, PackingItem, Role, TripMember } from '@/data/types';

import type { Db } from '../db';

// A trip shared by the three demo accounts, for the server's sharing rules. The demo data
// only has the test scenarios (Teresa alone), so the tests add this one themselves.
// Genebra: Teresa organises, Rui co-organises, Pedro participates (each has a bag; Teresa and
// Rui have each suggested something to Pedro). Invite code GENEVA.

export const GENEBRA = 'demo-trip-genebra';
const [TERESA, RUI, PEDRO] = DEMO_ACCOUNTS.map((a) => a.id);

type ItemSpec = [name: string, category: Category, quantity?: number];

function items(
  memberId: ID,
  specs: ItemSpec[],
  packedCount: number,
  suggestedBy?: ID,
): PackingItem[] {
  return specs.map(([name, category, quantity = 1], i) => ({
    id: `${GENEBRA}-${memberId}-${suggestedBy ? `from-${suggestedBy}` : 'item'}-${i}`,
    tripId: GENEBRA,
    memberId,
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
  ['Pijama', 'Roupa'],
];
const CLOTHES: ItemSpec[] = [
  ['Ténis de caminhada', 'Roupa'],
  ['Roupa interior', 'Roupa', 8],
  ['T-shirt', 'Roupa', 6],
];

export function addSharedTrip(db: Db, today: Date) {
  const day = (offset: number) => format(addDays(today, offset), 'yyyy-MM-dd');
  const createdAt = today.toISOString();
  const member = (userId: ID, role: Role): TripMember => ({
    id: `${GENEBRA}-${userId}`,
    tripId: GENEBRA,
    userId,
    role,
    joinedAt: createdAt,
  });

  db.trips.push({
    id: GENEBRA,
    createdBy: TERESA,
    createdAt,
    destination: { name: 'Genebra', country: 'Suíça', countryCode: 'CH', lat: 46.2, lon: 6.14 },
    startDate: day(8),
    endDate: day(14),
    adults: 3,
    children: 0,
    purpose: 'leisure',
    activities: ['hiking', 'museums_formal'],
  });
  db.members.push(member(TERESA, 'owner'), member(RUI, 'admin'), member(PEDRO, 'member'));
  db.packing.push(
    ...items(TERESA, [...BASICS, ...CLOTHES, ['Gorro', 'Acessórios']], 0),
    ...items(RUI, [...BASICS, ...CLOTHES, ['Máquina de barbear', 'Higiene']], 5),
    ...items(PEDRO, [...BASICS, ...CLOTHES, ['Consola portátil', 'Eletrónica']], 3),
    // What the organisers added to Pedro's bag ("Sugerido por …").
    ...items(PEDRO, [['Gorro', 'Acessórios']], 0, TERESA),
    ...items(PEDRO, [['Luvas', 'Acessórios']], 0, RUI),
  );
  db.events.push(
    {
      id: 'demo-event-petit-palace',
      userId: TERESA,
      tripId: GENEBRA,
      date: day(9),
      startTime: '22:00',
      title: 'Sair',
      location: 'Petit Palace',
      kind: 'suggested',
      status: 'pending',
    },
    // Added by the co-organiser: everyone on the trip sees it.
    {
      id: 'demo-event-jantar-familia',
      userId: RUI,
      tripId: GENEBRA,
      date: day(10),
      startTime: '20:00',
      title: 'Jantar de família',
      location: 'Café du Soleil',
      kind: 'user',
      status: 'accepted',
    },
  );
  db.invites.push({
    id: 'demo-invite-genebra',
    tripId: GENEBRA,
    code: 'GENEVA',
    createdBy: TERESA,
    expiresAt: addDays(today, 7).toISOString(),
  });
}
