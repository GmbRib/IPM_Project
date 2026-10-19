import type {
  ID,
  NewOf,
  PackingItem,
  TravelDocument,
  Trip,
  TripEvent,
  TripReview,
  User,
} from '../types';

// The only contract the rest of the app knows. Each backend (local today; Supabase,
// Firebase, SQLite… later) implements these and is picked in repositories/index.ts.
// Everything is async so a network backend fits without touching callers.

export class AuthError extends Error {
  constructor(
    public code: 'email_taken' | 'invalid_credentials',
    message: string,
  ) {
    super(message);
  }
}

export interface AuthRepository {
  /** User of the saved session, or null when signed out. */
  currentUser(): Promise<User | null>;
  register(email: string, password: string): Promise<User>;
  login(email: string, password: string): Promise<User>;
  logout(): Promise<void>;
  updateUser(id: ID, patch: Partial<Omit<User, 'id' | 'email' | 'createdAt'>>): Promise<User>;
}

/** CRUD for a collection owned by something (a user or a trip). */
export interface CollectionRepository<T extends { id: ID }, Owner extends keyof T> {
  listBy(owner: Owner, ownerId: ID): Promise<T[]>;
  get(id: ID): Promise<T | null>;
  create(data: NewOf<T>): Promise<T>;
  createMany(data: NewOf<T>[]): Promise<T[]>;
  update(id: ID, patch: Partial<NewOf<T>>): Promise<T>;
  remove(id: ID): Promise<void>;
  removeBy(owner: Owner, ownerId: ID): Promise<void>;
}

export type Repositories = {
  auth: AuthRepository;
  documents: CollectionRepository<TravelDocument, 'userId'>;
  trips: CollectionRepository<Trip, 'userId'>;
  packing: CollectionRepository<PackingItem, 'tripId'>;
  events: CollectionRepository<TripEvent, 'userId' | 'tripId'>;
  reviews: CollectionRepository<TripReview, 'tripId'>;
  /** Wipes everything and loads the demo data again (dev only). */
  resetToDemo(): Promise<void>;
};
