// ─────────────────────────────────────────────────────────────────────────
//  20 · gzip round trip                                       ★★☆ core
//  concepts: node:zlib · promisify · magic bytes
//  run: node 20-zlib-gzip.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Most of zlib still speaks callbacks: gzip(buffer, (err, result) => …).
//  util.promisify converts any function with that (err, result) shape
//  into one that returns a promise — a technique that outlives zlib.
//
//      const packed = await gzipText('hello hello hello');
//      packed                       → a Buffer, starting 1f 8b
//      await gunzipText(packed)     → 'hello hello hello'
//      isGzip(packed)               → true
//      isGzip(Buffer.from('hello')) → false
//
//  Every gzip stream starts with the two magic bytes 0x1f 0x8b — that is
//  how `file` and every HTTP client recognise one.
//
//  hint: import { gzip, gunzip } from 'node:zlib' and wrap each with
//  promisify from 'node:util' once, at module level.

import { test, eq, ok, rejects } from '../../_lib/check.js';
import { gzip, gunzip } from 'node:zlib';
import { promisify } from 'node:util';

export async function gzipText(text) {
  throw new Error('TODO');
}

export async function gunzipText(buffer) {
  throw new Error('TODO');
}

export function isGzip(buffer) {
  throw new Error('TODO');
}

// ──────────────────────────── tests ──────────────────────────────────────

test('round trips a string', async () => {
  const text = 'the quick brown fox jumps over the lazy dog';
  eq(await gunzipText(await gzipText(text)), text);
});

test('gzipText resolves with a Buffer', async () => {
  ok(Buffer.isBuffer(await gzipText('hello')));
});

test('the output starts with the gzip magic bytes', async () => {
  const packed = await gzipText('hello');
  eq(packed[0], 0x1f);
  eq(packed[1], 0x8b);
});

test('repetitive text really does get smaller', async () => {
  const text = 'compress me '.repeat(200);
  const packed = await gzipText(text);
  ok(packed.length < Buffer.byteLength(text) / 4);
});

test('UTF-8 survives the round trip', async () => {
  const text = 'café 👋 naïve — αβγ';
  eq(await gunzipText(await gzipText(text)), text);
});

test('the empty string round trips too', async () => {
  eq(await gunzipText(await gzipText('')), '');
});

test('isGzip recognises its own output and rejects plain text', async () => {
  eq(isGzip(await gzipText('hello')), true);
  eq(isGzip(Buffer.from('hello', 'utf8')), false);
  eq(isGzip(Buffer.alloc(0)), false);
});

test('gunzipping something that is not gzip rejects', async () => {
  eq(await gunzipText(await gzipText('ok')), 'ok');
  await rejects(() => gunzipText(Buffer.from('definitely not gzipped', 'utf8')));
});
