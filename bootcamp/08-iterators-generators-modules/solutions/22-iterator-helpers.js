// ─────────────────────────────────────────────────────────────────────────
//  22 · dropI · takeWhileI · dropWhileI · concatI — SOLUTION ★☆☆ warm-up
//  run: node 22-iterator-helpers.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: four generators, four one-line ideas — a counter, an
//  early `return`, a flag, and a `yield*` per source. Everything stays
//  lazy for the same reason as always: the loop body cannot run ahead
//  of the consumer, because `yield` freezes it.
//
//  takeWhileI's `return` matters: it ends the generator, so the source
//  is closed and never asked again. A `continue` there would keep
//  reading forever looking for another value below the threshold —
//  which is a different function (that is filter) and hangs on
//  naturals().
//
//  dropWhileI's flag is the classic trap. With a naive
//  `if (predicate(value)) continue;` the [1, 2, 3, 1] case drops that
//  trailing 1 as well, because the predicate is still true when it
//  comes round again. Once dropping stops, it stops for good.
//
//  These four mirror the ES iterator-helpers proposal, which Node 22
//  already ships: Iterator.prototype.drop / take / map / filter /
//  flatMap, plus Iterator.from() to wrap a plain iterable. Writing them
//  by hand once is how the built-ins stop being magic — and the
//  hand-rolled versions still work on anything, including the old-style
//  iterators the built-ins refuse.

import { test, eq, ok } from '../../_lib/check.js';

// scaffolding: the helpers you already built, plus a counting source.
// Do not edit.
function* takeI(n, iterable) {
  if (n <= 0) return;
  let taken = 0;
  for (const value of iterable) {
    yield value;
    taken += 1;
    if (taken >= n) return;
  }
}

function* mapI(iterable, fn) {
  for (const value of iterable) yield fn(value);
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

export function* dropI(n, iterable) {
  let dropped = 0;
  for (const value of iterable) {
    if (dropped < n) {
      dropped += 1;
      continue;
    }
    yield value;
  }
}

export function* takeWhileI(predicate, iterable) {
  for (const value of iterable) {
    if (!predicate(value)) return;
    yield value;
  }
}

export function* dropWhileI(predicate, iterable) {
  let dropping = true;
  for (const value of iterable) {
    if (dropping && predicate(value)) continue;
    dropping = false;
    yield value;
  }
}

export function* concatI(...iterables) {
  for (const iterable of iterables) yield* iterable;
}

// ──────────────────────────── tests ──────────────────────────────────────

test('dropI skips the first n values', () => {
  eq([...dropI(2, [1, 2, 3, 4])], [3, 4]);
});

test('dropI of 0 keeps everything, dropI past the end keeps nothing', () => {
  eq([...dropI(0, 'abc')], ['a', 'b', 'c']);
  eq([...dropI(9, 'abc')], []);
});

test('takeWhileI stops at the first value that fails', () => {
  eq([...takeWhileI((n) => n < 3, [1, 2, 3, 1])], [1, 2]);
  eq([...takeWhileI((n) => n < 3, [9, 1])], []);
});

test('dropWhileI keeps the value that broke the run', () => {
  eq([...dropWhileI((n) => n < 3, [1, 2, 3, 1])], [3, 1]);
  eq([...dropWhileI((n) => n < 3, [1, 2])], []);
});

test('takeWhileI makes an endless source finite', () => {
  eq([...takeWhileI((n) => n <= 4, naturals())], [1, 2, 3, 4]);
});

test('concatI runs its iterables in order, whatever they are', () => {
  eq([...concatI([1, 2], 'ab', new Set([9]))], [1, 2, 'a', 'b', 9]);
});

test('concatI with nothing to concat yields nothing', () => {
  eq([...concatI()], []);
  eq([...concatI([], [])], []);
});

test('they chain with the old helpers and stay lazy', () => {
  const src = counted([1, 2, 3, 4, 5, 6]);
  eq([...takeI(2, mapI(dropI(1, src.iterable), (n) => n * 10))], [20, 30]);
  ok(src.log.pulls <= 4, `pulled ${src.log.pulls} values for 2 results`);
});
