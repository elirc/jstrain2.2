// ─────────────────────────────────────────────────────────────────────────
//  04 · first & last — SOLUTION                             ★★☆ core
//  run: node ../run.js solutions/04-first-and-last.ts
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: a tuple pattern is positional, exactly like array
//  destructuring — `[infer H, ...unknown[]]` is `const [h, ...rest]` and
//  `[...unknown[], infer L]` is the mirror image. TypeScript allows ONE
//  rest element in a tuple type, so those are the only two shapes you get;
//  everything else in this module is built from them plus recursion.
//
//  Why the edges land where they do:
//  · First<[]> — the empty tuple is not assignable to [unknown, ...],
//    which requires at least one element. False branch → never.
//  · First<string[]> — same reason, and it's the interesting one: a
//    string[] MIGHT be empty, so tsc refuses to promise a first element.
//    Tuples carry length in the type; arrays don't.
//  · FirstArg composes rather than re-deriving: match the whole parameter
//    list with `(...args: infer P)`, then hand P to First. P is known to
//    be an array type, so it satisfies First's `T extends unknown[]`
//    constraint without any extra ceremony.
//  · FirstArg<() => void> → P is [] → First<[]> → never. FirstArg of a
//    rest signature → P is boolean[] → an array, not a non-empty tuple →
//    never again. Both are honest answers: neither signature has a first
//    parameter that tsc can name.
//
//  Classic wrong turn: matching the shape
//  `(first: infer A, ...rest: never[]) => unknown` directly. A
//  zero-parameter function IS assignable to a one-parameter signature,
//  so `() => void` matches with nothing to infer, and A lands on
//  unknown instead of never.

import { test, eq } from '../../_lib/check.ts';
import {
  use,
  type Expect,
  type Equal,
  type IsNever,
} from '../../_lib/type-assert.ts';

export type First<T extends unknown[]> = T extends [infer H, ...unknown[]] ? H : never;
export type Last<T extends unknown[]> = T extends [...unknown[], infer L] ? L : never;
export type FirstArg<F> = F extends (...args: infer P) => unknown ? First<P> : never;
export type LastArg<F> = F extends (...args: infer P) => unknown ? Last<P> : never;

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
