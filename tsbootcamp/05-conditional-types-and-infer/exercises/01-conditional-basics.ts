// ─────────────────────────────────────────────────────────────────────────
//  01 · conditional basics                                  ★★☆ core
//  concepts: conditional types · extends · assignability
//  run: node ../run.js exercises/01-conditional-basics.ts
// ─────────────────────────────────────────────────────────────────────────
//
//  A conditional type is a question tsc answers for you: "is the left
//  side assignable to the right side?" Build three of them.
//
//      IsString<'hi'>             → true
//      IsString<number>           → false
//      If<true, 'yes', 'no'>      → 'yes'
//      Flatten1<number[]>         → number    (one level, elements out)
//      Flatten1<number>           → number    (not an array → unchanged)
//
//  `If` must also REJECT a non-boolean condition — `If<'yes', 1, 0>` has
//  to be a compile error, so its first parameter needs a constraint.
//
//  hint: T[number] means "the element type of the array/tuple T"

import { test, eq } from '../../_lib/check.ts';
import {
  use,
  type Expect,
  type Equal,
  type IsNever,
} from '../../_lib/type-assert.ts';

type TODO = any; // replace every TODO below with real types

export type IsString<T> = TODO;
export type If<C, T, F> = TODO;
export type Flatten1<T> = TODO;

// ─────────────────────────── runtime tests ───────────────────────────────
//  This module is type-level: the runtime test is a token that proves the
//  values below really do have the types you wrote. The grading weight is
//  in the type tests underneath.

const label: If<true, string, number> = 'ts';
const item: Flatten1<string[]> = 'sky';

test('the typed values survive to runtime', () => {
  eq(label, 'ts');
  eq(item, 'sky');
});

// ──────────────────────────── type tests ─────────────────────────────────

type _s1 = Expect<Equal<IsString<'hi'>, true>>;
type _s2 = Expect<Equal<IsString<string>, true>>;
type _s3 = Expect<Equal<IsString<number>, false>>;
// a union asks the question once per member, so both answers come back
type _s4 = Expect<Equal<IsString<string | number>, boolean>>;
// ...and never asks it zero times
type _s5 = Expect<IsNever<IsString<never>>>;

type _i1 = Expect<Equal<If<true, 'yes', 'no'>, 'yes'>>;
type _i2 = Expect<Equal<If<false, 'yes', 'no'>, 'no'>>;
type _i3 = Expect<Equal<If<boolean, 'yes', 'no'>, 'yes' | 'no'>>;

type _f1 = Expect<Equal<Flatten1<number[]>, number>>;
type _f2 = Expect<Equal<Flatten1<string>, string>>;
type _f3 = Expect<Equal<Flatten1<[1, 2, 3]>, 1 | 2 | 3>>;
type _f4 = Expect<Equal<Flatten1<number[][]>, number[]>>;
type _f5 = Expect<IsNever<Flatten1<[]>>>;

// @ts-expect-error — If's condition must be constrained to boolean
type _i4 = If<'yes', 1, 0>;

function _typeTests() {
  // @ts-expect-error — Flatten1<string[]> is string, not string[]
  const wrong: Flatten1<string[]> = ['a'];
  use(wrong);
}
use(_typeTests);
