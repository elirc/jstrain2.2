// ─────────────────────────────────────────────────────────────────────────
//  20 · gzip round trip — SOLUTION                            ★★☆ core
//  run: node 20-zlib-gzip.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: promisify wraps a callback-style function once, at module
//  level — doing it inside the function allocates a new wrapper on every
//  call for no reason. The rule promisify relies on is the Node callback
//  convention: the callback takes (err, result) and is the LAST argument.
//  gzip works on bytes, so encode the string on the way in and decode on
//  the way out; skipping the utf8 decode leaves you with a Buffer that
//  only looks like a string when you print it.
//  isGzip is a header sniff, not a guarantee — but it is exactly what
//  tooling does, and it explains the rejection in the last test: gunzip
//  checks that header itself and fails loudly rather than returning junk.

import { test, eq, ok, rejects } from '../../_lib/check.js';
import { gzip, gunzip } from 'node:zlib';
import { promisify } from 'node:util';

const gzipAsync = promisify(gzip);
const gunzipAsync = promisify(gunzip);

export async function gzipText(text) {
  return gzipAsync(Buffer.from(text, 'utf8'));
}

export async function gunzipText(buffer) {
  const unpacked = await gunzipAsync(buffer);
  return unpacked.toString('utf8');
}

export function isGzip(buffer) {
  return buffer.length >= 2 && buffer[0] === 0x1f && buffer[1] === 0x8b;
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
