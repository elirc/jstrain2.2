// ─────────────────────────────────────────────────────────────────────────
//  30 · hash a password with scrypt                          ★★★ stretch
//  concepts: scrypt · salts · promisify · timing-safe compare
//  run: node 30-scrypt-password.js
// ─────────────────────────────────────────────────────────────────────────
//
//  sha256 is the wrong tool for passwords: it is fast, and fast means a
//  GPU tries billions of guesses a second. scrypt is deliberately slow
//  and memory-hungry, and it takes a per-user random salt so two people
//  with the same password get different hashes.
//
//      await hashPassword('hunter2')
//        → 'scrypt$<32 hex salt>$<64 hex key>'
//      await verifyPassword('hunter2', stored)   → true
//      await verifyPassword('hunter3', stored)   → false
//      await verifyPassword('hunter2', 'garbage') → false   (no throw)
//
//  Store everything you need to check the password later: the scheme, the
//  salt and the derived key. Verifying re-derives the key from the SAME
//  salt and compares the bytes in constant time. A stored value that is
//  not in the format is a false, not an exception.
//
//  hint: crypto.scrypt is callback-style — promisify it once at module
//  level. The salt is not a secret, which is why it lives in plain sight
//  inside the stored string.

import { test, eq, ok } from '../../_lib/check.js';
import { randomBytes, scrypt, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';

// Provided: the cost parameters. N is deliberately small here so the
// tests stay fast — production starts at 16384 and goes up from there.
export const SCRYPT = { N: 2048, r: 8, p: 1, keylen: 32, saltBytes: 16 };

export async function hashPassword(password) {
  throw new Error('TODO');
}

export async function verifyPassword(password, stored) {
  throw new Error('TODO');
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
