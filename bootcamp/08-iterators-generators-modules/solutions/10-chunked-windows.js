// ─────────────────────────────────────────────────────────────────────────
//  10 · chunked · windows — SOLUTION                         ★★☆ core
//  run: node 10-chunked-windows.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: both keep one buffer array and differ only in what
//  they do after a yield. chunked starts a brand-new buffer (groups
//  are disjoint); windows drops the oldest value with shift() (groups
//  overlap). chunked's trailing `if (buffer.length)` is what emits the
//  short final group — forget it and the last few values vanish
//  silently, which is the bug you ship to production.
//
//  Yield a copy. `yield buffer` hands the consumer a reference to the
//  array you are about to mutate, so a collected result ends up as N
//  copies of the final window. The `each window is a separate array`
//  test exists to catch exactly that.
//
//  Laziness is free here: the buffer only fills as fast as the
//  consumer pulls, so an endless source is fine.

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
  let buffer = [];
  for (const value of iterable) {
    buffer.push(value);
    if (buffer.length === size) {
      yield buffer;
      buffer = [];
    }
  }
  if (buffer.length > 0) yield buffer;
}

export function* windows(iterable, size) {
  const buffer = [];
  for (const value of iterable) {
    buffer.push(value);
    if (buffer.length > size) buffer.shift();
    if (buffer.length === size) yield [...buffer];
  }
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
