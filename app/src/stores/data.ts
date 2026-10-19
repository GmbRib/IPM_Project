import { create } from 'zustand';

import { repos } from '@/data/repositories';
import type {
  ID,
  NewOf,
  PackingItem,
  TravelDocument,
  Trip,
  TripEvent,
  TripReview,
} from '@/data/types';

// The signed-in user's data, held in memory for the screens. Every action writes
// through the repositories first, then updates the in-memory copy.

type Collections = {
  documents: TravelDocument[];
  trips: Trip[];
  packing: PackingItem[];
  events: TripEvent[];
  reviews: TripReview[];
};

type DataState = Collections & {
  loadedFor: ID | null;
  load(userId: ID): Promise<void>;
  clear(): void;

  addDocument(data: NewOf<TravelDocument>): Promise<TravelDocument>;
  updateDocument(id: ID, patch: Partial<NewOf<TravelDocument>>): Promise<void>;
  removeDocument(id: ID): Promise<void>;

  addTrip(data: NewOf<Trip>): Promise<Trip>;
  updateTrip(id: ID, patch: Partial<NewOf<Trip>>): Promise<void>;
  /** Also removes the trip's packing items, events and review. */
  removeTrip(id: ID): Promise<void>;

  addPackingItems(data: NewOf<PackingItem>[]): Promise<PackingItem[]>;
  updatePackingItem(id: ID, patch: Partial<NewOf<PackingItem>>): Promise<void>;
  removePackingItem(id: ID): Promise<void>;

  addEvent(data: NewOf<TripEvent>): Promise<TripEvent>;
  addEvents(data: NewOf<TripEvent>[]): Promise<TripEvent[]>;
  updateEvent(id: ID, patch: Partial<NewOf<TripEvent>>): Promise<void>;
  removeEvent(id: ID): Promise<void>;

  saveReview(data: NewOf<TripReview>): Promise<TripReview>;
};

const EMPTY: Collections = { documents: [], trips: [], packing: [], events: [], reviews: [] };

const replace = <T extends { id: ID }>(rows: T[], row: T) =>
  rows.map((r) => (r.id === row.id ? row : r));
const without = <T extends { id: ID }>(rows: T[], id: ID) => rows.filter((r) => r.id !== id);

export const useData = create<DataState>()((set, get) => ({
  ...EMPTY,
  loadedFor: null,

  async load(userId) {
    const [documents, trips, events] = await Promise.all([
      repos.documents.listBy('userId', userId),
      repos.trips.listBy('userId', userId),
      repos.events.listBy('userId', userId),
    ]);
    const perTrip = await Promise.all(
      trips.map((t) =>
        Promise.all([repos.packing.listBy('tripId', t.id), repos.reviews.listBy('tripId', t.id)]),
      ),
    );
    set({
      documents,
      trips,
      events,
      packing: perTrip.flatMap(([p]) => p),
      reviews: perTrip.flatMap(([, r]) => r),
      loadedFor: userId,
    });
  },

  clear() {
    set({ ...EMPTY, loadedFor: null });
  },

  async addDocument(data) {
    const doc = await repos.documents.create(data);
    set((s) => ({ documents: [...s.documents, doc] }));
    return doc;
  },
  async updateDocument(id, patch) {
    const doc = await repos.documents.update(id, patch);
    set((s) => ({ documents: replace(s.documents, doc) }));
  },
  async removeDocument(id) {
    await repos.documents.remove(id);
    set((s) => ({ documents: without(s.documents, id) }));
  },

  async addTrip(data) {
    const trip = await repos.trips.create(data);
    set((s) => ({ trips: [...s.trips, trip] }));
    return trip;
  },
  async updateTrip(id, patch) {
    const trip = await repos.trips.update(id, patch);
    set((s) => ({ trips: replace(s.trips, trip) }));
  },
  async removeTrip(id) {
    await Promise.all([
      repos.packing.removeBy('tripId', id),
      repos.events.removeBy('tripId', id),
      repos.reviews.removeBy('tripId', id),
    ]);
    await repos.trips.remove(id);
    set((s) => ({
      trips: without(s.trips, id),
      packing: s.packing.filter((p) => p.tripId !== id),
      events: s.events.filter((e) => e.tripId !== id),
      reviews: s.reviews.filter((r) => r.tripId !== id),
    }));
  },

  async addPackingItems(data) {
    const created = await repos.packing.createMany(data);
    set((s) => ({ packing: [...s.packing, ...created] }));
    return created;
  },
  async updatePackingItem(id, patch) {
    const item = await repos.packing.update(id, patch);
    set((s) => ({ packing: replace(s.packing, item) }));
  },
  async removePackingItem(id) {
    await repos.packing.remove(id);
    set((s) => ({ packing: without(s.packing, id) }));
  },

  async addEvent(data) {
    const event = await repos.events.create(data);
    set((s) => ({ events: [...s.events, event] }));
    return event;
  },
  async addEvents(data) {
    const created = await repos.events.createMany(data);
    set((s) => ({ events: [...s.events, ...created] }));
    return created;
  },
  async updateEvent(id, patch) {
    const event = await repos.events.update(id, patch);
    set((s) => ({ events: replace(s.events, event) }));
  },
  async removeEvent(id) {
    await repos.events.remove(id);
    set((s) => ({ events: without(s.events, id) }));
  },

  async saveReview(data) {
    // One review per trip: replace any earlier one.
    const existing = get().reviews.find((r) => r.tripId === data.tripId);
    if (existing) await repos.reviews.remove(existing.id);
    const review = await repos.reviews.create(data);
    set((s) => ({ reviews: [...s.reviews.filter((r) => r.tripId !== data.tripId), review] }));
    return review;
  },
}));
