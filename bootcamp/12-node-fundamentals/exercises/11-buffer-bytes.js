// ─────────────────────────────────────────────────────────────────────────
//  11 · bytes vs characters                                   ★★☆ core
//  concepts: Buffer.byteLength · code points · Buffer.concat
//  run: node 11-buffer-bytes.js
// ─────────────────────────────────────────────────────────────────────────
//
//  'hello'.length is 5 characters AND 5 bytes. That coincidence is why so
//  much code breaks the first time a customer types an emoji. In utf8 a
//  character is 1–4 bytes, and JS string .length counts UTF-16 units, so
//  three different numbers describe the same string.
//
//      byteLength('café')      → 5      charCount('café')  → 4
//      byteLength('👋')        → 4      charCount('👋')    → 1
//                                       '👋'.length        → 2
//
//      joinBuffers([Buffer.from('ab'), Buffer.from('cd')])
//                              → <Buffer 61 62 63 64>
//      truncateBytes('héllo', 3) → 'hé'   (h=1 byte, é=2 → exactly 3)
//      truncateBytes('a👋b', 3)  → 'a'    (the emoji will not fit)
//
//  truncateBytes must never cut a character in half — better to return
//  fewer bytes than to emit a broken one.
//
//  hint: `for (const ch of text)` iterates whole code points, not UTF-16
//  halves — that is the loop truncateBytes wants.

import { test, eq, ok } from '../../_lib/check.js';

export function byteLength(text) {
  throw new Error('TODO');
}

export function charCount(text) {
  throw new Error('TODO');
}

export function joinBuffers(buffers) {
  throw new Error('TODO');
}

export function truncateBytes(text, maxBytes) {
  throw new Error('TODO');
}

// ──────────────────────────── tests ──────────────────────────────────────

test('for plain ASCII, bytes and characters agree', () => {
  eq(byteLength('hello'), 5);
  eq(charCount('hello'), 5);
});

test('an accented character costs two bytes', () => {
  eq(byteLength('café'), 5);
  eq(charCount('café'), 4);
});

test('an emoji is four bytes, two UTF-16 units, one character', () => {
  eq(byteLength('👋'), 4);
  eq('👋'.length, 2);
  eq(charCount('👋'), 1);
});

test('joinBuffers concatenates into one buffer', () => {
  const joined = joinBuffers([Buffer.from('ab'), Buffer.from('cd')]);
  ok(Buffer.isBuffer(joined));
  eq(joined.toString('utf8'), 'abcd');
});

test('joinBuffers of nothing is an empty buffer', () => {
  eq(joinBuffers([]).length, 0);
});

test('truncateBytes returns the whole string when it fits', () => {
  eq(truncateBytes('hello', 99), 'hello');
  eq(truncateBytes('', 4), '');
});

test('truncateBytes cuts on a character boundary', () => {
  eq(truncateBytes('héllo', 3), 'hé');
  eq(truncateBytes('héllo', 2), 'h');
  eq(byteLength(truncateBytes('héllo', 4)), 4);
});

test('truncateBytes never splits an emoji', () => {
  eq(truncateBytes('a👋b', 3), 'a');
  eq(truncateBytes('a👋b', 5), 'a👋');
});
