import { z } from 'zod';

// Form schemas with the messages users see (PT-PT).

const email = z
  .string()
  .trim()
  .pipe(z.email({ error: 'Escreve um email válido, ex.: ana@mail.pt' }));

export const loginSchema = z.object({
  email,
  password: z.string().min(1, { error: 'Escreve a tua palavra-passe' }),
});
export type LoginValues = z.infer<typeof loginSchema>;

export const PASSWORD_MIN = 8;

export const registerSchema = z
  .object({
    email,
    password: z
      .string()
      .min(PASSWORD_MIN, { error: `Tem de ter pelo menos ${PASSWORD_MIN} caracteres` }),
    confirm: z.string().min(1, { error: 'Repete a palavra-passe' }),
  })
  .refine((v) => v.password === v.confirm, {
    path: ['confirm'],
    error: 'As palavras-passe não coincidem',
  });
export type RegisterValues = z.infer<typeof registerSchema>;

export const profileSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(1, { error: 'Diz-nos como te chamas' })
      .max(40, { error: 'Máximo 40 caracteres' }),
    wheelchair: z.boolean(),
    hasAllergies: z.boolean(),
    allergies: z.array(z.string()),
    hasMedication: z.boolean(),
    medication: z.array(z.string()),
  })
  .refine((v) => !v.hasAllergies || v.allergies.length > 0, {
    path: ['allergies'],
    error: 'Adiciona pelo menos uma alergia',
  })
  .refine((v) => !v.hasMedication || v.medication.length > 0, {
    path: ['medication'],
    error: 'Adiciona pelo menos um medicamento',
  });
export type ProfileValues = z.infer<typeof profileSchema>;

export const documentSchema = z.object({
  type: z.enum(['cc', 'passport', 'driving', 'other']),
  name: z.string().trim().min(1, { error: 'Dá um nome ao documento' }),
  number: z.string().trim().min(1, { error: 'Escreve o número do documento' }),
  expiresAt: z.date({ error: 'Indica a data de validade' }),
  photoUri: z.string().optional(),
});
export type DocumentValues = z.infer<typeof documentSchema>;

export const eventSchema = z
  .object({
    title: z
      .string()
      .trim()
      .min(1, { error: 'Dá um nome ao evento' })
      .max(60, { error: 'Máximo 60 caracteres' }),
    date: z.date({ error: 'Escolhe o dia' }),
    start: z.date({ error: 'Escolhe a hora de início' }),
    end: z.date().nullable(),
    location: z.string().trim().max(80, { error: 'Máximo 80 caracteres' }),
    tripId: z.string().nullable(),
    notes: z.string().trim().max(300, { error: 'Máximo 300 caracteres' }),
  })
  .refine((v) => !v.end || hhmm(v.end) > hhmm(v.start), {
    path: ['end'],
    error: 'Tem de ser depois da hora de início',
  });
export type EventValues = z.infer<typeof eventSchema>;

function hhmm(d: Date) {
  return d.getHours() * 60 + d.getMinutes();
}

export const tripSchema = z
  .object({
    destination: z
      .object({
        name: z.string(),
        country: z.string(),
        countryCode: z.string().optional(),
        lat: z.number().optional(),
        lon: z.number().optional(),
      })
      .nullable()
      .refine((d) => d !== null, { error: 'Escolhe o destino' }),
    start: z.date({ error: 'Escolhe a data de ida' }),
    end: z.date({ error: 'Escolhe a data de regresso' }),
    people: z.number().int().min(1).max(20),
    children: z.number().int().min(0),
    purpose: z.enum(['leisure', 'work']),
    activities: z.array(
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
    ),
  })
  .refine((v) => !v.start || !v.end || v.end >= v.start, {
    path: ['end'],
    error: 'O regresso tem de ser depois da ida',
  })
  .refine((v) => v.children < v.people, {
    path: ['children'],
    error: 'Tem de ir pelo menos um adulto',
  });
export type TripValues = z.infer<typeof tripSchema>;
export type TripInput = z.input<typeof tripSchema>;
