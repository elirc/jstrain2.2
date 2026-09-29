// ─────────────────────────────────────────────────────────────────────────
//  54 · chunked processing and index math                  ★★☆ core
//  concepts: slicing in batches · global vs local index
//  run: node 54-chunked-processing.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Bulk exports, batched API writes and paged jobs all cut a list into
//  chunks — and then need to say WHERE each item came from. The offset
//  inside a chunk is not the position in the source, and mixing them up is
//  how row 4 of batch 3 gets reported as row 4.
//
//      chunkCount(7, 3)              → 3
//      chunkWithIndex(INVOICES, 3)
//        → [ { index: 0, start: 0, end: 3, items: […] }, …,
//            { index: 2, start: 6, end: 7, items: [in7] } ]
//      globalIndex(2, 3, 0)          → 6
//      processInBatches(INVOICES, 3, (inv, i) => i)  → [0, 1, 2, 3, 4, 5, 6]
//
//  The last chunk is short, never padded. A chunk size below 1 is a bug —
//  throw rather than loop forever; say 'size' in the message.
//
//  hint: chunk `k` covers `[k × size, min((k + 1) × size, length))`.

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
  throw new Error('TODO');
}

export function chunkWithIndex(items, size) {
  throw new Error('TODO');
}

export function globalIndex(chunkIndex, size, offsetInChunk) {
  throw new Error('TODO');
}

export function processInBatches(items, size, fn) {
  throw new Error('TODO');
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
