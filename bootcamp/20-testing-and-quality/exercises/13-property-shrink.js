// ─────────────────────────────────────────────────────────────────────────
//  13 · shrinking                                            ★★★ stretch
//  concepts: greedy search · minimal counterexamples
//  run: node 13-property-shrink.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Your forAll from exercise 12 reports counterexamples like
//  `[47, 3, 912, 88, 0, 15]`. Useless. Shrinking turns that into `[912]`,
//  and suddenly you can see the bug. It is a greedy walk: propose smaller
//  candidates, keep the first that STILL fails, repeat.
//
//      shrinkInt(10)      → [0, 5, 9]     // zero, half, one step closer
//      shrinkInt(2)       → [0, 1]        // deduped
//      shrinkInt(1)       → [0]
//      shrinkInt(0)       → []            // nothing smaller
//      shrinkInt(-4)      → [0, -2, -3]   // toward zero from below
//
//      shrinkArray([1,2,3]) → [[2,3], [1,3], [1,2]]   // drop one, in order
//      shrinkArray([])      → []
//
//      shrink(100, shrinkInt, (n) => n >= 10)              → 10
//      shrink([5,1,9,2], shrinkArray, (xs) => xs.includes(9))  → [9]
//
//  `shrink(value, candidatesOf, stillFails)` keeps the FIRST candidate for
//  which stillFails(candidate) is true and starts again from there. When no
//  candidate fails, the current value is as small as this walk can go —
//  return it. The result must always still be a real counterexample.
//
//  The provided forAll below calls YOUR shrink when given a `shrinker`.
//
//  hint: `[...new Set(candidates)]` for the dedupe, and drop n itself —
//  `shrinkInt(1)` offering 1 back is an infinite loop.

import { test, eq, ok } from '../../_lib/check.js';

// Provided: PRNG + generators from exercise 12.
function makeRandom(seed) {
  let state = seed;
  return () => {
    state |= 0;
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const intRange = (min, max) => (rng) =>
  min + Math.floor(rng() * (max - min + 1));

const arrayOf = (itemGen, minLength = 0, maxLength = 10) => (rng) => {
  const length = intRange(minLength, maxLength)(rng);
  return Array.from({ length }, () => itemGen(rng));
};

// Provided: forAll, now delegating the shrinking to YOUR shrink().
function forAll(gen, predicate, { runs = 100, seed = 1, shrinker } = {}) {
  const rng = makeRandom(seed);
  for (let run = 1; run <= runs; run++) {
    const value = gen(rng);
    if (!predicate(value)) {
      const counterexample = shrinker
        ? shrink(value, shrinker, (v) => !predicate(v))
        : value;
      return { ok: false, runs: run, seed, original: value, counterexample };
    }
  }
  return { ok: true, runs };
}

export function shrinkInt(n) {
  throw new Error('TODO');
}

export function shrinkArray(xs) {
  throw new Error('TODO');
}

export function shrink(value, candidatesOf, stillFails) {
  throw new Error('TODO');
}

// ──────────────────────────── tests ──────────────────────────────────────

test('shrinkInt walks toward zero and never offers n itself', () => {
  eq(shrinkInt(10), [0, 5, 9]);
  eq(shrinkInt(2), [0, 1]);
  eq(shrinkInt(1), [0]);
  eq(shrinkInt(0), []);
  eq(shrinkInt(-4), [0, -2, -3]);
});

test('shrinkArray drops one element at a time, in index order', () => {
  eq(shrinkArray([1, 2, 3]), [
    [2, 3],
    [1, 3],
    [1, 2],
  ]);
  eq(shrinkArray([9]), [[]]);
  eq(shrinkArray([]), []);
});

test('shrink finds the smallest int that still fails', () => {
  eq(shrink(100, shrinkInt, (n) => n >= 10), 10);
  eq(shrink(40, shrinkInt, (n) => n >= 7), 7);
});

test('shrink returns the value untouched when nothing smaller fails', () => {
  eq(shrink(5, shrinkInt, () => false), 5);
  eq(shrink(0, shrinkInt, () => true), 0);
});

test('shrink reduces an array to the element that matters', () => {
  eq(shrink([5, 1, 9, 2], shrinkArray, (xs) => xs.includes(9)), [9]);
  eq(shrink([4, 4, 4, 4], shrinkArray, (xs) => xs.length >= 2), [4, 4]);
});

test('shrink only ever returns a value that still fails', () => {
  const stillFails = (n) => n >= 7;
  const out = shrink(40, shrinkInt, stillFails);
  ok(stillFails(out), 'the shrunk value must still be a counterexample');
  ok(!stillFails(out - 1), 'and one step smaller must pass');
});

test('forAll shrinks an int counterexample all the way to the boundary', () => {
  const result = forAll(intRange(0, 1000), (n) => n < 100, {
    runs: 300,
    seed: 5,
    shrinker: shrinkInt,
  });
  eq(result.ok, false);
  eq(result.counterexample, 100);
  ok(result.original >= 100, 'the raw counterexample was some big number');
});

test('forAll shrinks an array counterexample to one element', () => {
  const result = forAll(
    arrayOf(intRange(0, 20), 0, 8),
    (xs) => !xs.includes(13),
    { runs: 300, seed: 7, shrinker: shrinkArray }
  );
  eq(result.ok, false);
  eq(result.counterexample, [13]);
  ok(result.original.length >= 1);
});
