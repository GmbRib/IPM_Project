import { DEMO_ACCOUNTS, DEMO_PASSWORD } from '@/data/demo';

import type { ActionInput, ActionName, ActionOutput, Snapshot } from '../actions';
import type { Db } from '../db';
import { dispatch } from '../rpc';
import { buildSeed } from '../seed';

// The server's rules, run on the demo data in memory (no file involved).
// Genebra: Teresa organises, Rui co-organises, Pedro participates. Milão: only Teresa.

const GENEBRA = 'demo-trip-genebra';
const MILAO = 'demo-trip-milao';
const [TERESA, RUI, PEDRO] = DEMO_ACCOUNTS.map((a) => a.id);

let db: Db;
beforeEach(() => {
  db = buildSeed(new Date());
});

function call<A extends ActionName>(token: string | null, name: A, input: ActionInput<A>) {
  return dispatch(db, name, JSON.parse(JSON.stringify(input)), token) as ActionOutput<A>;
}

function login(userId: string) {
  const email = DEMO_ACCOUNTS.find((a) => a.id === userId)!.email;
  return call(null, 'auth.login', { email, password: DEMO_PASSWORD }).token;
}

const snap = (token: string) => call(token, 'sync', {}) as Snapshot;
const bagOf = (s: Snapshot, memberId: string, tripId = GENEBRA) =>
  s.packing.filter((i) => i.tripId === tripId && i.memberId === memberId);
const errorOf = (fn: () => unknown) => {
  try {
    fn();
  } catch (error) {
    return (error as { code: string }).code;
  }
  return 'no error';
};

describe('seed', () => {
  it('gives every row its own id', () => {
    for (const rows of [db.users, db.trips, db.members, db.packing, db.events, db.reviews]) {
      const ids = rows.map((r) => r.id);
      expect(new Set(ids).size).toBe(ids.length);
    }
  });
});

describe('auth', () => {
  it('signs in with the demo password and rejects a wrong one', () => {
    expect(login(TERESA)).toEqual(expect.any(String));
    expect(
      errorOf(() => call(null, 'auth.login', { email: 'rui@email.pt', password: 'errada123' })),
    ).toBe('invalid_credentials');
  });

  it('never stores or returns the password', () => {
    expect(JSON.stringify(db)).not.toContain(DEMO_PASSWORD);
    const { user } = call(null, 'auth.register', { email: 'Nova@Email.pt', password: '12345678' });
    expect(user).not.toHaveProperty('passwordHash');
    expect(user.email).toBe('nova@email.pt');
  });

  it('refuses a second account with the same email', () => {
    const again = () =>
      call(null, 'auth.register', { email: 'rui@email.pt', password: '12345678' });
    expect(errorOf(again)).toBe('email_taken');
  });

  it('needs a valid session for everything else', () => {
    expect(errorOf(() => call(null, 'sync', {}))).toBe('unauthorized');
    const token = login(PEDRO);
    call(token, 'auth.logout', {});
    expect(errorOf(() => call(token, 'sync', {}))).toBe('unauthorized');
  });
});

describe('what each role sees', () => {
  it('organisers see every bag of the trip', () => {
    for (const userId of [TERESA, RUI]) {
      const s = snap(login(userId));
      expect(bagOf(s, PEDRO).length).toBeGreaterThan(0);
      expect(bagOf(s, userId === TERESA ? RUI : TERESA).length).toBeGreaterThan(0);
    }
  });

  it('a participant sees only their own bag', () => {
    const s = snap(login(PEDRO));
    expect(s.packing.length).toBeGreaterThan(0);
    expect(s.packing.every((i) => i.memberId === PEDRO)).toBe(true);
  });

  it('nobody sees trips they are not on', () => {
    const s = snap(login(RUI));
    expect(s.trips.map((t) => t.id)).toEqual([GENEBRA]);
    expect(s.events.every((e) => e.tripId === GENEBRA)).toBe(true);
    expect(s.documents.every((d) => d.userId === RUI)).toBe(true);
    expect(s.people.map((p) => p.id).sort()).toEqual([PEDRO, RUI, TERESA].sort());
    expect(s.people[0]).not.toHaveProperty('passwordHash');
  });

  it("participants don't see suggestions waiting for the organisers", () => {
    const pending = (token: string) =>
      snap(token).events.filter((e) => e.tripId === GENEBRA && e.status === 'pending');
    expect(pending(login(RUI))).toHaveLength(1);
    expect(pending(login(PEDRO))).toEqual([]);
    expect(snap(login(PEDRO)).events.map((e) => e.title)).toEqual(['Jantar de família']);
  });

  it('only those who may invite get the trip code', () => {
    expect(snap(login(RUI)).invites.map((i) => i.code)).toEqual(['GENEVA']);
    expect(snap(login(PEDRO)).invites).toEqual([]);
  });

  it('says when nothing changed since the last sync', () => {
    const token = login(PEDRO);
    const { rev } = snap(token);
    expect(call(token, 'sync', { rev })).toEqual({ rev, unchanged: true });
  });
});

