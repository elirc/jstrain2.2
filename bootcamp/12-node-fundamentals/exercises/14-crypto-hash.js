// ─────────────────────────────────────────────────────────────────────────
//  14 · hashing and ids                                       ★★☆ core
//  concepts: node:crypto · createHash · randomUUID
//  run: node 14-crypto-hash.js
// ─────────────────────────────────────────────────────────────────────────
//
//  A content hash is a short fingerprint of any amount of data: same
//  bytes in, same 64 hex characters out; one byte different, a completely
//  different string. That is how build tools know a file changed and how
//  caches know they can skip work.
//
//      sha256('abc')  → 'ba7816bf8f01cfea414140de5dae2223…'  (64 hex)
//      sha256(Buffer.from('abc'))   → the same digest
//      sameContent('a', 'a')        → true
//      isUuid(randomUUID())         → true
//      isUuid('not-a-uuid')         → false
//
//  isUuid checks the SHAPE of a v4 uuid: 8-4-4-4-12 lowercase hex
//  digits, a '4' starting the third group and one of 8/9/a/b starting
//  the fourth.
//
//  hint: createHash('sha256').update(input).digest('hex') — update takes
//  a string or a Buffer, so sha256 needs no branching.

import { test, eq, ok } from '../../_lib/check.js';
import { createHash, randomUUID } from 'node:crypto';

export function sha256(input) {
  throw new Error('TODO');
}

export function sameContent(a, b) {
  throw new Error('TODO');
}

export function isUuid(value) {
  throw new Error('TODO');
}

// ──────────────────────────── tests ──────────────────────────────────────

test('matches the published sha256 of "abc"', () => {
  eq(sha256('abc'), 'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad');
});

test('a digest is 64 lowercase hex characters', () => {
  const digest = sha256('anything at all');
  eq(digest.length, 64);
  ok(/^[0-9a-f]{64}$/.test(digest));
});

test('the same input always gives the same digest', () => {
  eq(sha256('deploy me'), sha256('deploy me'));
});

test('one changed character changes everything', () => {
  ok(sha256('version 1') !== sha256('version 2'));
});

test('a Buffer hashes the same as the string it holds', () => {
  eq(sha256(Buffer.from('abc', 'utf8')), sha256('abc'));
});

test('sameContent compares by digest', () => {
  eq(sameContent('the same text', 'the same text'), true);
  eq(sameContent('the same text', 'the same text!'), false);
});

test('isUuid accepts what randomUUID produces', () => {
  eq(isUuid(randomUUID()), true);
  eq(isUuid('7d4881b6-1a1a-4b5e-8f1e-2c3d4e5f6a7b'), true);
});

test('isUuid rejects near misses', () => {
  eq(isUuid('not-a-uuid'), false);
  eq(isUuid(''), false);
  eq(isUuid('7d4881b6-1a1a-4b5e-8f1e-2c3d4e5f6a7'), false);
});
