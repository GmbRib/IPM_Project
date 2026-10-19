import { randomUUID } from 'expo-crypto';

import type { User } from '../../types';
import { AuthError, type AuthRepository } from '../types';
import { hashPassword } from './password';
import { ensureSeeded } from './seed';
import { readJSON, removeKey, writeJSON } from './storage';

type StoredUser = User & { salt: string; passwordHash: string };

const normalise = (email: string) => email.trim().toLowerCase();
const publicUser = ({ salt: _salt, passwordHash: _hash, ...user }: StoredUser): User => user;

async function users() {
  await ensureSeeded();
  return readJSON<StoredUser[]>('users', []);
}

async function startSession(user: StoredUser) {
  await writeJSON('session', { userId: user.id });
  return publicUser(user);
}

export const localAuth: AuthRepository = {
  async currentUser() {
    const session = await readJSON<{ userId: string } | null>('session', null);
    if (!session) return null;
    const user = (await users()).find((u) => u.id === session.userId);
    return user ? publicUser(user) : null;
  },

  async register(email, password) {
    const all = await users();
    const normalised = normalise(email);
    if (all.some((u) => u.email === normalised)) {
      throw new AuthError('email_taken', 'Já existe uma conta com este email.');
    }
    const { salt, hash } = await hashPassword(password);
    const user: StoredUser = {
      id: randomUUID(),
      email: normalised,
      name: '',
      conditions: { wheelchair: false, allergies: [], medication: [] },
      onboarded: false,
      createdAt: new Date().toISOString(),
      salt,
      passwordHash: hash,
    };
    await writeJSON('users', [...all, user]);
    return startSession(user);
  },

  async login(email, password) {
    const user = (await users()).find((u) => u.email === normalise(email));
    const hash = user && (await hashPassword(password, user.salt)).hash;
    if (!user || hash !== user.passwordHash) {
      throw new AuthError('invalid_credentials', 'Email ou palavra-passe incorretos.');
    }
    return startSession(user);
  },

  async logout() {
    await removeKey('session');
  },

  async updateUser(id, patch) {
    const all = await users();
    const current = all.find((u) => u.id === id);
    if (!current) throw new Error(`users: ${id} não existe`);
    const updated = { ...current, ...patch };
    await writeJSON(
      'users',
      all.map((u) => (u.id === id ? updated : u)),
    );
    return publicUser(updated);
  },
};
