// ─────────────────────────────────────────────────────────────────────────
//  18 · back-pressure you can count — SOLUTION              ★★★ stretch
//  run: node 18-stream-backpressure.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: write() ALWAYS accepts the chunk. The return value is
//  advice, not a rejection — `false` means the internal buffer has passed
//  the high-water mark and you should pause until 'drain'. Ignoring it
//  does not lose data; it queues data, in memory, without limit. That is
//  the difference between "my copy uses 64 KB" and "my copy used 3 GB and
//  the container got OOM-killed".
//  With highWaterMark: 1, a single one-byte chunk already puts the
//  buffer at the mark, so every write returns false and you wait every
//  time. With 1024 the five chunks never come close, so you never wait —
//  same code, different sink, and the loop adapts by itself.
//  The tail matters as much as the loop: end() says "no more chunks",
//  and 'finish' is when the last one has actually been handed to _write
//  and acknowledged. Resolving before that means the caller can delete
//  the source file while bytes are still in flight.
//  Wrong turn: `chunks.forEach((c) => stream.write(c))`. forEach cannot
//  await, so it ignores every drain and buffers the lot. Wrong turn two:
//  listening for 'drain' with .on() instead of once() — you accumulate a
//  listener per chunk and Node warns about a leak at eleven.

import { test, eq, ok } from '../../_lib/check.js';
import { Writable } from 'node:stream';
import { once } from 'node:events';

// Provided: a sink that takes a few milliseconds to swallow each chunk,
// and remembers what it got.
export function makeSink({ highWaterMark, delayMs = 4 } = {}) {
  const written = [];
  const stream = new Writable({
    highWaterMark,
    write(chunk, encoding, callback) {
      written.push(chunk.toString('utf8'));
      setTimeout(callback, delayMs);
    },
  });
  return { stream, written };
}

export async function writeAll(stream, chunks) {
  let waits = 0;
  for (const chunk of chunks) {
    if (!stream.write(chunk)) {
      waits += 1;
      await once(stream, 'drain'); // the buffer is full — let it catch up
    }
  }
  stream.end();
  await once(stream, 'finish'); // resolve only when the sink really has it
  return waits;
}

// ──────────────────────────── tests ──────────────────────────────────────

test('every chunk reaches the sink, in order', async () => {
  const { stream, written } = makeSink({ highWaterMark: 1 });
  await writeAll(stream, ['a', 'b', 'c']);
  eq(written, ['a', 'b', 'c']);
});

test('it resolves only once the stream has finished', async () => {
  const { stream, written } = makeSink({ highWaterMark: 1 });
  await writeAll(stream, ['x', 'y']);
  eq(written.length, 2);
  eq(stream.writableFinished, true, 'the stream should be closed by now');
});

test('a tiny highWaterMark forces you to wait for drain', async () => {
  const { stream } = makeSink({ highWaterMark: 1 });
  const waits = await writeAll(stream, ['a', 'b', 'c', 'd', 'e']);
  ok(waits >= 1, `expected at least one drain wait, got ${waits}`);
});

test('a roomy highWaterMark never makes you wait', async () => {
  const { stream, written } = makeSink({ highWaterMark: 1024 });
  eq(await writeAll(stream, ['a', 'b', 'c', 'd', 'e']), 0);
  eq(written.join(''), 'abcde');
});

test('you never wait more times than there are chunks', async () => {
  const { stream } = makeSink({ highWaterMark: 1 });
  const chunks = ['a', 'b', 'c'];
  const waits = await writeAll(stream, chunks);
  ok(waits <= chunks.length, `waited ${waits} times for ${chunks.length} chunks`);
});

test('an empty list writes nothing and still finishes', async () => {
  const { stream, written } = makeSink({ highWaterMark: 1 });
  eq(await writeAll(stream, []), 0);
  eq(written, []);
  eq(stream.writableFinished, true);
});

test('Buffer chunks work the same way', async () => {
  const { stream, written } = makeSink({ highWaterMark: 1 });
  await writeAll(stream, [Buffer.from('ab'), Buffer.from('cd')]);
  eq(written, ['ab', 'cd']);
});
