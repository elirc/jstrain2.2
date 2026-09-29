// ─────────────────────────────────────────────────────────────────────────
//  17 · reading streams — SOLUTION                            ★★☆ core
//  run: node 17-stream-collect.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: for await over a Readable is the modern reading loop — it
//  handles 'data', 'end' and backpressure for you, and an error in the
//  stream simply throws out of the loop.
//  collectText normalises every chunk to a Buffer, concatenates, and
//  decodes ONCE at the very end. That last detail is the point of the
//  final test: 'café' is five bytes, and if the split lands mid-character
//  then `text += chunk.toString()` decodes half a character twice and you
//  get two U+FFFD replacement marks instead of 'é'. Bytes first, meaning
//  later.
//  (For a real byte stream you can also let Node do it — set the encoding
//  with readable.setEncoding('utf8'), which buffers partial characters.)

import { test, eq, ok } from '../../_lib/check.js';
import { Readable } from 'node:stream';

export function streamOf(items) {
  return Readable.from(items);
}

export async function collectArray(readable) {
  const items = [];
  for await (const chunk of readable) items.push(chunk);
  return items;
}

export async function collectText(readable) {
  const chunks = [];
  for await (const chunk of readable) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(String(chunk), 'utf8'));
  }
  return Buffer.concat(chunks).toString('utf8');
}

// ──────────────────────────── tests ──────────────────────────────────────

test('streamOf produces a Readable', () => {
  ok(streamOf(['a']) instanceof Readable);
});

test('collectArray keeps every item, in order', async () => {
  eq(await collectArray(streamOf([1, 2, 3])), [1, 2, 3]);
});

test('collectArray works on objects too', async () => {
  eq(await collectArray(streamOf([{ id: 1 }, { id: 2 }])), [{ id: 1 }, { id: 2 }]);
});

test('collectText joins string chunks', async () => {
  eq(await collectText(streamOf(['ab', 'cd', 'ef'])), 'abcdef');
});

test('collectText handles Buffer chunks', async () => {
  const stream = Readable.from([Buffer.from('ab'), Buffer.from('cd')]);
  eq(await collectText(stream), 'abcd');
});

test('an empty stream collects to an empty string', async () => {
  eq(await collectText(streamOf([])), '');
});

test('collectText reads from an async generator', async () => {
  async function* lines() {
    yield 'first\n';
    yield 'second\n';
  }
  eq(await collectText(Readable.from(lines())), 'first\nsecond\n');
});

test('a character split across two chunks survives', async () => {
  const bytes = Buffer.from('café', 'utf8');
  const stream = Readable.from([bytes.subarray(0, 4), bytes.subarray(4)]);
  eq(await collectText(stream), 'café');
});
