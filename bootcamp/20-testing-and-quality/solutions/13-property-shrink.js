// ─────────────────────────────────────────────────────────────────────────
//  13 · shrinking — SOLUTION                                 ★★★ stretch
//  run: node 13-property-shrink.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: a raw counterexample is `[47, 3, 912, 88, 0, 15]` and tells
//  you nothing. Shrinking turns it into `[912]` — and now you can SEE the
//  bug. This is the feature that makes property testing usable by humans,
//  and it is a greedy hill-climb: propose smaller candidates, keep the
//  first one that still fails, repeat until nothing smaller fails.
//  The candidate ORDER is the design. `[0, half, n-1]` tries the biggest
//  jump first (0), then a binary-search-sized jump, then one step. Halving
//  gets you from 1_000_000 to double digits in twenty passes; the `n - 1`
//  tail is what lands you exactly on the boundary instead of near it.
//  Drop the `n - 1` and 100 shrinks to 12 — still useful, still not the
//  number in the spec.
//  `shrink` never accepts a candidate that PASSES, so the result is always
//  a genuine counterexample — a shrinker that loses the failure is worse
//  than no shrinker, because it sends you to debug a working input.
//  This is local, not global, minimality: greedy stops at the first plateau
//  where no single candidate fails. Real libraries have the same caveat.

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
  if (n === 0) return [];
  const step = n > 0 ? n - 1 : n + 1;
  const candidates = [0, Math.trunc(n / 2), step];
  return [...new Set(candidates)].filter((c) => c !== n);
}

export function shrinkArray(xs) {
  return xs.map((_, i) => xs.filter((_, j) => j !== i));
}

export function shrink(value, candidatesOf, stillFails) {
  let current = value;
  for (;;) {
    const next = candidatesOf(current).find((c) => stillFails(c));
    if (next === undefined) return current;
    current = next;
  }
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
