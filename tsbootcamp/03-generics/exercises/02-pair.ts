// ─────────────────────────────────────────────────────────────────────────
//  02 · pair                                              ★☆☆ warm-up
//  concepts: multiple type parameters · tuple types
//  run: node ../run.js exercises/02-pair.ts
// ─────────────────────────────────────────────────────────────────────────
//
//  Two independent type parameters, and a tuple to carry them. `[A, B]`
//  is a fixed-length array where each slot has its own type — the return
//  type has to say which slot is which, and swapping has to say it in
//  the other order.
//
//      pair(1, 'a')          → [1, 'a']       typed [number, string]
//      swapPair([1, 'a'])    → ['a', 1]       typed [string, number]
//      firstOfPair([1, 'a']) → 1              typed number
//
//  Name the second parameter B and use it: `<A, B>` on every function
//  here, in the order the values appear.

import { test, eq } from '../../_lib/check.ts';
import { use, type Expect, type Equal } from '../../_lib/type-assert.ts';

type TODO = any; // replace every TODO below with real types

export function pair(a: TODO, b: TODO): TODO {
  throw new Error('TODO');
}

export function swapPair(p: TODO): TODO {
  throw new Error('TODO');
}

export function firstOfPair(p: TODO): TODO {
  throw new Error('TODO');
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
