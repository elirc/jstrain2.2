// ─────────────────────────────────────────────────────────────────────────
//  04 · first & last                                        ★★☆ core
//  concepts: infer on tuples · rest patterns · composing type helpers
//  run: node ../run.js exercises/04-first-and-last.ts
// ─────────────────────────────────────────────────────────────────────────
//
//  Tuples can be pattern-matched from either end. Build the two ends,
//  then reuse them to read a function's first and last parameter type.
//
//      First<[1, 2, 3]>                       → 1
//      Last<[1, 2, 3]>                        → 3
//      First<[]>                              → never
//      FirstArg<(a: string, b: number) => void>  → string
//      LastArg<(a: string, b: number) => void>   → number
//      FirstArg<() => void>                   → never   (no parameters)
//
//  First and Last must only accept tuples/arrays — passing a string has
//  to be a compile error, so they need a constraint.
//
//  hint: `[...unknown[], infer L]` is "anything, then one more thing"

import { test, eq } from '../../_lib/check.ts';
import {
  use,
  type Expect,
  type Equal,
  type IsNever,
} from '../../_lib/type-assert.ts';

type TODO = any; // replace every TODO below with real types

export type First<T> = TODO;
export type Last<T> = TODO;
export type FirstArg<F> = TODO;
export type LastArg<F> = TODO;

// ─────────────────────────── runtime tests ───────────────────────────────

const head: First<[string, number]> = 'ada';
const tail: Last<[string, number]> = 1;

test('the ends of the tuple type hold real values', () => {
  eq(head, 'ada');
  eq(tail, 1);
});

// ──────────────────────────── type tests ─────────────────────────────────

type _t1 = Expect<Equal<First<[1, 2, 3]>, 1>>;
type _t2 = Expect<Equal<Last<[1, 2, 3]>, 3>>;
type _t3 = Expect<Equal<First<['only']>, 'only'>>;
type _t4 = Expect<IsNever<First<[]>>>;
type _t5 = Expect<IsNever<Last<[]>>>;
// an unbounded array is not a non-empty tuple: it might be empty
type _t6 = Expect<IsNever<First<string[]>>>;

type _a1 = Expect<Equal<FirstArg<(a: string, b: number) => void>, string>>;
type _a2 = Expect<Equal<LastArg<(a: string, b: number) => void>, number>>;
type _a3 = Expect<Equal<FirstArg<(only: boolean) => void>, boolean>>;
type _a4 = Expect<IsNever<FirstArg<() => void>>>;
// a rest signature has no statically first or last parameter either
type _a5 = Expect<IsNever<FirstArg<(...xs: boolean[]) => void>>>;
type _a6 = Expect<IsNever<LastArg<(...xs: boolean[]) => void>>>;
type _a7 = Expect<IsNever<LastArg<'not a function'>>>;

// @ts-expect-error — First only accepts tuples and arrays
type _bad = First<string>;

function _typeTests() {
  // @ts-expect-error — Last<[1, 2, 3]> is 3, not 1
  const wrong: Last<[1, 2, 3]> = 1;
  use(wrong);
}
use(_typeTests);
