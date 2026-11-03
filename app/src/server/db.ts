import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import path from 'node:path';

import type {
  ID,
  ISODateTime,
  PackingItem,
  TravelDocument,
  Trip,
  TripEvent,
  TripInvite,
  TripMember,
  TripReview,
  User,
} from '@/data/types';

import { buildSeed } from './seed';

// The prototype's "database": one JSON file on the computer running `npx expo start`.
// Every phone on the same Wi-Fi talks to it through the API routes in src/app/api/.

export type StoredUser = User & { salt: string; passwordHash: string };
export type Session = { token: string; userId: ID; createdAt: ISODateTime };

export type Db = {
  /** Goes up on every write; the app sends it back to skip syncs when nothing changed. */
  rev: number;
  users: StoredUser[];
  sessions: Session[];
  documents: TravelDocument[];
  trips: Trip[];
  members: TripMember[];
  invites: TripInvite[];
  packing: PackingItem[];
  events: TripEvent[];
  reviews: TripReview[];
};

/** app/server-data/db.json (git-ignored). Delete it to start again from the demo data. */
export const DB_FILE = process.env.PACKSUN_DB ?? path.join(process.cwd(), 'server-data', 'db.json');

async function load(): Promise<Db> {
  try {
    return JSON.parse(await readFile(DB_FILE, 'utf8')) as Db;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
    const db = buildSeed(new Date());
    await save(db);
    return db;
  }
}

/** Written to a temporary file first, then renamed: a crash never leaves half a file. */
async function save(db: Db) {
  await mkdir(path.dirname(DB_FILE), { recursive: true });
  const tmp = `${DB_FILE}.${process.pid}.tmp`;
  await writeFile(tmp, JSON.stringify(db, null, 2));
  await rename(tmp, DB_FILE);
}

// One request at a time: each one reads the file, works on it and writes it back. Plenty
// for a few phones; a real backend would use a database with transactions. Kept on
// globalThis so a hot reload of this module doesn't start a second queue.
const queue = globalThis as { packsunQueue?: Promise<unknown> };

/** Runs `fn` on a fresh copy of the data; saves it afterwards when `write` is set. */
export function withDb<T>(write: boolean, fn: (db: Db) => T): Promise<T> {
  const run = (queue.packsunQueue ?? Promise.resolve()).then(async () => {
    const db = await load();
    // When `fn` throws, nothing is saved: the half-changed copy is simply dropped.
    const result = fn(db);
    if (write) {
      db.rev += 1;
      await save(db);
    }
    return result;
  });
  queue.packsunQueue = run.catch(() => {});
  return run;
}
