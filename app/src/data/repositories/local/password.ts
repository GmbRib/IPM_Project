import { CryptoDigestAlgorithm, digestStringAsync, randomUUID } from 'expo-crypto';

// Prototype-only: a salted SHA-256 so plain passwords never sit in storage.
// A real backend handles passwords on the server.
export async function hashPassword(password: string, salt = randomUUID()) {
  const hash = await digestStringAsync(CryptoDigestAlgorithm.SHA256, `${salt}:${password}`);
  return { salt, hash };
}
