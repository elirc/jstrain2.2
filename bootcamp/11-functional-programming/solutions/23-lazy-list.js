// ─────────────────────────────────────────────────────────────────────────
//  23 · a lazy list from closures — SOLUTION                 ★★☆ core
//  run: node 23-lazy-list.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: the whole design is "put the recursion inside the arrow".
//  `iterate` returns a thunk; calling that thunk produces one cell and
//  CONSTRUCTS — but does not call — the thunk for the rest. Construction is
//  free, so an infinite list costs one closure at a time.
//  `lazyMap` and `lazyFilter` follow the same shape: return a thunk, and
//  only when it is called do you force the source, transform one head, and
//  hand back a new thunk for the tail. `lazyFilter` needs an inner loop
//  because it may have to force several source cells before it finds one
//  that passes — but it still stops the moment it has one.
//  `take` is the only consumer: it forces cells until it has n or hits
//  null. Because it forces exactly n cells, the mapper runs exactly n
//  times — that is the property the spy test is pinning down.
//  Classic wrong turn: `iterate` written as `cons(seed, iterate(...))`
//  with the recursive call OUTSIDE a thunk. It never returns; it recurses
//  until the stack dies.

import { test, eq, spy } from '../../_lib/check.js';

// ── given: the empty list, and a finite list from an array ───────────────

const nil = () => null;

const fromArray = (items) =>
  items.length === 0
    ? nil
    : () => ({ head: items[0], tail: fromArray(items.slice(1)) });

export function iterate(seed, next) {
  return () => ({ head: seed, tail: iterate(next(seed), next) });
}

export function take(n, list) {
  const out = [];
  let rest = list;
  while (out.length < n) {
    const cell = rest();
    if (cell === null) break;
    out.push(cell.head);
    rest = cell.tail;
  }
  return out;
}

export function lazyMap(fn, list) {
  return () => {
    const cell = list();
    if (cell === null) return null;
    return { head: fn(cell.head), tail: lazyMap(fn, cell.tail) };
  };
}

export function lazyFilter(pred, list) {
  return () => {
    let rest = list;
    for (;;) {
      const cell = rest();
      if (cell === null) return null;
      if (pred(cell.head)) {
        return { head: cell.head, tail: lazyFilter(pred, cell.tail) };
      }
      rest = cell.tail;
    }
  };
}

// ──────────────────────────── tests ──────────────────────────────────────

test('take pulls the first n out of an infinite list', () => {
  eq(take(4, iterate(1, (n) => n + 1)), [1, 2, 3, 4]);
  eq(take(3, iterate(1, (n) => n * 2)), [1, 2, 4]);
});

test('take(0) forces nothing at all', () => {
  const next = spy((n) => n + 1);
  eq(take(0, iterate(1, next)), []);
  eq(next.callCount, 0);
});

test('take stops early when the list runs out', () => {
  eq(take(10, fromArray(['a', 'b'])), ['a', 'b']);
  eq(take(3, nil), []);
});

test('lazyMap computes nothing until you take', () => {
  const double = spy((n) => n * 2);
  lazyMap(double, iterate(1, (n) => n + 1));
  eq(double.callCount, 0);
});

test('the mapper runs once per element taken, and no more', () => {
  const double = spy((n) => n * 2);
  eq(take(3, lazyMap(double, iterate(1, (n) => n + 1))), [2, 4, 6]);
  eq(double.callCount, 3, 'not once for every natural number');
});

test('lazyFilter skips ahead through an infinite list', () => {
  const naturals = iterate(1, (n) => n + 1);
  eq(take(4, lazyFilter((n) => n % 3 === 0, naturals)), [3, 6, 9, 12]);
});

test('map and filter compose, still lazily', () => {
  const naturals = iterate(1, (n) => n + 1);
  const pipeline = lazyMap(
    (n) => `#${n}`,
    lazyFilter((n) => n % 2 === 0, naturals)
  );
  eq(take(3, pipeline), ['#2', '#4', '#6']);
});

test('filtering everything out of a finite list ends politely', () => {
  eq(take(3, lazyFilter((n) => n > 100, fromArray([1, 2, 3]))), []);
  eq(take(2, lazyMap((n) => n + 1, nil)), []);
});
