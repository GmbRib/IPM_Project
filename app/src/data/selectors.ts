import { differenceInCalendarDays, format, parseISO } from 'date-fns';

import type { PackingItem, TravelDocument, Trip, TripStatus } from './types';

/** Today as 'yyyy-MM-dd', the format trips and events use. */
export const todayISO = (now = new Date()) => format(now, 'yyyy-MM-dd');

export function tripStatus(trip: Trip, today = todayISO()): TripStatus {
  if (today < trip.startDate) return 'upcoming';
  if (today > trip.endDate) return 'past';
  return 'ongoing';
}

/** The trip happening now, otherwise the next one; null when there are none ahead. */
export function currentTrip(trips: Trip[], today = todayISO()) {
  const ahead = trips
    .filter((t) => tripStatus(t, today) !== 'past')
    .sort((a, b) => a.startDate.localeCompare(b.startDate));
  return ahead[0] ?? null;
}

export function pastTrips(trips: Trip[], today = todayISO()) {
  return trips
    .filter((t) => tripStatus(t, today) === 'past')
    .sort((a, b) => b.startDate.localeCompare(a.startDate));
}

export const daysUntil = (date: string, today = todayISO()) =>
  differenceInCalendarDays(parseISO(date), parseISO(today));

/** Packing progress of one trip: packed vs total item rows. */
export function packingProgress(items: PackingItem[], tripId: string) {
  const mine = items.filter((i) => i.tripId === tripId);
  const packed = mine.filter((i) => i.packed).length;
  return { packed, total: mine.length, ratio: mine.length ? packed / mine.length : 0 };
}

export type DocumentStatus = 'valid' | 'expiring' | 'expired';

/** Days before expiry when a document starts to "precisar de atenção" (passport rule). */
export const EXPIRY_WARNING_DAYS = 180;

export function documentStatus(doc: TravelDocument, today = todayISO()): DocumentStatus {
  const left = daysUntil(doc.expiresAt, today);
  if (left < 0) return 'expired';
  if (left <= EXPIRY_WARNING_DAYS) return 'expiring';
  return 'valid';
}
