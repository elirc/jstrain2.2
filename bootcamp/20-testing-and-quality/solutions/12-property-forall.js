// ─────────────────────────────────────────────────────────────────────────
//  12 · forAll — SOLUTION                                    ★★★ stretch
//  run: node 12-property-forall.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: example-based tests check the cases you thought of. A
//  property checks a RULE against cases you did not — and this is the whole
//  engine, in about fifteen lines.
//  A generator is just `(rng) => value`. That one-line contract is why they
//  compose: `arrayOf` takes a generator and returns a generator, so
//  `arrayOf(arrayOf(intRange(0, 9)))` needs no new code. fast-check calls
//  these Arbitraries and they are the same shape.
//  ONE rng is threaded through the whole run, so the sequence of values is
//  a pure function of the seed. That is what makes the report actionable:
//  it hands back the seed, and re-running with that seed replays exactly
//  the same 100 values. A property test that cannot be replayed is a flaky
//  test with extra steps.
//  Returning a report instead of throwing keeps forAll composable — you can
//  assert on it, log it, or feed the counterexample into a shrinker
//  (exercise 13). Note that only a FALSY return counts as a failure here;
//  real libraries also catch exceptions, but then a typo in your generator
//  gets reported as a "counterexample" and you chase your own tail.

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
  return (rng) => min + Math.floor(rng() * (max - min + 1));
}

export function arrayOf(itemGen, minLength = 0, maxLength = 10) {
  const lengthGen = intRange(minLength, maxLength);
  return (rng) => {
    const length = lengthGen(rng);
    return Array.from({ length }, () => itemGen(rng));
  };
}

export function stringOf(alphabet, minLength = 0, maxLength = 10) {
  const charGen = intRange(0, alphabet.length - 1);
  const lengthGen = intRange(minLength, maxLength);
  return (rng) => {
    const length = lengthGen(rng);
    let out = '';
    for (let i = 0; i < length; i++) out += alphabet[charGen(rng)];
    return out;
  };
}

export function forAll(gen, predicate, { runs = 100, seed = 1 } = {}) {
  const rng = makeRandom(seed);
  for (let run = 1; run <= runs; run++) {
    const value = gen(rng);
    if (!predicate(value)) {
      return { ok: false, runs: run, seed, counterexample: value };
    }
  }
  return { ok: true, runs };
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
