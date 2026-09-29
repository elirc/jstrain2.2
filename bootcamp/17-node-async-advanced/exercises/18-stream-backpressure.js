// ─────────────────────────────────────────────────────────────────────────
//  18 · back-pressure you can count                         ★★★ stretch
//  concepts: Writable · highWaterMark · write() → false · 'drain'
//  run: node 18-stream-backpressure.js
// ─────────────────────────────────────────────────────────────────────────
//
//  `stream.write(chunk)` never blocks — it returns a BOOLEAN. `false`
//  means "I took it, but my buffer is over the high-water mark; please
//  stop until I emit 'drain'". Ignore that boolean in a loop over a big
//  file and Node happily buffers the whole thing in RAM, which is how a
//  streaming copy turns into an out-of-memory kill.
//
//  Write every chunk, respect the boolean, and report how many times you
//  had to wait:
//
//      const { stream, written } = makeSink({ highWaterMark: 1 });
//      await writeAll(stream, ['a', 'b', 'c'])   → 3   (waited 3 times)
//      written                                   → ['a', 'b', 'c']
//
//      makeSink({ highWaterMark: 1024 })
//      await writeAll(stream, ['a', 'b', 'c'])   → 0   (never full)
//
//  Finish the job too: end the stream and resolve only once it has
//  actually flushed.
//
//  hint: `if (!stream.write(chunk)) await once(stream, 'drain');` is the
//  loop body. After the loop, end() and wait for 'finish'.

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
  throw new Error('TODO');
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
