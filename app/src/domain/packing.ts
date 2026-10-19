import { differenceInCalendarDays, parseISO } from 'date-fns';

import type { Activity, Category, NewOf, PackingItem, Trip, TripReview, User } from '@/data/types';
import type { DayForecast } from '@/services/weather';

import { needsPassport, needsPlugAdapter } from './countries';

// Builds a trip's packing list from everything we know (plan §7). Pure function:
// same input, same list. Every rule is a list of [name, category, quantity].

type Line = [name: string, category: Category, qty: number];

export type PackingInput = {
  trip: Pick<
    Trip,
    'startDate' | 'endDate' | 'adults' | 'children' | 'purpose' | 'activities' | 'destination'
  >;
  conditions: User['conditions'];
  forecast?: DayForecast[];
  /** Review of the trip this one is based on ("Usar como base"). */
  baseReview?: Pick<TripReview, 'forgotten' | 'unused'>;
};

/** Packing for many days doesn't scale forever: people do laundry. */
const MAX_DAYS = 7;
const RAIN_CHANCE = 50;
const HOT = 25;
const COLD = 10;
const MILD = 15;

/** WMO codes for drizzle, rain, showers and thunderstorms. */
const isRainCode = (code: number) =>
  (code >= 51 && code <= 67) || (code >= 80 && code <= 82) || code >= 95;

export function tripDays(trip: Pick<Trip, 'startDate' | 'endDate'>) {
  return differenceInCalendarDays(parseISO(trip.endDate), parseISO(trip.startDate)) + 1;
}

export function generatePackingList(input: PackingInput, tripId: string): NewOf<PackingItem>[] {
  const { trip, conditions, forecast, baseReview } = input;
  const days = Math.min(tripDays(trip), MAX_DAYS);
  const people = trip.adults + trip.children;
  const lines: Line[] = [];
  const add = (...l: Line[]) => lines.push(...l);

  // Documents and basics.
  add(
    needsPassport(trip.destination.countryCode)
      ? ['Passaporte', 'Documentos', trip.adults]
      : ['Cartão de Cidadão', 'Documentos', trip.adults],
    ['Carregador do telemóvel', 'Eletrónica', trip.adults],
    ['Escova de dentes', 'Higiene', people],
    ['Pasta de dentes', 'Higiene', 1],
    ['Desodorizante', 'Higiene', trip.adults],
    ['Champô', 'Higiene', 1],
    ['Roupa interior', 'Roupa', (days + 1) * people],
    ['Meias', 'Roupa', days * people],
    ['T-shirt', 'Roupa', days * people],
    ['Calças', 'Roupa', Math.ceil(days / 3) * people],
    ['Pijama', 'Roupa', people],
  );
  if (tripDays(trip) >= 3) add(['Powerbank', 'Eletrónica', 1]);
  if (needsPlugAdapter(trip.destination.countryCode)) add(['Adaptador de tomada', 'Eletrónica', 1]);

  if (trip.children > 0) {
    add(
      ['Toalhitas', 'Criança', 1],
      ['Muda de roupa extra', 'Criança', trip.children],
      ['Brinquedo ou livro', 'Criança', trip.children],
      ['Snacks para a viagem', 'Criança', 1],
    );
  }

  if (trip.purpose === 'work') {
    add(
      ['Portátil', 'Eletrónica', 1],
      ['Carregador do portátil', 'Eletrónica', 1],
      ['Camisa', 'Roupa', Math.min(days, 5) * trip.adults],
      ['Sapatos formais', 'Roupa', trip.adults],
      ['Cartões de visita', 'Outros', 1],
    );
  }

  for (const activity of trip.activities) add(...ACTIVITY_ITEMS[activity](people));

  // Weather: specific when we have a forecast, a safe default when we don't.
  if (forecast?.length) {
    const max = Math.max(...forecast.map((d) => d.max));
    const min = Math.min(...forecast.map((d) => d.min));
    if (forecast.some((d) => d.rainChance >= RAIN_CHANCE || isRainCode(d.code))) {
      add(['Guarda-chuva', 'Acessórios', 1], ['Casaco impermeável', 'Roupa', people]);
    }
    if (max > HOT) {
      add(
        ['Calções', 'Roupa', Math.min(days, 4) * people],
        ['Óculos de sol', 'Acessórios', people],
        ['Protetor solar', 'Saúde', 1],
      );
    }
    if (min < COLD) {
      add(
        ['Casaco quente', 'Roupa', people],
        ['Gorro', 'Acessórios', people],
        ['Luvas', 'Acessórios', people],
      );
    } else if (min < MILD) {
      add(['Casaco leve', 'Roupa', people]);
    }
  } else {
    add(['Casaco', 'Roupa', people]);
  }

  // The user's own needs (onboarding / Perfil).
  if (conditions.wheelchair) {
    add(
      ['Carregador da cadeira de rodas', 'Saúde', 1],
      ['Kit de reparação da cadeira', 'Saúde', 1],
    );
  }
  if (conditions.allergies.length) {
    add(['Anti-histamínico', 'Saúde', 1], ['Cartão com as alergias', 'Documentos', 1]);
  }
  for (const med of conditions.medication) add([`Medicação: ${med}`, 'Saúde', 1]);
  if (conditions.medication.length) add(['Receitas médicas', 'Documentos', 1]);

  const items = merge(lines).map(([name, category, quantity]): NewOf<PackingItem> => ({
    tripId,
    name,
    category,
    quantity,
    packed: false,
    buyLater: false,
    source: 'generated',
  }));
  return baseReview ? applyHistory(items, baseReview, tripId) : items;
}

