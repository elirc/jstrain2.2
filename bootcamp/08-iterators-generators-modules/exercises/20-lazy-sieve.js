// ─────────────────────────────────────────────────────────────────────────
//  20 · primes · nthPrime                                   ★★★ stretch
//  concepts: endless generators that carry a working set
//  run: node 20-lazy-sieve.js
// ─────────────────────────────────────────────────────────────────────────
//
//  The sieve of Eratosthenes needs an upper bound: you allocate an
//  array of size N and cross things off. A generator does not get to
//  know N, so it sieves INCREMENTALLY — it carries a map of "the next
//  number I already know is composite" → "the prime that will strike
//  it", and grows that map one prime at a time.
//
//      [...take(5, primes())]   → [2, 3, 5, 7, 11]
//      nthPrime(1)              → 2      1-based
//      nthPrime(25)             → 97
//      nthPrime(0)              → undefined
//
//  primes() must run forever without an upper bound anywhere in it, and
//  without re-testing a number it has already ruled out.
//
//  hint: when you yield a prime p, the first composite only p can be
//        blamed for is p * p; every later hit just moves p's marker
//        forward by p (past any square that is already taken)

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
  throw new Error('TODO');
}

export function nthPrime(n) {
  throw new Error('TODO');
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
