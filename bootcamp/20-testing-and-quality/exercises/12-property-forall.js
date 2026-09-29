// ─────────────────────────────────────────────────────────────────────────
//  12 · forAll                                               ★★★ stretch
//  concepts: property-based testing · generators · determinism
//  run: node 12-property-forall.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Example tests check the cases you thought of. A PROPERTY is a rule that
//  must hold for every input — "reversing twice gives you back the list" —
//  and the runner throws a hundred generated values at it. Build the
//  engine; this is fast-check in fifteen lines.
//
//  A generator is one function: `(rng) => value`, where rng() is a float
//  in [0,1). That is the whole contract, which is why they compose.
//
//      const rng = makeRandom(1);              // provided below
//      intRange(1, 6)(rng)                → 4          (ends included)
//      arrayOf(intRange(0, 9), 2, 5)(rng) → [3, 7, 1]  (length 2..5)
//      stringOf('ab', 3, 3)(rng)          → 'aba'
//
//      forAll(intRange(0, 5), (n) => n !== 3, { runs: 200, seed: 1 })
//        → { ok: false, runs: 4, seed: 1, counterexample: 3 }
//
//      forAll(intRange(0, 5), (n) => n >= 0, { runs: 25, seed: 1 })
//        → { ok: true, runs: 25 }
//
//  Rules: ONE rng for the whole call, made from the seed — so the same seed
//  replays the same values. Stop at the first falsy predicate result and
//  report `runs` as the number of values tried, the failing one included.
//  Defaults: runs 100, seed 1.
//
//  hint: `arrayOf` needs a length as well as items — both come from the
//  SAME rng, in a fixed order, or the sequence stops being reproducible.

import { test, eq, ok } from '../../_lib/check.js';

// Provided: the seeded PRNG from exercise 07.
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

export function intRange(min, max) {
  throw new Error('TODO');
}

export function arrayOf(itemGen, minLength = 0, maxLength = 10) {
  throw new Error('TODO');
}

export function stringOf(alphabet, minLength = 0, maxLength = 10) {
  throw new Error('TODO');
}

export function forAll(gen, predicate, { runs = 100, seed = 1 } = {}) {
  throw new Error('TODO');
}

// ──────────────────────────── tests ──────────────────────────────────────

test('intRange generates integers inside the range, both ends included', () => {
  const rng = makeRandom(1);
  const gen = intRange(1, 6);
  const values = Array.from({ length: 300 }, () => gen(rng));
  ok(
    values.every((v) => Number.isInteger(v) && v >= 1 && v <= 6),
    'every value must be an integer in 1..6'
  );
  eq([...new Set(values)].sort(), [1, 2, 3, 4, 5, 6]);
});

test('arrayOf respects both length bounds', () => {
  const rng = makeRandom(2);
  const gen = arrayOf(intRange(0, 9), 2, 5);
  const lengths = Array.from({ length: 200 }, () => gen(rng).length);
  ok(
    lengths.every((n) => n >= 2 && n <= 5),
    'lengths must stay inside the bounds'
  );
  eq([...new Set(lengths)].sort(), [2, 3, 4, 5]);
});

test('arrayOf builds its items with the item generator', () => {
  const items = arrayOf(intRange(7, 7), 3, 3)(makeRandom(3));
  eq(items, [7, 7, 7]);
});

test('stringOf only ever uses characters from the alphabet', () => {
  const rng = makeRandom(4);
  const gen = stringOf('ab', 3, 3);
  for (let i = 0; i < 50; i++) {
    const s = gen(rng);
    eq(s.length, 3);
    ok([...s].every((ch) => 'ab'.includes(ch)), `bad character in ${s}`);
  }
});

test('a property that holds reports ok and the number of runs', () => {
  let calls = 0;
  const result = forAll(
    intRange(0, 100),
    (n) => {
      calls += 1;
      return n >= 0 && n <= 100;
    },
    { runs: 25, seed: 1 }
  );
  eq(result.ok, true);
  eq(result.runs, 25);
  eq(calls, 25);
});

test('a failing property reports the counterexample and the seed', () => {
  const result = forAll(intRange(0, 5), (n) => n !== 3, { runs: 200, seed: 1 });
  eq(result.ok, false);
  eq(result.counterexample, 3);
  eq(result.seed, 1);
});

test('forAll stops at the very first failure', () => {
  const seen = [];
  const result = forAll(
    intRange(0, 5),
    (n) => {
      seen.push(n);
      return n !== 3;
    },
    { runs: 200, seed: 1 }
  );
  eq(result.ok, false);
  eq(seen.at(-1), 3);
  eq(seen.filter((n) => n === 3).length, 1);
  ok(seen.length < 200, 'it should not keep going after a failure');
  eq(result.runs, seen.length);
});

test('the same seed replays exactly the same result', () => {
  const run = (seed) =>
    forAll(arrayOf(intRange(0, 999), 1, 6), (xs) => Math.max(...xs) < 900, {
      runs: 100,
      seed,
    });
  eq(run(99), run(99));
  eq(run(99).ok, false);
});
