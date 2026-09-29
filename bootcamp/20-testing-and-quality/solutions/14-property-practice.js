// ─────────────────────────────────────────────────────────────────────────
//  14 · properties in practice — SOLUTION                    ★★★ stretch
//  run: node 14-property-practice.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: the engine is built; the skill left is SPOTTING properties.
//  Three families cover most real code, and all three are here:
//    · round trip  — parse(serialise(x)) is x   (JSON, base64, URL codecs)
//    · involution  — f(f(x)) is x               (reverse, negate, toggle)
//    · idempotence — f(f(x)) is f(x)            (sort, trim, normalise,
//                                                and every PUT endpoint)
//  Each one is a sentence about ALL inputs, which is why they find things
//  examples miss. You do not have to imagine the empty array, the array of
//  one, or the array where every element is equal — the generator does.
//  The fourth property is false on purpose. `[...xs].sort()` with no
//  comparator sorts by STRING, so [9, 10] comes back [10, 9]. It is the
//  most common bug in JavaScript, it survives every example test written
//  with single digits, and a property test finds it in milliseconds.
//  Watch what shrinking buys you: the raw counterexample is a six-element
//  array of noise, and the report says `[10, 9]` — two numbers, and the bug
//  is right there in front of you.
//  Note `same()` and not `===`: two structurally equal arrays are different
//  objects, and asserting identity here would make every property fail.

import { test, eq, ok } from '../../_lib/check.js';
import { isDeepStrictEqual as same } from 'node:util';

// ── Provided: the property library from exercises 12 and 13 ──────────────

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

export const intRange = (min, max) => (rng) =>
  min + Math.floor(rng() * (max - min + 1));

export const arrayOf = (itemGen, minLength = 0, maxLength = 10) => (rng) => {
  const length = intRange(minLength, maxLength)(rng);
  return Array.from({ length }, () => itemGen(rng));
};

export const stringOf = (alphabet, minLength = 0, maxLength = 10) => (rng) => {
  const length = intRange(minLength, maxLength)(rng);
  let out = '';
  for (let i = 0; i < length; i++) {
    out += alphabet[intRange(0, alphabet.length - 1)(rng)];
  }
  return out;
};

export const shrinkArray = (xs) => xs.map((_, i) => xs.filter((_, j) => j !== i));

function shrink(value, candidatesOf, stillFails) {
  let current = value;
  for (;;) {
    const next = candidatesOf(current).find((c) => stillFails(c));
    if (next === undefined) return current;
    current = next;
  }
}

export function forAll(gen, predicate, { runs = 100, seed = 1, shrinker } = {}) {
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

// ── Provided: the units under test ───────────────────────────────────────

const reverse = (xs) => [...xs].reverse();
const sortNums = (xs) => [...xs].sort((a, b) => a - b);
const naiveSort = (xs) => [...xs].sort(); // no comparator — sorts as strings

// ── Your properties ──────────────────────────────────────────────────────

export function reverseIsInvolution(options) {
  return forAll(
    arrayOf(intRange(-50, 50), 0, 10),
    (xs) => same(reverse(reverse(xs)), xs),
    options
  );
}

export function sortIsIdempotent(options) {
  return forAll(
    arrayOf(intRange(-50, 50), 0, 10),
    (xs) => same(sortNums(sortNums(xs)), sortNums(xs)),
    options
  );
}

export function jsonRoundTrips(options) {
  return forAll(
    arrayOf(stringOf('ab"\\{} ', 0, 6), 0, 5),
    (xs) => same(JSON.parse(JSON.stringify(xs)), xs),
    options
  );
}

export function naiveSortIsOrdered(options) {
  const isNonDecreasing = (xs) =>
    xs.every((v, i) => i === 0 || xs[i - 1] <= v);
  return forAll(
    arrayOf(intRange(0, 100), 0, 8),
    (xs) => isNonDecreasing(naiveSort(xs)),
    { ...options, shrinker: shrinkArray }
  );
}

// ──────────────────────────── tests ──────────────────────────────────────

test('reversing twice gives the list back, over 200 arrays', () => {
  const result = reverseIsInvolution({ runs: 200, seed: 3 });
  eq(result.ok, true);
  eq(result.runs, 200);
});

test('sorting twice is the same as sorting once', () => {
  eq(sortIsIdempotent({ runs: 200, seed: 4 }).ok, true);
});

test('a JSON round trip survives quotes, braces and backslashes', () => {
  const result = jsonRoundTrips({ runs: 200, seed: 5 });
  eq(result.ok, true);
  eq(result.counterexample, undefined);
});

test('every property honours the runs it was given', () => {
  eq(reverseIsInvolution({ runs: 37, seed: 1 }).runs, 37);
  eq(sortIsIdempotent({ runs: 12, seed: 1 }).runs, 12);
  eq(jsonRoundTrips({ runs: 12, seed: 1 }).runs, 12);
});

test('the naive sort property is FALSE, and forAll proves it', () => {
  const result = naiveSortIsOrdered({ runs: 300, seed: 11 });
  eq(result.ok, false);
  ok(Array.isArray(result.counterexample));
});

test('the counterexample is minimal — exactly two numbers', () => {
  const result = naiveSortIsOrdered({ runs: 300, seed: 11 });
  eq(result.counterexample.length, 2);
  ok(
    result.original.length >= result.counterexample.length,
    'shrinking should not grow the counterexample'
  );
});

test('the counterexample really does break the ordering', () => {
  const { counterexample } = naiveSortIsOrdered({ runs: 300, seed: 11 });
  const sorted = [...counterexample].sort();
  ok(
    sorted.some((v, i) => i > 0 && sorted[i - 1] > v),
    `${JSON.stringify(sorted)} should not be in numeric order`
  );
});

test('the same seed reproduces the same counterexample', () => {
  const a = naiveSortIsOrdered({ runs: 300, seed: 11 });
  const b = naiveSortIsOrdered({ runs: 300, seed: 11 });
  eq(a, b);
});
