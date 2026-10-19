import type { TravelDocument, Trip } from '@/data/types';

import { documentIssues } from '../documents';
import { suggestEvents } from '../suggestions';

const trip: Trip = {
  id: 'trip',
  userId: 'u',
  destination: { name: 'Milão', country: 'Itália', countryCode: 'IT', lat: 45, lon: 9 },
  startDate: '2026-10-20',
  endDate: '2026-10-22',
  adults: 1,
  children: 0,
  purpose: 'work',
  activities: ['meeting', 'dinner_out', 'museums_formal'],
  createdAt: '',
};

const doc = (over: Partial<TravelDocument>): TravelDocument => ({
  id: 'd',
  userId: 'u',
  type: 'cc',
  name: 'Cartão de Cidadão',
  number: '1',
  expiresAt: '2030-01-01',
  ...over,
});

describe('suggestEvents', () => {
  it('uses known places and spreads ideas over the trip as pending suggestions', () => {
    const events = suggestEvents(trip);
    expect(events.map((e) => e.location)).toEqual(['Casa Cusi', 'Duomo di Milano']);
    expect(events.map((e) => e.date)).toEqual(['2026-10-20', '2026-10-21']);
    expect(events.every((e) => e.kind === 'suggested' && e.status === 'pending')).toBe(true);
  });

  it('falls back to generic ideas in unknown cities', () => {
    const events = suggestEvents({ ...trip, destination: { name: 'Évora', country: 'Portugal' } });
    expect(events[0].location).toBe('Restaurante típico em Évora');
  });
});

describe('documentIssues', () => {
  it('is quiet when a valid citizen card covers a Schengen trip', () => {
    expect(documentIssues([doc({})], trip)).toEqual([]);
  });

  it('flags a document that expires during the trip', () => {
    expect(documentIssues([doc({ expiresAt: '2026-10-21' })], trip)[0].message).toMatch(
      /expira antes/,
    );
  });

  it('asks for a passport outside Schengen, with 6 months to spare', () => {
    const london = {
      ...trip,
      destination: { ...trip.destination, countryCode: 'GB', country: 'Reino Unido' },
    };
    expect(documentIssues([doc({})], london)[0].message).toMatch(/passaporte/);
    const shortPassport = doc({ type: 'passport', name: 'Passaporte', expiresAt: '2027-01-01' });
    expect(documentIssues([shortPassport], london)[0].message).toMatch(/6 meses/);
  });
});
