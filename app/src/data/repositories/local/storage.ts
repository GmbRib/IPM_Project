import AsyncStorage from '@react-native-async-storage/async-storage';

// Raw key/value access for the local backend. AsyncStorage is localStorage on web.
// Bump VERSION when the stored shape changes; old data is then ignored.
const VERSION = 'v1';
const key = (name: string) => `packsun:${VERSION}:${name}`;

export const TABLES = ['users', 'documents', 'trips', 'packing', 'events', 'reviews'] as const;
export type TableName = (typeof TABLES)[number];

export async function readJSON<T>(name: string, fallback: T): Promise<T> {
  const raw = await AsyncStorage.getItem(key(name));
  return raw ? (JSON.parse(raw) as T) : fallback;
}

export async function writeJSON(name: string, value: unknown) {
  await AsyncStorage.setItem(key(name), JSON.stringify(value));
}

export async function removeKey(name: string) {
  await AsyncStorage.removeItem(key(name));
}
