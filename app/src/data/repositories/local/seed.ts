import { buildDemoData } from '../../seed';
import { hashPassword } from './password';
import { readJSON, removeKey, TABLES, writeJSON } from './storage';

let seeding: Promise<void> | null = null;

/** Seeds the demo data on the very first launch. Safe to call many times. */
export function ensureSeeded() {
  seeding ??= (async () => {
    if (await readJSON('seeded', false)) return;
    await writeDemoData();
  })();
  return seeding;
}

/** Replaces all stored data with a fresh copy of the demo data. */
export async function writeDemoData() {
  await Promise.all([...TABLES.map(removeKey), removeKey('session')]);
  const demo = buildDemoData(new Date());
  const users = await Promise.all(
    demo.users.map(async ({ password, ...user }) => {
      const { salt, hash } = await hashPassword(password);
      return { ...user, salt, passwordHash: hash };
    }),
  );
  await Promise.all([
    writeJSON('users', users),
    writeJSON('documents', demo.documents),
    writeJSON('trips', demo.trips),
    writeJSON('packing', demo.packing),
    writeJSON('events', demo.events),
    writeJSON('reviews', demo.reviews),
    writeJSON('seeded', true),
  ]);
}
