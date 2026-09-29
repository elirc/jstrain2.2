// ─────────────────────────────────────────────────────────────────────────
//  06 · back-pressure, by hand and for free                 ★★★ stretch
//  concepts: write() return value · drain · highWaterMark · pipeline
//  run: node 06-backpressure-count.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Module 17 counted drains once. Do it cold, then do the same job the
//  way you would actually ship it, and watch the counter go quiet.
//
//  1. `writeAll(stream, chunks)` — write every chunk, respecting the
//     signal write() gives you, and resolve once the sink has really
//     finished. Resolve with the number of times write() returned false:
//
//         writeAll(makeSink({ highWaterMark: 1 }),  ['a','b','c']) → 3
//         writeAll(makeSink({ highWaterMark: 64 }), ['a','b','c']) → 0
//
//  2. `pipeAll(items, stream)` — the same delivery through the provided
//     `pacedSource(items)`, with the plumbing doing the counting for you.
//     Resolves when everything has been written.

import { test, eq, ok, sleep } from '../../_lib/check.js';
import { Readable, Writable } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import { once } from 'node:events';

// Provided: what the tests read. `buffered` samples the sink's queue
// depth on every write, `leads` how far the source ran ahead of it.
export const trace = { produced: [], written: [], buffered: [], leads: [] };

export function resetTrace() {
  trace.produced = [];
  trace.written = [];
  trace.buffered = [];
  trace.leads = [];
}

// Provided: a sink that takes a few milliseconds per record.
export function makeSink({ highWaterMark = 1, delayMs = 3 } = {}) {
  const stream = new Writable({
    objectMode: true,
    highWaterMark,
    write(chunk, encoding, callback) {
      trace.written.push(chunk);
      trace.buffered.push(stream.writableLength);
      trace.leads.push(trace.produced.length - trace.written.length);
      setTimeout(callback, delayMs);
    },
  });
  return stream;
}

// Provided: a source that produces one record per millisecond.
export function pacedSource(items) {
  async function* produce() {
    for (const item of items) {
      await sleep(1);
      trace.produced.push(item);
      yield item;
    }
  }
  return Readable.from(produce(), { objectMode: true, highWaterMark: 1 });
}

// Provided: the version that ignores the signal. The tests use it as the
// control group — do not copy it.
export async function naiveWriteAll(stream, chunks) {
  for (const chunk of chunks) stream.write(chunk);
  stream.end();
  await once(stream, 'finish');
}

export async function writeAll(stream, chunks) {
  throw new Error('TODO');
}

export async function pipeAll(items, stream) {
  throw new Error('TODO');
}

// ──────────────────────────── tests ──────────────────────────────────────

const ITEMS = ['a', 'b', 'c', 'd', 'e', 'f'];
const peak = (list) => (list.length ? Math.max(...list) : 0);

test('every chunk reaches the sink, in order', async () => {
  resetTrace();
  await writeAll(makeSink({ highWaterMark: 1 }), ITEMS);
  eq(trace.written, ITEMS);
});

test('a one-record buffer says "wait" on every single write', async () => {
  resetTrace();
  eq(await writeAll(makeSink({ highWaterMark: 1 }), ITEMS), ITEMS.length);
  eq(peak(trace.buffered), 1, 'nothing should ever pile up in the sink');
});

test('a roomy buffer never says wait — and holds the whole batch', async () => {
  resetTrace();
  eq(await writeAll(makeSink({ highWaterMark: 64 }), ITEMS), 0);
  eq(peak(trace.buffered), ITEMS.length - 1, 'all of it, in memory');
});

test('it resolves only once the sink has really finished', async () => {
  resetTrace();
  const stream = makeSink({ highWaterMark: 1 });
  await writeAll(stream, ['x', 'y']);
  eq(trace.written, ['x', 'y']);
  eq(stream.writableFinished, true, 'the stream should be closed by now');
});

test('an empty list writes nothing, waits for nothing, still finishes', async () => {
  resetTrace();
  const stream = makeSink({ highWaterMark: 1 });
  eq(await writeAll(stream, []), 0);
  eq(trace.written, []);
  eq(stream.writableFinished, true);
});

test('ignoring the signal buffers the lot, tiny high-water mark or not', async () => {
  resetTrace();
  await naiveWriteAll(makeSink({ highWaterMark: 1 }), ITEMS);
  const ignored = peak(trace.buffered);

  resetTrace();
  await writeAll(makeSink({ highWaterMark: 1 }), ITEMS);
  const respected = peak(trace.buffered);

  eq(ignored, ITEMS.length - 1, 'the sink queued everything anyway');
  ok(respected < ignored, `${respected} buffered vs ${ignored} when ignored`);
});

test('pipeline delivers the same records, in the same order', async () => {
  resetTrace();
  await pipeAll(ITEMS, makeSink({ highWaterMark: 1 }));
  eq(trace.written, ITEMS);
  eq(trace.produced, ITEMS);
});

test('pipeline paces the producer without you counting anything', async () => {
  resetTrace();
  await pipeAll(ITEMS, makeSink({ highWaterMark: 1 }));
  ok(peak(trace.leads) <= 1, `source ran ${peak(trace.leads)} records ahead`);
  eq(peak(trace.buffered), 1);
});
