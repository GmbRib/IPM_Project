import {
  addDays,
  differenceInCalendarDays,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  parseISO,
  startOfMonth,
  startOfWeek,
} from 'date-fns';
import { pt } from 'date-fns/locale';

import type { ISODate, Trip, TripEvent } from '@/data/types';

// Pure date/layout helpers for the calendar and the day timeline.
// Weeks start on Monday (PT).

const WEEK = { weekStartsOn: 1 } as const;

export const toISODate = (d: Date): ISODate => format(d, 'yyyy-MM-dd');

/** Capitalised, e.g. "Outubro 2026". */
export const monthTitle = (d: Date) => capitalise(format(d, 'LLLL yyyy', { locale: pt }));
/** e.g. "Terça, 20 de outubro". */
export const dayTitle = (iso: ISODate) =>
  capitalise(format(parseISO(iso), "EEEE, d 'de' MMMM", { locale: pt })).replace('-feira', '');
/** e.g. "terça-feira, 20 de outubro de 2026" (screen readers). */
export const dayLabel = (iso: ISODate) =>
  format(parseISO(iso), "EEEE, d 'de' MMMM 'de' yyyy", { locale: pt });
/** "20 Out" / "20–22 Out" / "30 Out – 2 Nov". */
export function rangeLabel(start: ISODate, end: ISODate) {
  const a = parseISO(start);
  const b = parseISO(end);
  const mon = (d: Date) => capitalise(format(d, 'MMM', { locale: pt }).replace('.', ''));
  if (start === end) return `${format(a, 'd')} ${mon(a)}`;
  if (a.getMonth() === b.getMonth()) return `${format(a, 'd')}–${format(b, 'd')} ${mon(b)}`;
  return `${format(a, 'd')} ${mon(a)} – ${format(b, 'd')} ${mon(b)}`;
}

export const WEEKDAY_SHORT = ['S', 'T', 'Q', 'Q', 'S', 'S', 'D'];
export const WEEKDAY_LONG = ['segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado', 'domingo'];

function capitalise(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/** The weeks (Mon–Sun) shown for a month, as ISO dates; includes edge days of nearby months. */
export function monthWeeks(month: Date): ISODate[][] {
  const days = eachDayOfInterval({
    start: startOfWeek(startOfMonth(month), WEEK),
    end: endOfWeek(endOfMonth(month), WEEK),
  }).map(toISODate);
  return Array.from({ length: days.length / 7 }, (_, i) => days.slice(i * 7, i * 7 + 7));
}

/** The Monday–Sunday week containing `iso`. */
export function weekOf(iso: ISODate): ISODate[] {
  const start = startOfWeek(parseISO(iso), WEEK);
  return Array.from({ length: 7 }, (_, i) => toISODate(addDays(start, i)));
}

export const shiftDays = (iso: ISODate, days: number) => toISODate(addDays(parseISO(iso), days));

export type TripBar = {
  trip: Trip;
  /** First and last column (0–6) covered in this week. */
  startCol: number;
  endCol: number;
  lane: number;
  /** Whether the trip really starts/ends this week (for rounded ends). */
  startsHere: boolean;
  endsHere: boolean;
};

/** Lays the trips of one week out as bars, stacking overlapping trips in lanes. */
export function weekTripBars(week: ISODate[], trips: Trip[]): TripBar[] {
  const first = week[0];
  const last = week[6];
  const visible = trips
    .filter((t) => t.startDate <= last && t.endDate >= first)
    .sort((a, b) => a.startDate.localeCompare(b.startDate));

  const laneEnds: number[] = [];
  return visible.map((trip) => {
    const startCol = Math.max(
      0,
      differenceInCalendarDays(parseISO(trip.startDate), parseISO(first)),
    );
    const endCol = Math.min(6, differenceInCalendarDays(parseISO(trip.endDate), parseISO(first)));
    let lane = laneEnds.findIndex((end) => end < startCol);
    if (lane === -1) lane = laneEnds.length;
    laneEnds[lane] = endCol;
    return {
      trip,
      startCol,
      endCol,
      lane,
      startsHere: trip.startDate >= first,
      endsHere: trip.endDate <= last,
    };
  });
}

/** Trip(s) happening on a day. */
export const tripsOn = (trips: Trip[], iso: ISODate) =>
  trips.filter((t) => t.startDate <= iso && t.endDate >= iso);

/** Events shown in the calendar on a day: accepted ones and pending suggestions. */
export const visibleEventsOn = (events: TripEvent[], iso: ISODate) =>
  events
    .filter((e) => e.date === iso && e.status !== 'dismissed')
    .sort((a, b) => a.startTime.localeCompare(b.startTime));

/** 'HH:mm' → minutes since midnight. */
export function toMinutes(time: string) {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

export const fromMinutes = (min: number) =>
  `${String(Math.floor(min / 60)).padStart(2, '0')}:${String(min % 60).padStart(2, '0')}`;

/** Events without an end time count as one hour. */
export const DEFAULT_DURATION = 60;

export const eventEnd = (e: Pick<TripEvent, 'startTime' | 'endTime'>) =>
  e.endTime ? toMinutes(e.endTime) : toMinutes(e.startTime) + DEFAULT_DURATION;

export type PlacedEvent = { event: TripEvent; column: number; columns: number };

/**
 * Side-by-side columns for overlapping events in the day timeline: each group of
 * events that overlap each other shares the width equally.
 */
export function placeEvents(events: TripEvent[]): PlacedEvent[] {
  const sorted = [...events].sort((a, b) => toMinutes(a.startTime) - toMinutes(b.startTime));
  const placed: PlacedEvent[] = [];
  let group: PlacedEvent[] = [];
  let groupEnd = -1;
  let colEnds: number[] = [];

  const flush = () => {
    const columns = colEnds.length;
    group.forEach((p) => (p.columns = columns));
    placed.push(...group);
    group = [];
    colEnds = [];
  };

  for (const event of sorted) {
    const start = toMinutes(event.startTime);
    if (start >= groupEnd && group.length) flush();
    let column = colEnds.findIndex((end) => end <= start);
    if (column === -1) column = colEnds.length;
    colEnds[column] = eventEnd(event);
    groupEnd = Math.max(groupEnd, eventEnd(event));
    group.push({ event, column, columns: 1 });
  }
  if (group.length) flush();
  return placed;
}

/** Other events on the same day whose time overlaps [start, end). */
export function overlapping(
  events: TripEvent[],
  draft: { id?: string; date: ISODate; startTime: string; endTime?: string },
) {
  const start = toMinutes(draft.startTime);
  const end = eventEnd(draft);
  return events.filter(
    (e) =>
      e.id !== draft.id &&
      e.date === draft.date &&
      e.status === 'accepted' &&
      toMinutes(e.startTime) < end &&
      eventEnd(e) > start,
  );
}
