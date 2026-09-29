// ─────────────────────────────────────────────────────────────────────────
//  11 · zipIter · enumerate                                  ★★☆ core
//  concepts: driving iterators by hand · parallel iteration
//  run: node 11-zip-enumerate.js
// ─────────────────────────────────────────────────────────────────────────
//
//  for-of walks ONE iterable. To walk two in lockstep you have to ask
//  each for its iterator and call next() yourself — this is where
//  exercise 01 pays off.
//
//      [...zipIter([1, 2, 3], 'ab')]   → [[1, 'a'], [2, 'b']]
//                                        stops at the shorter side
//      [...zipIter('abc', naturals())] → [['a',1], ['b',2], ['c',3]]
//
//      [...enumerate('ab')]            → [[0, 'a'], [1, 'b']]
//      [...enumerate('ab', 1)]         → [[1, 'a'], [2, 'b']]
//
//  hint: `const it = thing[Symbol.iterator]()` then compare
//        `step.done` from BOTH sides before yielding a pair

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
  throw new Error('TODO');
}

export function* enumerate(iterable, start = 0) {
  throw new Error('TODO');
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
