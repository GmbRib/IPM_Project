import { z } from 'zod';

// What the server accepts from the app. Unknown keys are dropped, so a client can never set
// fields the server owns (ids, owners, "suggestedBy", roles…).
//
// Optional fields are `nullish`: JSON has no `undefined`, so the app sends `null` to clear a
// field in a patch (see applyPatch in actions.ts).

const id = z.string().min(1).max(100);
const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const time = z.string().regex(/^\d{2}:\d{2}$/);
const text = (max: number) => z.string().trim().max(max);
const name = (max: number) => text(max).min(1);

export const email = z.string().trim().toLowerCase().max(200).pipe(z.email());
export const password = z.string().min(8).max(200);

const conditions = z.object({
  wheelchair: z.boolean(),
  allergies: z.array(name(80)).max(30),
  medication: z.array(name(80)).max(30),
});

export const userPatch = z
  .object({
    name: text(80),
    conditions,
    onboarded: z.boolean(),
    settings: z.object({ tempUnit: z.enum(['C', 'F']), packingReminder: z.boolean() }),
  })
  .partial();

const documentFields = {
  type: z.enum(['cc', 'passport', 'driving', 'other']),
  name: name(80),
  number: name(40),
  expiresAt: isoDate,
  // A file on the phone, or a small JPEG data URI on web (src/lib/photos.web.ts).
  photoUri: z.string().max(2_000_000).nullish(),
};
export const documentData = z.object(documentFields);
export const documentPatch = z.object(documentFields).partial();

const tripFields = {
  destination: z.object({
    name: name(100),
    country: text(100),
    countryCode: z.string().length(2).nullish(),
    lat: z.number().min(-90).max(90).nullish(),
    lon: z.number().min(-180).max(180).nullish(),
  }),
  startDate: isoDate,
  endDate: isoDate,
  adults: z.number().int().min(1).max(20),
  children: z.number().int().min(0).max(20),
  purpose: z.enum(['leisure', 'work']),
  activities: z
    .array(
      z.enum([
        'hiking',
        'beach',
        'dinner_out',
        'meeting',
        'museums_formal',
        'sport',
        'theme_park',
        'nightlife',
      ]),
    )
    .max(8),
  basedOnTripId: id.nullish(),
};
export const tripData = z.object(tripFields);
export const tripPatch = z.object(tripFields).partial();

const itemFields = {
  name: name(100),
  category: z.enum([
    'Roupa',
    'Higiene',
    'Saúde',
    'Eletrónica',
    'Documentos',
    'Acessórios',
    'Criança',
    'Outros',
  ]),
  quantity: z.number().int().min(1).max(99),
  packed: z.boolean(),
  buyLater: z.boolean(),
};
/** A bag item without its bag: used when the server decides whose bag it goes into. */
export const bagItem = z.object({
  ...itemFields,
  source: z.enum(['generated', 'manual', 'history']),
});
export const itemData = bagItem.extend({ tripId: id, memberId: id });
export const itemPatch = z.object(itemFields).partial();

const eventFields = {
  tripId: id.nullish(),
  date: isoDate,
  startTime: time,
  endTime: time.nullish(),
  title: name(100),
  location: text(150).nullish(),
  notes: text(1000).nullish(),
  kind: z.enum(['user', 'suggested']),
  status: z.enum(['accepted', 'pending', 'dismissed']),
};
export const eventData = z.object(eventFields);
/** An event created together with its trip (the server fills in the trip). */
export const tripEventData = eventData.omit({ tripId: true });
export const eventPatch = z.object(eventFields).partial();

export const reviewData = z.object({
  tripId: id,
  forgotten: z.array(name(100)).max(200),
  unused: z.array(z.object({ name: name(100), qty: z.number().int().min(1).max(99) })).max(200),
});

export const ids = { id, tripId: id, userId: id };
export const inviteCode = z.string().trim().toUpperCase().length(6);