describe('bags', () => {
  const pedroItem = () => db.packing.find((i) => i.memberId === PEDRO && !i.suggestedBy)!;

  it('a co-organiser can suggest an item to someone else, who then packs it', () => {
    const rui = login(RUI);
    const [item] = call(rui, 'packing.createMany', {
      items: [
        {
          tripId: GENEBRA,
          memberId: PEDRO,
          name: 'Cachecol',
          category: 'Acessórios',
          quantity: 1,
          packed: true,
          buyLater: false,
          source: 'manual',
        },
      ],
    });
    expect(item).toMatchObject({ memberId: PEDRO, suggestedBy: RUI, packed: false });

    // The suggester may fix the name but not pack it for Pedro.
    expect(call(rui, 'packing.update', { id: item.id, patch: { quantity: 2 } }).quantity).toBe(2);
    expect(
      errorOf(() => call(rui, 'packing.update', { id: item.id, patch: { packed: true } })),
    ).toBe('forbidden');
    expect(
      call(login(PEDRO), 'packing.update', { id: item.id, patch: { packed: true } }).packed,
    ).toBe(true);
  });

  it("a participant can't add to or touch someone else's bag", () => {
    const pedro = login(PEDRO);
    const suggest = () =>
      call(pedro, 'packing.createMany', {
        items: [
          {
            tripId: GENEBRA,
            memberId: TERESA,
            name: 'Chapéu',
            category: 'Acessórios',
            quantity: 1,
            packed: false,
            buyLater: false,
            source: 'manual',
          },
        ],
      });
    expect(errorOf(suggest)).toBe('forbidden');
    const teresaItem = db.packing.find((i) => i.memberId === TERESA && i.tripId === GENEBRA)!;
    expect(errorOf(() => call(pedro, 'packing.remove', { id: teresaItem.id }))).toBe('not_found');
  });

  it("an organiser can look but can't edit what they didn't suggest", () => {
    const teresa = login(TERESA);
    const patch = { patch: { name: 'Outra coisa' } };
    expect(errorOf(() => call(teresa, 'packing.update', { id: pedroItem().id, ...patch }))).toBe(
      'forbidden',
    );
    expect(errorOf(() => call(teresa, 'packing.remove', { id: pedroItem().id }))).toBe('forbidden');
  });

  it('keeps the server-owned fields out of patches', () => {
    const pedro = login(PEDRO);
    const id = pedroItem().id;
    call(pedro, 'packing.update', {
      id,
      patch: { memberId: TERESA, suggestedBy: TERESA } as never,
    });
    expect(db.packing.find((i) => i.id === id)).toMatchObject({ memberId: PEDRO });
    expect(db.packing.find((i) => i.id === id)).not.toHaveProperty('suggestedBy');
  });
});

describe('roles', () => {
  it('only the organiser promotes, and the new co-organiser sees every bag', () => {
    const pedro = login(PEDRO);
    const promote = { tripId: GENEBRA, userId: PEDRO, role: 'admin' as const };
    expect(errorOf(() => call(login(RUI), 'members.setRole', promote))).toBe('forbidden');
    expect(errorOf(() => call(pedro, 'members.setRole', promote))).toBe('forbidden');

    call(login(TERESA), 'members.setRole', promote);
    expect(bagOf(snap(pedro), TERESA).length).toBeGreaterThan(0);
  });

  it('demoting takes the other bags away again', () => {
    const rui = login(RUI);
    call(login(TERESA), 'members.setRole', { tripId: GENEBRA, userId: RUI, role: 'member' });
    expect(snap(rui).packing.every((i) => i.memberId === RUI)).toBe(true);
  });

  it('hands the trip over: the old organiser becomes co-organiser', () => {
    const teresa = login(TERESA);
    call(teresa, 'members.transfer', { tripId: GENEBRA, userId: RUI });
    const roles = snap(teresa).members.filter((m) => m.tripId === GENEBRA);
    expect(Object.fromEntries(roles.map((m) => [m.userId, m.role]))).toEqual({
      [TERESA]: 'admin',
      [RUI]: 'owner',
      [PEDRO]: 'member',
    });
    expect(errorOf(() => call(teresa, 'trips.remove', { id: GENEBRA }))).toBe('forbidden');
  });

  it("the organiser can't leave; others leave and take their bag with them", () => {
    expect(errorOf(() => call(login(TERESA), 'trips.leave', { tripId: GENEBRA }))).toBe(
      'forbidden',
    );
    call(login(RUI), 'trips.leave', { tripId: GENEBRA });
    expect(db.packing.some((i) => i.memberId === RUI)).toBe(false);
    // What Rui suggested to Pedro stays, now as Pedro's own item.
    expect(db.packing.find((i) => i.name === 'Luvas')).not.toHaveProperty('suggestedBy');
    expect(snap(login(TERESA)).members.some((m) => m.userId === RUI)).toBe(false);
  });

  it('only organisers manage the trip events', () => {
    const event = {
      tripId: GENEBRA,
      date: '2026-10-28',
      startTime: '10:00',
      title: 'Museu',
      kind: 'user' as const,
      status: 'accepted' as const,
    };
    expect(errorOf(() => call(login(PEDRO), 'events.createMany', { events: [event] }))).toBe(
      'forbidden',
    );
    const [created] = call(login(RUI), 'events.createMany', { events: [event] });
    expect(snap(login(PEDRO)).events.some((e) => e.id === created.id)).toBe(true);
  });
});

