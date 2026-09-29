// ─────────────────────────────────────────────────────────────────────────
//  20 · primes · nthPrime — SOLUTION                        ★★★ stretch
//  run: node 20-lazy-sieve.js
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: the Map is the sieve, turned inside out. Instead of an
//  array of every number up to N with crossings-off, it holds only ONE
//  entry per prime found so far: "the next multiple of me that nobody
//  has claimed yet" → "me". That is memory proportional to the number
//  of primes below the current n, and no upper bound anywhere.
//
//  For each n: if it is not in the map, nobody's multiple has landed
//  here, so n is prime — yield it and plant its first interesting
//  composite at n * n (everything smaller is already covered by smaller
//  primes). If it IS in the map, delete the spent entry and re-plant
//  that prime further along, skipping slots already taken so two primes
//  never fight over one key.
//
//  Classic wrong turn: trial division against every prime found so far.
//  It gives the same answers and is fine for the first few hundred, but
//  it re-does work the sieve records once — and it teaches the wrong
//  lesson, which is that an endless generator cannot carry a working
//  set. It can; that is the whole point of the paused stack.

import { test, eq, ok } from '../../_lib/check.js';

// scaffolding: take() from earlier and a deliberately dumb primality
// check the tests use as a reference. It is NOT the shape you want in
// primes(). Do not edit.
function* take(n, iterable) {
  if (n <= 0) return;
  let taken = 0;
  for (const value of iterable) {
    yield value;
    taken += 1;
    if (taken >= n) return;
  }
}

function isPrimeSlow(n) {
  if (n < 2) return false;
  for (let d = 2; d * d <= n; d += 1) if (n % d === 0) return false;
  return true;
}

export function* primes() {
  const composites = new Map();
  let n = 2;
  while (true) {
    const factor = composites.get(n);
    if (factor === undefined) {
      yield n;
      composites.set(n * n, n);
    } else {
      composites.delete(n);
      let slot = n + factor;
      while (composites.has(slot)) slot += factor;
      composites.set(slot, factor);
    }
    n += 1;
  }
}

export function nthPrime(n) {
  if (n < 1) return undefined;
  let seen = 0;
  for (const p of primes()) {
    seen += 1;
    if (seen === n) return p;
  }
  return undefined;
}

// ──────────────────────────── tests ──────────────────────────────────────

test('it starts at 2 and yields the first ten primes', () => {
  eq([...take(10, primes())], [2, 3, 5, 7, 11, 13, 17, 19, 23, 29]);
});

test('one pull alone gives 2', () => {
  eq(primes().next(), { value: 2, done: false });
});

test('every value it yields really is prime', () => {
  for (const p of take(50, primes())) ok(isPrimeSlow(p), `${p} is not prime`);
});

test('it skips no primes — the 25th is 97', () => {
  const found = [...take(25, primes())];
  eq(found.at(-1), 97);
  eq(found.length, new Set(found).size, 'no value may repeat');
});

test('it keeps going well past the small primes', () => {
  eq([...take(100, primes())].at(-1), 541);
});

test('nthPrime counts from one', () => {
  eq(nthPrime(1), 2);
  eq(nthPrime(6), 13);
  eq(nthPrime(25), 97);
});

test('nthPrime of zero or less is undefined', () => {
  eq(nthPrime(0), undefined);
});

test('two prime streams are independent', () => {
  const a = primes();
  const b = primes();
  a.next();
  a.next();
  eq(b.next().value, 2);
  eq(a.next().value, 5);
});
