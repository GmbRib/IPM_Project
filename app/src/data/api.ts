import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

import type {
  ActionInput,
  ActionName,
  ActionOutput,
  ApiErrorCode,
  Snapshot,
} from '@/server/actions';

// The app's only way to the data: POST /api/rpc on the computer running `npx expo start`
// (src/server). Phones reach it at the address Expo Go loaded the app from, so they must be
// on the same Wi-Fi (or use `npx expo start --tunnel`).

export class ApiError extends Error {
  constructor(
    public code: ApiErrorCode | 'network' | 'server_error',
    message: string,
  ) {
    super(message);
  }
}

/** e.g. http://192.168.1.20:8081. EXPO_PUBLIC_API_URL wins (a server hosted elsewhere). */
function serverUrl() {
  const configured = process.env.EXPO_PUBLIC_API_URL;
  if (configured) return configured.replace(/\/$/, '');
  // The web app is served by the same dev server.
  if (Platform.OS === 'web') return '';
  // The address Expo Go loaded the app from. It's fixed when the app loads: if the computer
  // gets a new IP, the app must be opened again (or open it by the computer's name, e.g. o-meu-mac.local).
  const host = Constants.expoConfig?.hostUri;
  if (!host) return 'http://localhost:8081';
  // `npx expo start --tunnel` gives a host without a port, served over https.
  return `${/:\d+$/.test(host) ? 'http' : 'https'}://${host}`;
}

const TIMEOUT_MS = 10_000;

/** JSON has no `undefined`: send `null`, which the server reads as "clear this field". */
const replacer = (_key: string, value: unknown) => (value === undefined ? null : value);

let token: string | null = null;

export async function rpc<A extends ActionName>(
  action: A,
  input: ActionInput<A>,
): Promise<ActionOutput<A>> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  let response: Response;
  try {
    response = await fetch(`${serverUrl()}/api/rpc`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ action, input }, replacer),
      signal: controller.signal,
    });
  } catch {
    // The address helps a lot when the computer changed network or IP since the app opened.
    const where = serverUrl().replace(/^https?:\/\//, '');
    throw new ApiError(
      'network',
      `Sem ligação ao servidor${where ? ` (${where})` : ''}. Confirma que estás na mesma rede Wi-Fi que o computador; se ele mudou de rede, abre a app outra vez.`,
    );
  } finally {
    clearTimeout(timer);
  }

  const body = (await response.json().catch(() => null)) as {
    data?: ActionOutput<A>;
    error?: { code: ApiErrorCode; message: string };
  } | null;
  if (!response.ok || !body || body.error) {
    throw new ApiError(
      body?.error?.code ?? 'server_error',
      body?.error?.message ?? 'Algo correu mal no servidor.',
    );
  }
  return body.data as ActionOutput<A>;
}

// What stays on the phone: the session token and the last snapshot (shown when offline).

const TOKEN_KEY = 'packsun:token';
const SNAPSHOT_KEY = 'packsun:snapshot';

export const authToken = {
  async load() {
    token = await AsyncStorage.getItem(TOKEN_KEY);
    return token;
  },
  async save(next: string) {
    token = next;
    await AsyncStorage.setItem(TOKEN_KEY, next);
  },
  /** Signing out also forgets the offline copy: it's that person's data. */
  async clear() {
    token = null;
    await AsyncStorage.multiRemove([TOKEN_KEY, SNAPSHOT_KEY]);
  },
};

export const snapshotCache = {
  async read(): Promise<Snapshot | null> {
    try {
      const raw = await AsyncStorage.getItem(SNAPSHOT_KEY);
      return raw ? (JSON.parse(raw) as Snapshot) : null;
    } catch {
      return null;
    }
  },
  async write(snapshot: Snapshot) {
    await AsyncStorage.setItem(SNAPSHOT_KEY, JSON.stringify(snapshot)).catch(() => {});
  },
};

/** Data the app kept on the phone before the server existed (the old local backend). */
export async function forgetLocalData() {
  const keys = await AsyncStorage.getAllKeys();
  await AsyncStorage.multiRemove(keys.filter((k) => k.startsWith('packsun:v1:')));
}
