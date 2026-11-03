import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';

// Passwords never reach the JSON file: only a salted scrypt hash does.

export function hashPassword(password: string, salt = randomBytes(16).toString('hex')) {
  return { salt, passwordHash: scryptSync(password, salt, 32).toString('hex') };
}

export function checkPassword(password: string, user: { salt: string; passwordHash: string }) {
  const given = Buffer.from(hashPassword(password, user.salt).passwordHash, 'hex');
  const stored = Buffer.from(user.passwordHash, 'hex');
  return given.length === stored.length && timingSafeEqual(given, stored);
}

/** Session token the app sends as "Authorization: Bearer …". */
export const newToken = () => randomBytes(24).toString('base64url');
