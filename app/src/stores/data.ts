import { create } from 'zustand';

import { ApiError, rpc, snapshotCache } from '@/data/api';
import type {
  ID,
  NewOf,
  PackingItem,
  Role,
  TravelDocument,
  Trip,
  TripEvent,
  TripInvite,
  TripReview,
  User,
} from '@/data/types';
import type { Snapshot } from '@/server/actions';

import { useUi } from './ui';

// What the signed-in user may see, held in memory for the screens. Every change goes to the
// server first (which checks the permissions), then into the in-memory copy. Changes made on
// other phones arrive through sync(), which useLiveSync calls every few seconds.

type Collections = Omit<Snapshot, 'rev' | 'user'>;

type DataState = Collections & {
  /** Server revision of the data shown; null before the first sync. */
  rev: number | null;
  /** True while showing the copy saved on the phone because the server can't be reached. */
  offline: boolean;

  /** Full download (after signing in, or after a change to who is on a trip). Returns the user. */
  load(): Promise<User>;
  /** Changes since the last sync. Returns the user when something changed. */
  sync(): Promise<User | null>;
  applySnapshot(snapshot: Snapshot): void;
  setOffline(offline: boolean): void;
  clear(): void;

  addDocument(data: Omit<NewOf<TravelDocument>, 'userId'>): Promise<TravelDocument>;
  updateDocument(id: ID, patch: Partial<NewOf<TravelDocument>>): Promise<void>;
  removeDocument(id: ID): Promise<void>;

  /**
   * The creator becomes its organiser. Their bag and the suggested events are saved with it,
   * in one request: either everything is created or nothing is.
   */
  addTrip(
    data: Omit<NewOf<Trip>, 'createdBy'>,
    extras?: { items?: NewOf<PackingItem>[]; events?: Omit<NewOf<TripEvent>, 'userId'>[] },
  ): Promise<Trip>;
  updateTrip(id: ID, patch: Partial<NewOf<Trip>>): Promise<void>;
  /** For everyone: also removes every bag, event, code and review of the trip. */
  removeTrip(id: ID): Promise<void>;

  /** Into your own bag, or (organisers) a suggestion into someone else's. */
  addPackingItems(data: NewOf<PackingItem>[]): Promise<PackingItem[]>;
  /** Shown at once (ticking items must feel instant); undone if the server says no. */
  updatePackingItem(id: ID, patch: Partial<NewOf<PackingItem>>): Promise<void>;
  removePackingItem(id: ID): Promise<void>;

  addEvent(data: Omit<NewOf<TripEvent>, 'userId'>): Promise<TripEvent>;
  addEvents(data: Omit<NewOf<TripEvent>, 'userId'>[]): Promise<TripEvent[]>;
  updateEvent(id: ID, patch: Partial<NewOf<TripEvent>>): Promise<void>;
  removeEvent(id: ID): Promise<void>;

  /** One per person per trip: replaces your earlier one. */
  saveReview(data: Omit<NewOf<TripReview>, 'userId'>): Promise<TripReview>;

  // Sharing (src/domain/permissions.ts says who may do what).
  /** The trip's code; `renew` replaces it (the old one stops working). */
  createInvite(tripId: ID, renew?: boolean): Promise<TripInvite>;
  /** Joins with a code and your own bag; returns the trip id. */
  joinTrip(code: string, items: NewOf<PackingItem>[]): Promise<ID>;
  setRole(tripId: ID, userId: ID, role: Exclude<Role, 'owner'>): Promise<void>;
  removeMember(tripId: ID, userId: ID): Promise<void>;
  /** Makes someone else the organiser; you become co-organiser. */
  transferTrip(tripId: ID, userId: ID): Promise<void>;
  leaveTrip(tripId: ID): Promise<void>;
};

const EMPTY: Collections = {
  documents: [],
  trips: [],
  members: [],
  people: [],
  invites: [],
  packing: [],
  events: [],
  reviews: [],
};

const replace = <T extends { id: ID }>(rows: T[], row: T) =>
  rows.map((r) => (r.id === row.id ? row : r));
const without = <T extends { id: ID }>(rows: T[], id: ID) => rows.filter((r) => r.id !== id);

// A sync that raced a write could bring back data from before it: it's dropped instead,
// and the next one (a few seconds later) catches up.
let writesInFlight = 0;
let writeCount = 0;
let syncing = false;

/** Every change goes through here: tells the user when it fails, then rethrows. */
async function write<T>(run: () => Promise<T>): Promise<T> {
  writesInFlight++;
  writeCount++;
  try {
    return await run();
  } catch (error) {
    useUi.getState().showToast({
      message: error instanceof ApiError ? error.message : 'Não foi possível guardar.',
    });
    throw error;
  } finally {
    writesInFlight--;
  }
}

