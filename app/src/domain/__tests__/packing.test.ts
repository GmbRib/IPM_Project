import { generatePackingList, tripDays, type PackingInput } from '../packing';

const base: PackingInput = {
  trip: {
    startDate: '2026-10-27',
    endDate: '2026-11-02',
    adults: 1,
    children: 0,
    purpose: 'leisure',
    activities: [],
    destination: { name: 'Genebra', country: 'Suíça', countryCode: 'CH', lat: 46.2, lon: 6.1 },
  },
  conditions: { wheelchair: false, allergies: [], medication: [] },
};

const names = (input: PackingInput) => generatePackingList(input, 't1').map((i) => i.name);
const qty = (input: PackingInput, name: string) =>
  generatePackingList(input, 't1').find((i) => i.name === name)?.quantity;

describe('generatePackingList', () => {
  it('counts trip days inclusively', () => {
    expect(tripDays({ startDate: '2026-10-20', endDate: '2026-10-22' })).toBe(3);
  });

  it('always includes the basics, tied to the trip', () => {
    const items = generatePackingList(base, 't1');
    expect(items.every((i) => i.tripId === 't1' && !i.packed && i.source === 'generated')).toBe(
      true,
    );
    expect(names(base)).toEqual(
      expect.arrayContaining(['Escova de dentes', 'Roupa interior', 'Pijama']),
    );
  });

  it('scales clothes with days and people, capped at a week', () => {
    expect(qty(base, 'Roupa interior')).toBe(8); // 7 days + 1
    const twoPeople = { ...base, trip: { ...base.trip, adults: 2 } };
    expect(qty(twoPeople, 'Roupa interior')).toBe(16);
    const month = { ...base, trip: { ...base.trip, endDate: '2026-11-30' } };
    expect(qty(month, 'Meias')).toBe(7);
  });

  it('picks the citizen card in Schengen and the passport outside it', () => {
    expect(names(base)).toContain('Cartão de Cidadão');
    const uk = {
      ...base,
      trip: { ...base.trip, destination: { ...base.trip.destination, countryCode: 'GB' } },
    };
    expect(names(uk)).toEqual(expect.arrayContaining(['Passaporte', 'Adaptador de tomada']));
    expect(names(uk)).not.toContain('Cartão de Cidadão');
  });

  it('adds work and activity items without duplicates', () => {
    const work = {
      ...base,
      trip: {
        ...base.trip,
        purpose: 'work' as const,
        activities: ['meeting' as const, 'sport' as const, 'hiking' as const],
      },
    };
    const list = names(work);
    expect(list).toEqual(
      expect.arrayContaining(['Portátil', 'Cartões de visita', 'Ténis de caminhada']),
    );
    expect(list.filter((n) => n === 'Portátil')).toHaveLength(1);
    expect(list.filter((n) => n === 'Garrafa de água')).toHaveLength(1);
  });

  it('adds children items only with children', () => {
    expect(names(base)).not.toContain('Toalhitas');
    const family = { ...base, trip: { ...base.trip, adults: 2, children: 1 } };
    expect(names(family)).toContain('Toalhitas');
    expect(qty(family, 'Escova de dentes')).toBe(3);
  });

  it('follows the forecast, or packs a coat when there is none', () => {
    expect(names(base)).toContain('Casaco');
    const day = { date: '2026-10-27', code: 61, max: 28, min: 5, rainChance: 80, wind: 10, uv: 3 };
    const list = names({ ...base, forecast: [day] });
    expect(list).toEqual(
      expect.arrayContaining([
        'Guarda-chuva',
        'Casaco impermeável',
        'Calções',
        'Protetor solar',
        'Gorro',
      ]),
    );
    expect(list).not.toContain('Casaco');
  });

  it('treats a rain weather code as rain even with a low rain chance, and packs a light jacket for cool nights', () => {
    const day = { date: '2026-10-22', code: 61, max: 19, min: 14, rainChance: 30, wind: 10, uv: 3 };
    expect(names({ ...base, forecast: [day] })).toEqual(
      expect.arrayContaining(['Guarda-chuva', 'Casaco leve']),
    );
  });

  it("packs for the user's conditions", () => {
    const list = names({
      ...base,
      conditions: { wheelchair: true, allergies: ['Pólen'], medication: ['Insulina'] },
    });
    expect(list).toEqual(
      expect.arrayContaining([
        'Carregador da cadeira de rodas',
        'Anti-histamínico',
        'Medicação: Insulina',
        'Receitas médicas',
      ]),
    );
  });

  it('learns from the base trip: forgotten items in, over-packed items down', () => {
    const input = {
      ...base,
      baseReview: {
        forgotten: ['Carregador do telemóvel', 'Tampões para os ouvidos'],
        unused: [{ name: 'T-shirt', qty: 3 }],
      },
    };
    const items = generatePackingList(input, 't1');
    expect(items.find((i) => i.name === 'Carregador do telemóvel')?.source).toBe('history');
    expect(items.find((i) => i.name === 'Tampões para os ouvidos')).toMatchObject({
      source: 'history',
      quantity: 1,
    });
    expect(items.find((i) => i.name === 'T-shirt')?.quantity).toBe(4);
  });
});
