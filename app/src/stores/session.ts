import { create } from 'zustand';

import { ApiError, authToken, forgetLocalData, rpc, snapshotCache } from '@/data/api';
import type { User } from '@/data/types';

import { useData } from './data';
import { useUi } from './ui';

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
  /** Pulls what changed on other phones (called by useLiveSync). */
  refresh(): Promise<void>;
  /** Dev only: everyone's data back to the demo (signs everyone out). */
  resetDemo(): Promise<void>;
};

const isCode = (error: unknown, code: ApiError['code']) =>
  error instanceof ApiError && error.code === code;

async function signIn({ token, user }: { token: string; user: User }) {
  await authToken.save(token);
  await useData.getState().load();
  useSession.setState({ status: 'signedIn', user });
}

async function signOutLocally() {
  await authToken.clear();
  useData.getState().clear();
  useSession.setState({ status: 'signedOut', user: null });
}

export const useSession = create<SessionState>()((set, get) => ({
  status: 'loading',
  user: null,

  async bootstrap() {
    await forgetLocalData().catch(() => {});
    if (!(await authToken.load())) {
      set({ status: 'signedOut' });
      return;
    }
    try {
      set({ status: 'signedIn', user: await useData.getState().load() });
    } catch (error) {
      // No server right now: show the last copy saved on the phone, if there is one.
      const cached = isCode(error, 'network') ? await snapshotCache.read() : null;
      if (cached) {
        useData.getState().applySnapshot(cached);
        useData.getState().setOffline(true);
        set({ status: 'signedIn', user: cached.user });
        // Say so: otherwise the app looks fine until the first change fails.
        useUi.getState().showToast({
          message: 'Sem ligação ao servidor: estás a ver a última cópia guardada.',
        });
      } else if (isCode(error, 'unauthorized')) {
        await signOutLocally();
      } else {
        set({ status: 'signedOut' });
      }
    }
  },

  async register(email, password) {
    await signIn(await rpc('auth.register', { email, password }));
  },

  async login(email, password) {
    await signIn(await rpc('auth.login', { email, password }));
  },

  async logout() {
    await rpc('auth.logout', {}).catch(() => {});
    await signOutLocally();
  },

  async updateUser(patch) {
    if (!get().user) return;
    try {
      set({ user: await rpc('user.update', { patch }) });
    } catch (error) {
      useUi.getState().showToast({
        message: error instanceof ApiError ? error.message : 'Não foi possível guardar.',
      });
      throw error;
    }
  },

  async refresh() {
    if (get().status !== 'signedIn') return;
    try {
      const user = await useData.getState().sync();
      if (user) set({ user });
    } catch (error) {
      if (isCode(error, 'unauthorized')) {
        await signOutLocally();
        useUi.getState().showToast({ message: 'A tua sessão terminou. Entra outra vez.' });
      } else if (isCode(error, 'network') && !useData.getState().offline) {
        useData.getState().setOffline(true);
        useUi.getState().showToast({
          message: 'Sem ligação ao servidor: estás a ver a última cópia guardada.',
        });
      }
    }
  },

  async resetDemo() {
    await rpc('dev.reset', {});
    await signOutLocally();
  },
}));
