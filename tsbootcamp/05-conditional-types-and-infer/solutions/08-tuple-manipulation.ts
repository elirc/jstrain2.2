// ─────────────────────────────────────────────────────────────────────────
//  08 · tuple manipulation — SOLUTION                       ★★★ stretch
//  run: node ../run.js solutions/08-tuple-manipulation.ts
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: Push and Unshift need no conditional at all — a spread
//  inside a tuple literal (`[...T, V]`) is plain construction, the type
//  equivalent of `[...arr, v]`. Pop and Shift need a pattern with an
//  `infer` rest, and their false branch is `[]` rather than never so that
//  Pop<[]> stays a tuple you can keep working with.
//
//  Reverse is the recursive rebuild. Trace Reverse<[1, 2, 3]>:
//
//    pass 1  T = [1, 2, 3]  → H = 1, R = [2, 3]   → [...Reverse<[2, 3]>, 1]
//    pass 2  T = [2, 3]     → H = 2, R = [3]      → [...Reverse<[3]>, 2]
//    pass 3  T = [3]        → H = 3, R = []       → [...Reverse<[]>, 3]
//    pass 4  T = []         → no match            → []
//    unwind  [] → [3] → [3, 2] → [3, 2, 1]
//
//  Read it as "the reverse of a list is the reverse of its tail with the
//  head stuck on the end" — the same definition you'd write in any
//  language, only the recursion happens at compile time.
//
//  Two details worth keeping:
//  · `infer R` in a rest position gives you the whole remaining tuple, so
//    the recursive call is legal without extra constraints.
//  · The `T extends unknown[]` constraints are what make Reverse<string>
//    a compile error instead of a silent `[]`. Without them a caller can
//    pass anything and get a plausible-looking wrong answer.

import { test, eq } from '../../_lib/check.ts';
import { use, type Expect, type Equal } from '../../_lib/type-assert.ts';

export type Push<T extends unknown[], V> = [...T, V];
export type Unshift<T extends unknown[], V> = [V, ...T];
export type Pop<T extends unknown[]> = T extends [...infer Rest, unknown] ? Rest : [];
export type Shift<T extends unknown[]> = T extends [unknown, ...infer Rest] ? Rest : [];
export type Reverse<T extends unknown[]> = T extends [infer H, ...infer R]
  ? [...Reverse<R>, H]
  : [];

// ─────────────────────────── runtime tests ───────────────────────────────

const pushed: Push<[1, 2], 3> = [1, 2, 3];
const reversed: Reverse<['a', 'b']> = ['b', 'a'];

test('the rebuilt tuple types accept exactly those values', () => {
  eq(pushed, [1, 2, 3]);
  eq(reversed, ['b', 'a']);
});

// ──────────────────────────── type tests ─────────────────────────────────

type _p1 = Expect<Equal<Push<[1, 2], 3>, [1, 2, 3]>>;
type _p2 = Expect<Equal<Push<[], 'x'>, ['x']>>;
type _p3 = Expect<Equal<Unshift<[2, 3], 1>, [1, 2, 3]>>;

type _o1 = Expect<Equal<Pop<[1, 2, 3]>, [1, 2]>>;
type _o2 = Expect<Equal<Pop<['only']>, []>>;
// popping nothing is not an error, it's just nothing
type _o3 = Expect<Equal<Pop<[]>, []>>;
type _o4 = Expect<Equal<Shift<[1, 2, 3]>, [2, 3]>>;
type _o5 = Expect<Equal<Shift<[]>, []>>;

type _r1 = Expect<Equal<Reverse<[1, 2, 3]>, [3, 2, 1]>>;
type _r2 = Expect<Equal<Reverse<[]>, []>>;
type _r3 = Expect<Equal<Reverse<['a']>, ['a']>>;
type _r4 = Expect<Equal<Reverse<[1, 'two', true]>, [true, 'two', 1]>>;
type _r5 = Expect<Equal<Reverse<Reverse<[1, 2, 3]>>, [1, 2, 3]>>;

// @ts-expect-error — Reverse takes tuples and arrays, not strings
type _bad = Reverse<string>;

function _typeTests() {
  // @ts-expect-error — Push appends, it does not prepend
  const wrong: Push<[1, 2], 3> = [3, 1, 2];
  use(wrong);
}
use(_typeTests);