export const useData = create<DataState>()((set, get) => ({
  ...EMPTY,
  rev: null,
  offline: false,

  async load() {
    const snapshot = await rpc('sync', {});
    if ('unchanged' in snapshot) throw new Error('sync: expected a full snapshot');
    get().applySnapshot(snapshot);
    return snapshot.user;
  },

  async sync() {
    if (syncing) return null;
    syncing = true;
    try {
      const startedAt = writeCount;
      const result = await rpc('sync', { rev: get().rev });
      if ('unchanged' in result) {
        if (get().offline) set({ offline: false });
        return null;
      }
      if (writesInFlight > 0 || writeCount !== startedAt) return null;
      get().applySnapshot(result);
      return result.user;
    } finally {
      syncing = false;
    }
  },

  applySnapshot(snapshot) {
    const { rev, user: _user, ...collections } = snapshot;
    set({ ...collections, rev, offline: false });
    void snapshotCache.write(snapshot);
  },

  setOffline(offline) {
    set({ offline });
  },

  clear() {
    set({ ...EMPTY, rev: null, offline: false });
  },

  addDocument: (data) =>
    write(async () => {
      const doc = await rpc('documents.create', { data });
      set((s) => ({ documents: [...s.documents, doc] }));
      return doc;
    }),
  updateDocument: (id, patch) =>
    write(async () => {
      const doc = await rpc('documents.update', { id, patch });
      set((s) => ({ documents: replace(s.documents, doc) }));
    }),
  removeDocument: (id) =>
    write(async () => {
      await rpc('documents.remove', { id });
      set((s) => ({ documents: without(s.documents, id) }));
    }),

  addTrip: (data, extras) =>
    write(async () => {
      const { trip, member, items, events } = await rpc('trips.create', {
        data,
        items: extras?.items,
        events: extras?.events,
      });
      set((s) => ({
        trips: [...s.trips, trip],
        members: [...s.members, member],
        packing: [...s.packing, ...items],
        events: [...s.events, ...events],
      }));
      return trip;
    }),
  updateTrip: (id, patch) =>
    write(async () => {
      const trip = await rpc('trips.update', { id, patch });
      set((s) => ({ trips: replace(s.trips, trip) }));
    }),
  removeTrip: (id) =>
    write(async () => {
      await rpc('trips.remove', { id });
      set((s) => forgetTrip(s, id));
    }),

  addPackingItems: (data) =>
    // Nothing to send: no request (an empty batch is valid, just pointless).
    data.length === 0
      ? Promise.resolve([])
      : write(async () => {
          const created = await rpc('packing.createMany', { items: data });
          set((s) => ({ packing: [...s.packing, ...created] }));
          return created;
        }),
  async updatePackingItem(id, patch) {
    const before = get().packing.find((i) => i.id === id);
    if (!before) return;
    set((s) => ({ packing: replace(s.packing, { ...before, ...patch }) }));
    try {
      const item = await write(() => rpc('packing.update', { id, patch }));
      set((s) => ({ packing: replace(s.packing, item) }));
    } catch {
      set((s) => ({ packing: replace(s.packing, before) }));
    }
  },
  removePackingItem: (id) =>
    write(async () => {
      await rpc('packing.remove', { id });
      set((s) => ({ packing: without(s.packing, id) }));
    }),

  addEvent: async (data) => (await get().addEvents([data]))[0],
  addEvents: (data) =>
    data.length === 0
      ? Promise.resolve([])
      : write(async () => {
          const created = await rpc('events.createMany', { events: data });
          set((s) => ({ events: [...s.events, ...created] }));
          return created;
        }),
  updateEvent: (id, patch) =>
    write(async () => {
      const event = await rpc('events.update', { id, patch });
      set((s) => ({ events: replace(s.events, event) }));
    }),
  removeEvent: (id) =>
    write(async () => {
      await rpc('events.remove', { id });
      set((s) => ({ events: without(s.events, id) }));
    }),

  saveReview: (data) =>
    write(async () => {
      const review = await rpc('reviews.save', { data });
      set((s) => ({ reviews: [...s.reviews.filter((r) => r.tripId !== data.tripId), review] }));
      return review;
    }),

  createInvite: (tripId, renew = false) =>
    write(async () => {
      const invite = await rpc('invites.create', { tripId, renew });
      set((s) => ({ invites: [...s.invites.filter((i) => i.tripId !== tripId), invite] }));
      return invite;
    }),

  // Changes to who is on a trip touch many collections (bags seen, people, codes): they're
  // followed by a full download.
  async joinTrip(code, items) {
    const { tripId } = await write(() => rpc('invites.accept', { code, items }));
    await get().load();
    return tripId;
  },
  async setRole(tripId, userId, role) {
    await write(() => rpc('members.setRole', { tripId, userId, role }));
    await get().load();
  },
  async removeMember(tripId, userId) {
    await write(() => rpc('members.remove', { tripId, userId }));
    await get().load();
  },
  async transferTrip(tripId, userId) {
    await write(() => rpc('members.transfer', { tripId, userId }));
    await get().load();
  },
  async leaveTrip(tripId) {
    await write(() => rpc('trips.leave', { tripId }));
    set((s) => forgetTrip(s, tripId));
    await get().load();
  },
}));

/** Everything of a trip, gone from the in-memory copy. */
function forgetTrip(s: Collections, tripId: ID): Partial<Collections> {
  const other = (row: { tripId?: ID }) => row.tripId !== tripId;
  return {
    trips: without(s.trips, tripId),
    members: s.members.filter(other),
    invites: s.invites.filter(other),
    packing: s.packing.filter(other),
    events: s.events.filter(other),
    reviews: s.reviews.filter(other),
  };
}