describe('invites', () => {
  function newUser() {
    return call(null, 'auth.register', { email: 'ana@email.pt', password: '12345678' }).token;
  }

  it('previews and joins with a code, bringing their own bag', () => {
    const ana = newUser();
    const preview = call(ana, 'invites.preview', { code: 'geneva' });
    expect(preview).toMatchObject({
      organizer: 'Professora Teresa',
      memberCount: 3,
      alreadyMember: false,
    });
    expect(preview.trip.destination.name).toBe('Genebra');

    call(ana, 'invites.accept', {
      code: 'GENEVA',
      items: [
        {
          name: 'Pijama',
          category: 'Roupa',
          quantity: 1,
          packed: false,
          buyLater: false,
          source: 'generated',
        },
      ],
    });
    const s = snap(ana);
    expect(s.trips.map((t) => t.id)).toEqual([GENEBRA]);
    expect(s.members.find((m) => m.userId === s.user.id)?.role).toBe('member');
    expect(s.packing.map((i) => i.name)).toEqual(['Pijama']);
  });

  it('rejects unknown, expired and renewed codes', () => {
    const ana = newUser();
    expect(errorOf(() => call(ana, 'invites.preview', { code: 'ZZZZZZ' }))).toBe('invalid_code');

    const { code } = call(login(TERESA), 'invites.create', { tripId: GENEBRA, renew: true });
    expect(code).not.toBe('GENEVA');
    expect(errorOf(() => call(ana, 'invites.preview', { code: 'GENEVA' }))).toBe('invalid_code');

    db.invites[0].expiresAt = '2000-01-01T00:00:00.000Z';
    expect(errorOf(() => call(ana, 'invites.preview', { code }))).toBe('invalid_code');
  });

  it('participants cannot create codes', () => {
    expect(errorOf(() => call(login(PEDRO), 'invites.create', { tripId: GENEBRA }))).toBe(
      'forbidden',
    );
    expect(errorOf(() => call(login(RUI), 'invites.create', { tripId: MILAO }))).toBe('not_found');
  });
});

describe('creating a trip', () => {
  const data = {
    destination: { name: 'Genebra', country: 'Suíça', countryCode: 'CH' },
    startDate: '2027-05-02',
    endDate: '2027-05-06',
    adults: 1,
    children: 0,
    purpose: 'work' as const,
    activities: ['meeting' as const],
  };
  const item = {
    name: 'Pijama',
    category: 'Roupa' as const,
    quantity: 1,
    packed: false,
    buyLater: false,
    source: 'generated' as const,
  };

  it('saves the trip, the bag and the events together, even with no suggestions', () => {
    const pedro = login(PEDRO);
    const { trip, member, items, events } = call(pedro, 'trips.create', {
      data,
      items: [item],
      events: [],
    });
    expect(member.role).toBe('owner');
    expect(items).toEqual([expect.objectContaining({ tripId: trip.id, memberId: PEDRO })]);
    expect(events).toEqual([]);
    expect(snap(pedro).trips.map((t) => t.id)).toContain(trip.id);
  });

  it('creates nothing when part of it is invalid', () => {
    const before = db.trips.length;
    const bad = () =>
      call(login(PEDRO), 'trips.create', { data, items: [{ ...item, quantity: 500 }] });
    expect(errorOf(bad)).toBe('bad_request');
    expect(db.trips).toHaveLength(before);
  });

  it('accepts empty batches', () => {
    expect(call(login(PEDRO), 'events.createMany', { events: [] })).toEqual([]);
    expect(call(login(PEDRO), 'packing.createMany', { items: [] })).toEqual([]);
  });
});

describe('deleting a trip', () => {
  it('removes it for everyone, with every bag', () => {
    expect(errorOf(() => call(login(RUI), 'trips.remove', { id: GENEBRA }))).toBe('forbidden');
    call(login(TERESA), 'trips.remove', { id: GENEBRA });
    expect(snap(login(PEDRO)).trips).toEqual([]);
    expect(db.packing.some((i) => i.tripId === GENEBRA)).toBe(false);
    expect(db.members.some((m) => m.tripId === GENEBRA)).toBe(false);
  });
});

describe('patches', () => {
  it('null clears an optional field; a missing key keeps it', () => {
    const teresa = login(TERESA);
    const id = 'demo-event-reuniao';
    call(teresa, 'events.update', { id, patch: { title: 'Reunião' } });
    expect(db.events.find((e) => e.id === id)?.endTime).toBe('12:00');
    call(teresa, 'events.update', { id, patch: { endTime: null } });
    expect(db.events.find((e) => e.id === id)).not.toHaveProperty('endTime');
  });
});
