// ─────────────────────────────────────────────────────────────────────────
//  24 · pairs — SOLUTION                                       ★★☆ core
//  run: node 24-lazy-pairs.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: the trick is to flip the double loop around. Instead of
//  "for each i, for each j > i" — which needs indexes and a second pass
//  — it is "for each arriving value, pair it with everything already
//  seen". One walk of the source, and the `seen` array grows behind you.
//
//  That flip is what makes it work on a generator: you never ask the
//  source for a value twice, so `pairs(take(3, naturals()))` is fine,
//  and an endless source is fine too because the pairs come out as the
//  values arrive.
//
//  Classic wrong turn: `const list = [...iterable]` and then two index
//  loops. Correct for arrays, hangs forever on naturals(), and pays for
//  the whole source before yielding a single pair. The version here
//  buffers too — combinatorics has to remember something — but it
//  buffers only as far as the consumer has pulled.

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
  const seen = [];
  for (const value of iterable) {
    for (const earlier of seen) yield [earlier, value];
    seen.push(value);
  }
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
