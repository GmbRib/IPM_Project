import { create } from 'zustand';

import { repos } from '@/data/repositories';
import type { User } from '@/data/types';

import { useData } from './data';

type Status = 'loading' | 'signedOut' | 'signedIn';

type SessionState = {
  status: Status;
  user: User | null;
  /** Restores the saved session on app start. */
  bootstrap(): Promise<void>;
  register(email: string, password: string): Promise<void>;
  login(email: string, password: string): Promise<void>;
  logout(): Promise<void>;
  updateUser(
    patch: Partial<Pick<User, 'name' | 'conditions' | 'onboarded' | 'settings'>>,
  ): Promise<void>;
  /** Dev only: wipe everything and reload the demo data (signs out). */
  resetDemo(): Promise<void>;
};

async function signIn(user: User) {
  await useData.getState().load(user.id);
  useSession.setState({ status: 'signedIn', user });
}

export const useSession = create<SessionState>()((set, get) => ({
  status: 'loading',
  user: null,

  async bootstrap() {
    const user = await repos.auth.currentUser();
    if (user) await signIn(user);
    else set({ status: 'signedOut' });
  },

  async register(email, password) {
    await signIn(await repos.auth.register(email, password));
  },

  async login(email, password) {
    await signIn(await repos.auth.login(email, password));
  },

  async logout() {
    await repos.auth.logout();
    useData.getState().clear();
    set({ status: 'signedOut', user: null });
  },

  async updateUser(patch) {
    const { user } = get();
    if (!user) return;
    set({ user: await repos.auth.updateUser(user.id, patch) });
  },

  async resetDemo() {
    await repos.resetToDemo();
    useData.getState().clear();
    set({ status: 'signedOut', user: null });
  },
}));
