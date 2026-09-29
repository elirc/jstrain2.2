// ─────────────────────────────────────────────────────────────────────────
//  54 · chunked processing and index math — SOLUTION       ★★☆ core
//  run: node 54-chunked-processing.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: build the chunks from their COUNT rather than by walking a
//  cursor — `Array.from({ length: chunkCount(…) }, (_, index) => …)` makes
//  the chunk number a first-class value instead of something you recover
//  later, and `slice` already clamps past the end, which is what makes the
//  short final chunk free. `globalIndex` looks too small to deserve a name
//  until you have shipped an error report that said "row 2 failed" three
//  times for three different rows; `chunkIndex × size + offset` is the
//  translation, and naming it is what keeps it out of four call sites.
//  Guarding `size < 1` matters because the cursor-style loop that people
//  write instead (`for (let i = 0; i < items.length; i += size)`) never
//  terminates when size is 0 — a hang, not an exception, in production.

import { test, eq, throws } from '../../_lib/check.js';

const INVOICES = Object.freeze([
  Object.freeze({ id: 'in1', amount: 120 }),
  Object.freeze({ id: 'in2', amount: 40 }),
  Object.freeze({ id: 'in3', amount: 90 }),
  Object.freeze({ id: 'in4', amount: 15 }),
  Object.freeze({ id: 'in5', amount: 300 }),
  Object.freeze({ id: 'in6', amount: 75 }),
  Object.freeze({ id: 'in7', amount: 210 }),
]);

export function chunkCount(total, size) {
  if (size < 1) throw new Error('chunk size must be at least 1');
  return Math.ceil(total / size);
}

export function chunkWithIndex(items, size) {
  return Array.from({ length: chunkCount(items.length, size) }, (_, index) => {
    const start = index * size;
    const end = Math.min(start + size, items.length);
    return { index, start, end, items: items.slice(start, end) };
  });
}

export function globalIndex(chunkIndex, size, offsetInChunk) {
  return chunkIndex * size + offsetInChunk;
}

export function processInBatches(items, size, fn) {
  return chunkWithIndex(items, size).flatMap((chunk) =>
    chunk.items.map((item, offset) =>
      fn(item, globalIndex(chunk.index, size, offset))
    )
  );
}

// ──────────────────────────── tests ──────────────────────────────────────

test('chunkCount rounds up, and nothing needs no chunks', () => {
  eq(chunkCount(7, 3), 3);
  eq(chunkCount(6, 3), 2);
  eq(chunkCount(1, 3), 1);
  eq(chunkCount(0, 3), 0);
});

test('each chunk reports where it sits in the source', () => {
  const chunks = chunkWithIndex(INVOICES, 3);
  eq(chunks.map((c) => [c.index, c.start, c.end]), [
    [0, 0, 3],
    [1, 3, 6],
    [2, 6, 7],
  ]);
});

test('the last chunk is short, not padded', () => {
  const chunks = chunkWithIndex(INVOICES, 3);
  eq(chunks.at(-1).items.map((i) => i.id), ['in7']);
});

test('every invoice appears exactly once, in order', () => {
  const flat = chunkWithIndex(INVOICES, 3).flatMap((c) => c.items);
  eq(flat.map((i) => i.id), INVOICES.map((i) => i.id));
});

test('globalIndex maps a slot in a chunk back to the source index', () => {
  eq(globalIndex(0, 3, 0), 0);
  eq(globalIndex(1, 3, 2), 5);
  eq(globalIndex(2, 3, 0), 6);
});

test('processInBatches passes the global index, not the local one', () => {
  eq(processInBatches(INVOICES, 3, (invoice, i) => i), [0, 1, 2, 3, 4, 5, 6]);
  eq(processInBatches(INVOICES, 3, (invoice, i) => `${i}:${invoice.id}`).at(-1),
    '6:in7');
});

test('a size at least as big as the list gives one chunk', () => {
  eq(chunkWithIndex(INVOICES, 99).length, 1);
  eq(chunkWithIndex(INVOICES, 99)[0].end, 7);
});

test('an empty list has no chunks, and size 0 is an error', () => {
  eq(chunkWithIndex([], 3), []);
  eq(processInBatches([], 3, (invoice, i) => i), []);
  throws(() => chunkWithIndex(INVOICES, 0), 'size');
});
