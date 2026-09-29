// ─────────────────────────────────────────────────────────────────────────
//  24 · pairs                                                  ★★☆ core
//  concepts: combinatorics without materialising · single-pass sources
//  run: node 24-lazy-pairs.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Every "compare everything with everything" job — duplicate hunting,
//  distance matrices, scheduling conflicts — wants each unordered pair
//  exactly once. The array version is a double loop over indexes; the
//  generator version has to work on things that have no indexes and can
//  only be walked once.
//
//      [...pairs(['a', 'b', 'c'])]
//          → [['a','b'], ['a','c'], ['b','c']]
//      [...pairs(['only'])]        → []
//      [...take(3, pairs(naturals()))]
//          → [[1,2], [1,3], [2,3]]
//
//  Same value never pairs with itself, and (a, b) never shows up again
//  as (b, a). It must work on a one-shot generator source, so you may
//  walk the input exactly once.
//
//  hint: you cannot look ahead in an iterable, but you can look behind
//        — when a new value arrives, what can you pair it with?

import { test, eq, ok } from '../../_lib/check.js';

// scaffolding: helpers from earlier exercises plus a counting source.
// Do not edit.
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

function counted(values) {
  const log = { pulls: 0 };
  const iterable = {
    [Symbol.iterator]() {
      const inner = values[Symbol.iterator]();
      return {
        next() {
          log.pulls += 1;
          return inner.next();
        },
      };
    },
  };
  return { iterable, log };
}

export function* pairs(iterable) {
  throw new Error('TODO');
}

// ──────────────────────────── tests ──────────────────────────────────────

test('it yields every unordered pair exactly once', () => {
  eq(
    [...pairs(['a', 'b', 'c'])],
    [
      ['a', 'b'],
      ['a', 'c'],
      ['b', 'c'],
    ]
  );
});

test('fewer than two values means no pairs', () => {
  eq([...pairs([])], []);
  eq([...pairs(['only'])], []);
});

test('n values give n * (n - 1) / 2 pairs', () => {
  eq([...pairs([1, 2, 3, 4, 5])].length, 10);
});

test('nothing is ever paired with itself', () => {
  for (const [a, b] of pairs([1, 2, 3, 4])) ok(a !== b, `${a} paired itself`);
});

test('it reads any iterable, including a one-shot generator', () => {
  eq([...pairs(new Set(['x', 'y']))], [['x', 'y']]);
  eq(
    [...pairs(take(3, naturals()))],
    [
      [1, 2],
      [1, 3],
      [2, 3],
    ]
  );
});

test('it stays lazy over an endless source', () => {
  eq(
    [...take(3, pairs(naturals()))],
    [
      [1, 2],
      [1, 3],
      [2, 3],
    ]
  );
});

test('three pairs cost a handful of pulls, not the whole source', () => {
  const src = counted([1, 2, 3, 4, 5, 6, 7, 8]);
  eq([...take(3, pairs(src.iterable))].length, 3);
  ok(src.log.pulls <= 4, `pulled ${src.log.pulls} values for 3 pairs`);
});
