// ─────────────────────────────────────────────────────────────────────────
//  01 · conditional basics — SOLUTION                       ★★☆ core
//  run: node ../run.js solutions/01-conditional-basics.ts
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: `T extends string ? A : B` is not inheritance — it asks
//  "is T assignable to string?", the same question an assignment asks.
//  Two behaviours fall out of that and both are tested above:
//
//  · DISTRIBUTION. When the checked type is a NAKED type parameter (just
//    `T`, not `[T]` or `T[]`), tsc splits a union and asks once per
//    member, then unions the answers. IsString<string | number> runs
//    twice → true | false → which collapses to `boolean`.
//  · never IS the empty union. Zero members means zero questions and
//    zero answers: IsString<never> is never, not false. That surprises
//    everyone once.
//
//  `If` needs `C extends boolean` for two reasons: it documents the
//  contract, and it makes If<'yes', 1, 0> a compile error instead of
//  silently taking the false branch. Flatten1 uses the indexed access
//  T[number] — for [1, 2, 3] that is 1 | 2 | 3, and for the empty tuple
//  it is never, because there is no element to name.

import { test, eq } from '../../_lib/check.ts';
import {
  use,
  type Expect,
  type Equal,
  type IsNever,
} from '../../_lib/type-assert.ts';

export type IsString<T> = T extends string ? true : false;
export type If<C extends boolean, T, F> = C extends true ? T : F;
export type Flatten1<T> = T extends unknown[] ? T[number] : T;

// ─────────────────────────── runtime tests ───────────────────────────────

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
