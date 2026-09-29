// ─────────────────────────────────────────────────────────────────────────
//  02 · pair — SOLUTION                                   ★☆☆ warm-up
//  run: node ../run.js solutions/02-pair.ts
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: two type parameters mean two independent slots. `[A, B]`
//  is a TUPLE type — position-aware, fixed length — which is what lets
//  `swapPair` promise `[B, A]` and be believed.
//
//  Note the difference from 01: `pair(1, 'a')` is `[number, string]`, not
//  `[1, 'a']`. A literal only survives when the type parameter sits bare
//  in the return type; here A is nested inside a tuple, so TS widens it
//  to the base type. Exercise 17 shows how to keep the literals.
//
//  The classic wrong turn is `(a: A, b: B): A[]` or `(A | B)[]` — an
//  array type forgets which slot held which type and every read comes
//  back as a union you then have to narrow.

import { test, eq } from '../../_lib/check.ts';
import { use, type Expect, type Equal } from '../../_lib/type-assert.ts';

export function pair<A, B>(a: A, b: B): [A, B] {
  return [a, b];
}

export function swapPair<A, B>(p: [A, B]): [B, A] {
  return [p[1], p[0]];
}

export function firstOfPair<A, B>(p: [A, B]): A {
  return p[0];
}

// ─────────────────────────── runtime tests ───────────────────────────────

test('builds a two-slot tuple', () => {
  eq(pair(1, 'a'), [1, 'a']);
});

test('the two slots are independent', () => {
  eq(pair('user', { id: 7 }), ['user', { id: 7 }]);
});

test('swapPair reverses the slots', () => {
  eq(swapPair([1, 'a']), ['a', 1]);
});

test('swapping twice gets you back where you started', () => {
  eq(swapPair(swapPair([1, 'a'])), [1, 'a']);
});

test('firstOfPair reads slot zero', () => {
  eq(firstOfPair(['left', 'right']), 'left');
});

// ──────────────────────────── type tests ─────────────────────────────────

type _r1 = Expect<Equal<ReturnType<typeof pair<number, string>>, [number, string]>>;
type _r2 = Expect<Equal<ReturnType<typeof swapPair<number, string>>, [string, number]>>;
type _r3 = Expect<Equal<ReturnType<typeof firstOfPair<boolean, string>>, boolean>>;

function _typeTests() {
  const p = pair(1, 'a');
  type _p = Expect<Equal<typeof p, [number, string]>>;

  const flipped = swapPair(p);
  type _f = Expect<Equal<typeof flipped, [string, number]>>;

  const head = firstOfPair(p);
  type _h = Expect<Equal<typeof head, number>>;
  use(p, flipped, head);

  // @ts-expect-error — order matters: pair('a', 1) is [string, number]
  const backwards: [number, string] = pair('a', 1);
  use(backwards);

  // @ts-expect-error — a tuple is not a free-for-all array; slot 2 does not exist
  firstOfPair([1, 'a', true]);
}
use(_typeTests);
