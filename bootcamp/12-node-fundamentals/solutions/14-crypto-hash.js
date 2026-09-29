// ─────────────────────────────────────────────────────────────────────────
//  14 · hashing and ids — SOLUTION                            ★★☆ core
//  run: node 14-crypto-hash.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: createHash returns a one-shot object — update() feeds it
//  (as many times as you like, which is how you hash a whole stream) and
//  digest() closes it. Calling digest twice on the same hash throws, so
//  build a fresh one per call rather than caching it in a module const.
//  Because update() accepts strings and Buffers alike, 'abc' and
//  Buffer.from('abc') land on the same digest with no branching.
//  sameContent hashes both sides instead of comparing them directly —
//  pointless for two short strings, but the same three lines work when
//  the inputs are two 2 GB files you never want in memory at once.
//  The uuid regex is anchored at both ends; without ^ and $ the "near
//  miss" cases pass because a valid uuid sits inside them.

import { test, eq, ok } from '../../_lib/check.js';
import { createHash, randomUUID } from 'node:crypto';

export function sha256(input) {
  return createHash('sha256').update(input).digest('hex');
}

export function sameContent(a, b) {
  return sha256(a) === sha256(b);
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

export function isUuid(value) {
  return typeof value === 'string' && UUID_RE.test(value);
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
