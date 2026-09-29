// ─────────────────────────────────────────────────────────────────────────
//  08 · tuple manipulation                                  ★★★ stretch
//  concepts: variadic tuples · infer rest · recursion with a spread
//  run: node ../run.js exercises/08-tuple-manipulation.ts
// ─────────────────────────────────────────────────────────────────────────
//
//  Array methods, at the type level. Four of them are one line of
//  spreading or matching; Reverse is your first recursive REBUILD — it
//  takes a tuple apart and puts a new one back together.
//
//      Push<[1, 2], 3>       → [1, 2, 3]      Unshift<[2, 3], 1> → [1, 2, 3]
//      Pop<[1, 2, 3]>        → [1, 2]         Shift<[1, 2, 3]>   → [2, 3]
//      Pop<[]>               → []             Reverse<[1, 2, 3]> → [3, 2, 1]
//
//  All five take tuples only — `Reverse<string>` must be a compile error.
//
//  hint: [...Reverse<Rest>, Head] — put the head back at the far end

import { test, eq } from '../../_lib/check.ts';
import { use, type Expect, type Equal } from '../../_lib/type-assert.ts';

type TODO = any; // replace every TODO below with real types

export type Push<T, V> = TODO;
export type Unshift<T, V> = TODO;
export type Pop<T> = TODO;
export type Shift<T> = TODO;
export type Reverse<T> = TODO;

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
