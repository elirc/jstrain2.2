// ─────────────────────────────────────────────────────────────────────────
//  11 · zipIter · enumerate — SOLUTION                       ★★☆ core
//  run: node 11-zip-enumerate.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: zipIter cannot use for-of, because two for-of loops
//  cannot advance together. So it grabs both iterators up front and
//  pulls one step from each per round — the raw protocol from exercise
//  01, used for real.
//
//  Check `done` on BOTH steps before yielding. Test the shorter side
//  only and you emit a pair containing undefined; that is the bug the
//  "stops when the shorter side runs out" test hunts for. Note this
//  costs one wasted pull from the longer side — unavoidable, since you
//  cannot know a side is finished without asking it.
//
//  enumerate is the easy twin: for-of plus a counter that starts at
//  `start`, yielding [index, value] in Python's order.

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

export function* zipIter(a, b) {
  const ia = a[Symbol.iterator]();
  const ib = b[Symbol.iterator]();
  while (true) {
    const stepA = ia.next();
    const stepB = ib.next();
    if (stepA.done || stepB.done) return;
    yield [stepA.value, stepB.value];
  }
}

export function* enumerate(iterable, start = 0) {
  let index = start;
  for (const value of iterable) {
    yield [index, value];
    index += 1;
  }
}

// ──────────────────────────── tests ──────────────────────────────────────

test('zipIter pairs values position by position', () => {
  eq([...zipIter([1, 2], ['a', 'b'])], [[1, 'a'], [2, 'b']]);
});

test('zipIter stops when the shorter side runs out', () => {
  eq([...zipIter([1, 2, 3], 'ab')], [[1, 'a'], [2, 'b']]);
  eq([...zipIter('ab', [1, 2, 3])], [['a', 1], ['b', 2]]);
});

test('zipIter with an empty side yields nothing', () => {
  eq([...zipIter([], [1, 2])], []);
  eq([...zipIter([1, 2], '')], []);
});

test('zipIter can pair a finite source with an endless one', () => {
  eq([...zipIter('abc', naturals())], [['a', 1], ['b', 2], ['c', 3]]);
});

test('zipIter mixes iterable types happily', () => {
  eq([...zipIter(new Set([7, 8]), 'xy')], [[7, 'x'], [8, 'y']]);
});

test('enumerate pairs a 0-based index with each value', () => {
  eq([...enumerate('ab')], [[0, 'a'], [1, 'b']]);
  eq([...enumerate([])], []);
});

test('enumerate can start counting somewhere else', () => {
  eq([...enumerate(['a', 'b'], 1)], [[1, 'a'], [2, 'b']]);
});

test('enumerate is lazy and works on any iterable', () => {
  eq([...enumerate(new Set(['x']))], [[0, 'x']]);
  eq([...take(2, enumerate(naturals(), 5))], [[5, 1], [6, 2]]);
});