/** Same item from several rules → one line with the largest quantity. */
function merge(lines: Line[]): Line[] {
  const byName = new Map<string, Line>();
  for (const line of lines) {
    if (line[2] <= 0) continue;
    const key = line[0].toLowerCase();
    const prev = byName.get(key);
    if (!prev || line[2] > prev[2]) byName.set(key, line);
  }
  return [...byName.values()];
}

/** Forgotten last time → always on the list; over-packed → fewer. */
function applyHistory(
  items: NewOf<PackingItem>[],
  review: Pick<TripReview, 'forgotten' | 'unused'>,
  tripId: string,
): NewOf<PackingItem>[] {
  const find = (name: string) => items.find((i) => i.name.toLowerCase() === name.toLowerCase());
  const result = [...items];

  for (const name of review.forgotten) {
    const existing = find(name);
    if (existing) existing.source = 'history';
    else
      result.push({
        tripId,
        name,
        category: 'Outros',
        quantity: 1,
        packed: false,
        buyLater: false,
        source: 'history',
      });
  }
  for (const { name, qty } of review.unused) {
    const existing = find(name);
    if (existing) existing.quantity = Math.max(1, existing.quantity - qty);
  }
  return result;
}

const ACTIVITY_ITEMS: Record<Activity, (people: number) => Line[]> = {
  hiking: (p) => [
    ['Ténis de caminhada', 'Roupa', p],
    ['Mochila de dia', 'Acessórios', 1],
    ['Garrafa de água', 'Acessórios', p],
    ['Casaco corta-vento', 'Roupa', p],
  ],
  beach: (p) => [
    ['Fato de banho', 'Roupa', p],
    ['Toalha de praia', 'Acessórios', p],
    ['Chinelos', 'Roupa', p],
    ['Protetor solar', 'Saúde', 1],
    ['Óculos de sol', 'Acessórios', p],
  ],
  dinner_out: (p) => [
    ['Roupa para sair', 'Roupa', p],
    ['Sapatos para sair', 'Roupa', p],
  ],
  meeting: () => [
    ['Portátil', 'Eletrónica', 1],
    ['Bloco de notas', 'Outros', 1],
  ],
  museums_formal: (p) => [
    ['Sapatos confortáveis', 'Roupa', p],
    ['Roupa elegante', 'Roupa', p],
  ],
  sport: (p) => [
    ['Equipamento desportivo', 'Roupa', p],
    ['Ténis de desporto', 'Roupa', p],
    ['Garrafa de água', 'Acessórios', p],
  ],
  theme_park: (p) => [
    ['Sapatos confortáveis', 'Roupa', p],
    ['Mochila de dia', 'Acessórios', 1],
    ['Protetor solar', 'Saúde', 1],
  ],
  nightlife: (p) => [
    ['Roupa para sair', 'Roupa', p],
    ['Sapatos para sair', 'Roupa', p],
  ],
};
