// ─────────────────────────────────────────────────────────────────────────
//  06 · back-pressure, by hand and for free — SOLUTION       ★★★ stretch
//  run: node 06-backpressure-count.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: write() always accepts the chunk. `false` is advice, not
//  a rejection — it means the sink's buffer is at or past its high-water
//  mark and you should stop until 'drain'. Ignore it and nothing is lost;
//  it is all queued, in memory, unbounded. The control-group test is the
//  point: naiveWriteAll on a highWaterMark of 1 buffers the entire batch
//  anyway, because a high-water mark does not enforce anything. It is a
//  signal that only works if the writer reads it.
//  With objectMode and highWaterMark 1, a single record puts the buffer
//  at the mark, so every write returns false and you wait every time. Same
//  loop, a roomy sink, and you never wait once — the code adapts to the
//  sink instead of guessing at it.
//  Then end() plus 'finish': end() says "no more chunks", 'finish' is when
//  the last one has actually been handed to _write and acknowledged.
//  Resolve before that and the caller can delete the source file while
//  bytes are still in flight.
//  pipeAll is the same delivery with none of the bookkeeping — pipeline
//  pauses the source when the sink is full and resumes it on drain, which
//  is why `leads` never exceeds one record. Write the loop once by hand so
//  you know what pipeline is doing; then use pipeline.
//  Wrong turn: `chunks.forEach((c) => stream.write(c))`. forEach cannot
//  await, so every drain is ignored — that is naiveWriteAll with extra
//  steps. Wrong turn two: `.on('drain')` instead of `once`, which piles up
//  a listener per chunk until Node warns about a leak at eleven.

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

export async function pipeAll(items, stream) {
  await pipeline(pacedSource(items), stream);
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
