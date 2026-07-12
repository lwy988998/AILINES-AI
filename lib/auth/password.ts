import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from 'crypto';
import { promisify } from 'util';

const scrypt = promisify(scryptCallback);
const KEY_LENGTH = 64;

export async function hashPassword(password: string) {
  const salt = randomBytes(16).toString('hex');
  const derivedKey = await scrypt(password, salt, KEY_LENGTH) as Buffer;
  return `scrypt$${salt}$${derivedKey.toString('hex')}`;
}

export async function verifyPassword(password: string, passwordHash: string) {
  const [algorithm, salt, storedHash] = passwordHash.split('$');
  if (algorithm !== 'scrypt' || !salt || !storedHash) return false;

  const stored = Buffer.from(storedHash, 'hex');
  if (stored.length !== KEY_LENGTH) return false;

  const derivedKey = await scrypt(password, salt, KEY_LENGTH) as Buffer;
  if (derivedKey.length !== stored.length) return false;
  return timingSafeEqual(derivedKey, stored);
}
