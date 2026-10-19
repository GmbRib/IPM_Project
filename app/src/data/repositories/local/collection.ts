import { randomUUID } from 'expo-crypto';

import type { ID, NewOf } from '../../types';
import type { CollectionRepository } from '../types';
import { ensureSeeded } from './seed';
import { readJSON, writeJSON, type TableName } from './storage';

/**
 * A collection stored as one JSON array. The array is read once, kept in memory,
 * and written back whole after every change: fine for prototype-sized data.
 */
export function createLocalCollection<T extends { id: ID }, Owner extends keyof T>(
  table: TableName,
  { timestamps = false } = {},
): CollectionRepository<T, Owner> & { invalidate(): void } {
  let rows: T[] | null = null;

  async function load() {
    if (!rows) {
      await ensureSeeded();
      rows = await readJSON<T[]>(table, []);
    }
    return rows;
  }

  async function save(next: T[]) {
    rows = next;
    await writeJSON(table, next);
  }

  function build(data: NewOf<T>): T {
    return {
      ...data,
      id: randomUUID(),
      ...(timestamps ? { createdAt: new Date().toISOString() } : {}),
    } as unknown as T;
  }

  return {
    async listBy(owner, ownerId) {
      return (await load()).filter((r) => r[owner] === ownerId);
    },
    async get(id) {
      return (await load()).find((r) => r.id === id) ?? null;
    },
    async create(data) {
      const row = build(data);
      await save([...(await load()), row]);
      return row;
    },
    async createMany(data) {
      const created = data.map(build);
      await save([...(await load()), ...created]);
      return created;
    },
    async update(id, patch) {
      const all = await load();
      const current = all.find((r) => r.id === id);
      if (!current) throw new Error(`${table}: ${id} não existe`);
      const updated = { ...current, ...patch };
      await save(all.map((r) => (r.id === id ? updated : r)));
      return updated;
    },
    async remove(id) {
      await save((await load()).filter((r) => r.id !== id));
    },
    async removeBy(owner, ownerId) {
      await save((await load()).filter((r) => r[owner] !== ownerId));
    },
    /** Drops the in-memory copy so the next call re-reads storage. */
    invalidate() {
      rows = null;
    },
  };
}
