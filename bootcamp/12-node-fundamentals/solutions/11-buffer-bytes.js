// ─────────────────────────────────────────────────────────────────────────
//  11 · bytes vs characters — SOLUTION                        ★★☆ core
//  run: node 11-buffer-bytes.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: Buffer.byteLength(text) answers "how big on the wire?"
//  without allocating a buffer — that is the number a Content-Length
//  header or a column limit actually cares about.
//  charCount spreads the string, because the string iterator walks code
//  points and glues surrogate pairs back together; text.length would say
//  '👋' is two.
//  truncateBytes adds one whole code point at a time and stops before it
//  would overflow, so the output is always valid utf8. The classic wrong
//  turn — Buffer.from(text).subarray(0, max).toString() — chops the last
//  character in half and leaves a U+FFFD replacement mark behind.

import { test, eq, ok } from '../../_lib/check.js';

export function byteLength(text) {
  return Buffer.byteLength(text, 'utf8');
}

export function charCount(text) {
  return [...text].length;
}

export function joinBuffers(buffers) {
  return Buffer.concat(buffers);
}

export function truncateBytes(text, maxBytes) {
  let out = '';
  let used = 0;
  for (const ch of text) {
    const size = Buffer.byteLength(ch, 'utf8');
    if (used + size > maxBytes) break;
    out += ch;
    used += size;
  }
  return out;
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
