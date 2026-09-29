// ─────────────────────────────────────────────────────────────────────────
//  22 · dropI · takeWhileI · dropWhileI · concatI           ★☆☆ warm-up
//  concepts: a lazy helper library · the iterator-helpers shapes
//  run: node 22-iterator-helpers.js
// ─────────────────────────────────────────────────────────────────────────
//
//  You have mapIter and filterIter from exercise 09. Fill in the rest
//  of the standard toolbox — the same four shapes the language itself
//  now ships on iterators — as generators over ANY iterable.
//
//      [...dropI(2, [1, 2, 3, 4])]                → [3, 4]
//      [...takeWhileI((n) => n < 3, [1, 2, 3, 1])] → [1, 2]
//      [...dropWhileI((n) => n < 3, [1, 2, 3, 1])] → [3, 1]
//      [...concatI([1, 2], 'ab')]                  → [1, 2, 'a', 'b']
//
//  Watch the difference in the middle two: takeWhileI STOPS at the
//  first failure and never looks again; dropWhileI keeps everything
//  from the first failure on, including that value itself.
//
//  hint: dropWhileI needs a flag, not a counter — once you have stopped
//        dropping you never start again, however the later values look

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
  throw new Error('TODO');
}

export function* takeWhileI(predicate, iterable) {
  throw new Error('TODO');
}

export function* dropWhileI(predicate, iterable) {
  throw new Error('TODO');
}

export function* concatI(...iterables) {
  throw new Error('TODO');
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
