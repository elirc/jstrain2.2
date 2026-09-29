// ─────────────────────────────────────────────────────────────────────────
//  17 · reading streams                                       ★★☆ core
//  concepts: Readable.from · for await · Buffer.concat
//  run: node 17-stream-collect.js
// ─────────────────────────────────────────────────────────────────────────
//
//  A stream is an array spread out over time: you get the pieces one at a
//  time and never hold the whole thing in memory. Readable.from turns any
//  iterable — array, generator, async generator — into one.
//
//      streamOf(['a', 'b'])                → a Readable
//      await collectArray(streamOf([1, 2])) → [1, 2]
//      await collectText(streamOf(['ab', 'cd'])) → 'abcd'
//
//  collectText must return a proper string even when the chunks arrive as
//  Buffers — which is what a file or a socket gives you. Chunk boundaries
//  do NOT respect characters: a two-byte 'é' can arrive as one byte at
//  the end of chunk 1 and one byte at the start of chunk 2.
//
//  hint: `for await (const chunk of readable)` is the whole reading API.
//  Collect first, decode once — deciding what the bytes mean before you
//  have all of them is the bug this exercise is about.

import { test, eq, ok } from '../../_lib/check.js';
import { Readable } from 'node:stream';

export function streamOf(items) {
  throw new Error('TODO');
}

export async function collectArray(readable) {
  throw new Error('TODO');
}

export async function collectText(readable) {
  throw new Error('TODO');
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
