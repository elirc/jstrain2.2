// ─────────────────────────────────────────────────────────────────────────
//  10 · chunked · windows                                    ★★☆ core
//  concepts: buffering inside a generator
//  run: node 10-chunked-windows.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Two batching helpers you will reach for constantly — bulk inserts,
//  rate limits, moving averages.
//
//      [...chunked([1,2,3,4,5,6,7], 3)]
//          → [[1,2,3], [4,5,6], [7]]        last group may be short
//      [...chunked('abc', 2)]     → [['a','b'], ['c']]
//
//      [...windows([1,2,3,4], 2)]
//          → [[1,2], [2,3], [3,4]]          slides one value at a time
//      [...windows([1,2], 3)]     → []      source shorter than window
//
//  Both stay lazy, so they work on endless sources:
//
//      [...take(2, windows(naturals(), 3))]   → [[1,2,3], [2,3,4]]
//
//  hint: keep a buffer array; yield a COPY of it, then reset or shift
//        — yielding the buffer itself hands out one array that keeps
//        changing under the consumer's feet

import { test, eq } from '../../_lib/check.js';

// scaffolding: helpers from earlier exercises. Do not edit.
function* take(n, iterable) {
  if (n <= 0) return;
  let taken = 0;
  for (const value of iterable) {
    yield value;
    taken += 1;
    if (taken >= n) return;
  }
}

function* naturals() {
  let n = 1;
  while (true) {
    yield n;
    n += 1;
  }
}

export function* chunked(iterable, size) {
  throw new Error('TODO');
}

export function* windows(iterable, size) {
  throw new Error('TODO');
}

// ──────────────────────────── tests ──────────────────────────────────────

test('chunked groups values and keeps a short last group', () => {
  eq(
    [...chunked([1, 2, 3, 4, 5, 6, 7], 3)],
    [[1, 2, 3], [4, 5, 6], [7]]
  );
});

test('chunked leaves no tail when it divides evenly', () => {
  eq([...chunked([1, 2, 3, 4], 2)], [[1, 2], [3, 4]]);
});

test('chunked works on any iterable', () => {
  eq([...chunked('abc', 2)], [['a', 'b'], ['c']]);
  eq([...chunked(new Set([1, 2, 3]), 5)], [[1, 2, 3]]);
});

test('chunked of an empty source yields no groups at all', () => {
  eq([...chunked([], 3)], []);
});

test('windows slides one value at a time', () => {
  eq([...windows([1, 2, 3, 4], 2)], [[1, 2], [2, 3], [3, 4]]);
});

test('windows needs a full window before it yields anything', () => {
  eq([...windows([1, 2], 3)], []);
  eq([...windows([1, 2, 3], 3)], [[1, 2, 3]]);
});

test('each window is a separate array, not a shared buffer', () => {
  const all = [...windows('abcd', 2)];
  all[0].push('!');
  eq(all[1], ['b', 'c']);
});

test('both stay lazy on an endless source', () => {
  eq([...take(2, chunked(naturals(), 2))], [[1, 2], [3, 4]]);
  eq([...take(2, windows(naturals(), 3))], [[1, 2, 3], [2, 3, 4]]);
});
