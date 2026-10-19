import type { Trip, TripEvent } from '@/data/types';

import {
  monthWeeks,
  overlapping,
  placeEvents,
  rangeLabel,
  weekTripBars,
  weekOf,
} from '../calendar';

const trip = (id: string, startDate: string, endDate: string) =>
  ({ id, startDate, endDate }) as Trip;
const event = (id: string, startTime: string, endTime?: string) =>
  ({ id, date: '2026-10-20', startTime, endTime, status: 'accepted' }) as TripEvent;

describe('calendar helpers', () => {
  it('builds Monday-first weeks covering the month', () => {
    const weeks = monthWeeks(new Date(2026, 9, 1));
    expect(weeks[0][0]).toBe('2026-09-28');
    expect(weeks.at(-1)?.[6]).toBe('2026-11-01');
  });

  it('lays out trip bars in lanes, clipped to the week', () => {
    const bars = weekTripBars(weekOf('2026-10-28'), [
      trip('long', '2026-10-27', '2026-11-02'),
      trip('a', '2026-10-28', '2026-10-29'),
      trip('b', '2026-10-30', '2026-10-31'),
    ]);
    expect(bars.map((b) => [b.trip.id, b.startCol, b.endCol, b.lane, b.endsHere])).toEqual([
      ['long', 1, 6, 0, false],
      ['a', 2, 3, 1, true],
      ['b', 4, 5, 1, true],
    ]);
  });

  it('puts overlapping events side by side', () => {
    const placed = placeEvents([
      event('a', '10:00', '12:00'),
      event('b', '11:00'),
      event('c', '12:00', '13:00'),
    ]);
    expect(placed.map((p) => [p.event.id, p.column, p.columns])).toEqual([
      ['a', 0, 2],
      ['b', 1, 2],
      ['c', 0, 1],
    ]);
  });

  it('detects clashes, but not back-to-back events', () => {
    const existing = [event('a', '10:00', '12:00')];
    expect(overlapping(existing, { date: '2026-10-20', startTime: '11:30' })).toHaveLength(1);
    expect(overlapping(existing, { date: '2026-10-20', startTime: '12:00' })).toHaveLength(0);
  });

  it('formats date ranges in Portuguese', () => {
    expect(rangeLabel('2026-10-20', '2026-10-22')).toBe('20–22 Out');
    expect(rangeLabel('2026-10-27', '2026-11-02')).toBe('27 Out – 2 Nov');
  });
});
