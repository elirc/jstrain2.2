// ─────────────────────────────────────────────────────────────────────────
//  30 · hash a password with scrypt — SOLUTION               ★★★ stretch
//  run: node 30-scrypt-password.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: the stored string is a self-describing record —
//  scheme$salt$key. Keeping the scheme in it is what lets you raise the
//  cost parameters next year without locking every existing user out:
//  new hashes say scrypt2, old ones still say scrypt.
//  The salt is generated per hash with randomBytes, which is why hashing
//  the same password twice gives two different strings; that is a feature
//  (it kills rainbow tables) and it is why you cannot verify by hashing
//  and comparing strings — you must re-derive with the STORED salt.
//  verifyPassword validates the shape before it does any work: the wrong
//  number of fields, a salt of the wrong size, junk hex — all false, no
//  exception, because a login route must not 500 on a bad cookie.
//  The final compare is timingSafeEqual on the raw key bytes, same reason
//  as exercise 29. The classic wrong turn is sha256 with no salt: fast,
//  reversible by lookup table, and it looks exactly as correct in tests.

import { test, eq, ok } from '../../_lib/check.js';
import { randomBytes, scrypt, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';

// Provided: the cost parameters. N is deliberately small here so the
// tests stay fast — production starts at 16384 and goes up from there.
export const SCRYPT = { N: 2048, r: 8, p: 1, keylen: 32, saltBytes: 16 };

const scryptAsync = promisify(scrypt);
const cost = { N: SCRYPT.N, r: SCRYPT.r, p: SCRYPT.p };

export async function hashPassword(password) {
  const salt = randomBytes(SCRYPT.saltBytes);
  const key = await scryptAsync(password, salt, SCRYPT.keylen, cost);
  return `scrypt$${salt.toString('hex')}$${key.toString('hex')}`;
}

export async function verifyPassword(password, stored) {
  const parts = String(stored ?? '').split('$');
  if (parts.length !== 3 || parts[0] !== 'scrypt') return false;

  const salt = Buffer.from(parts[1], 'hex');
  const expected = Buffer.from(parts[2], 'hex');
  if (salt.length !== SCRYPT.saltBytes) return false;
  if (expected.length !== SCRYPT.keylen) return false;

  const actual = await scryptAsync(password, salt, SCRYPT.keylen, cost);
  return timingSafeEqual(expected, actual);
}

// ──────────────────────────── tests ──────────────────────────────────────

test('the stored value carries the scheme, the salt and the key', async () => {
  const stored = await hashPassword('hunter2');
  const [scheme, salt, key] = stored.split('$');
  eq(scheme, 'scrypt');
  eq(salt.length, SCRYPT.saltBytes * 2);
  eq(key.length, SCRYPT.keylen * 2);
  ok(/^[0-9a-f]+$/.test(salt + key));
});

test('the same password hashes differently every time', async () => {
  const a = await hashPassword('hunter2');
  const b = await hashPassword('hunter2');
  ok(a !== b, 'a random salt per hash is the whole point');
});

test('the right password verifies', async () => {
  const stored = await hashPassword('correct horse battery staple');
  eq(await verifyPassword('correct horse battery staple', stored), true);
});

test('the wrong password does not', async () => {
  const stored = await hashPassword('hunter2');
  eq(await verifyPassword('hunter3', stored), false);
  eq(await verifyPassword('', stored), false);
});

test('a swapped salt breaks the hash', async () => {
  const mine = await hashPassword('hunter2');
  const other = await hashPassword('hunter2');
  const [, , key] = mine.split('$');
  const [, otherSalt] = other.split('$');
  eq(await verifyPassword('hunter2', `scrypt$${otherSalt}$${key}`), false);
});

test('a malformed stored value is false, not a crash', async () => {
  eq(await verifyPassword('hunter2', 'garbage'), false);
  eq(await verifyPassword('hunter2', ''), false);
  eq(await verifyPassword('hunter2', 'scrypt$ab$cd'), false);
  eq(await verifyPassword('hunter2', undefined), false);
});

test('unicode passwords survive the round trip', async () => {
  const stored = await hashPassword('pässwörd-👋');
  eq(await verifyPassword('pässwörd-👋', stored), true);
  eq(await verifyPassword('passwörd-👋', stored), false);
});
