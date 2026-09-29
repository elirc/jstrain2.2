// ─────────────────────────────────────────────────────────────────────────
//  05 · distributive conditionals — SOLUTION                ★★★ stretch
//  run: node ../run.js solutions/05-distributive-conditionals.ts
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: distribution is the loop. `T extends U ? never : T` looks
//  like one question; with T = 'a' | 'b' | 'c' tsc runs it three times:
//
//      'a' extends 'a' ? never : 'a'   → never
//      'b' extends 'a' ? never : 'b'   → 'b'
//      'c' extends 'a' ? never : 'c'   → 'c'
//      union of the answers            → never | 'b' | 'c' = 'b' | 'c'
//
//  never vanishes from a union, so returning never IS "drop this member".
//  That is the entire mechanism behind Exclude, Extract and NonNullable
//  in lib.es5.d.ts — go read them, they're the same three lines.
//
//  Two rules decide whether this happens at all:
//  1. the checked type must be a NAKED type parameter (plain `T`), and
//  2. the type argument must actually be a union.
//
//  Break rule 1 on purpose and you get the bracket trick. `[T] extends
//  [string]` wraps both sides in a 1-tuple, so tsc compares two tuple
//  types and never splits anything. The tests pin the two behaviours
//  against each other:
//
//      IsStringLoose<string | number> → true | false = boolean
//      IsStringExact<string | number> → is [string|number] a [string]?  no
//      IsStringLoose<never>           → zero members → zero answers → never
//      IsStringExact<never>           → is [never] a [string]?  yes → true
//
//  That last line is the reason IsNever is written as `[T] extends
//  [never]`: never is assignable to everything, so you must ask about it
//  without letting it evaporate first.

import { test, eq } from '../../_lib/check.ts';
import {
  use,
  type Expect,
  type Equal,
  type IsNever,
} from '../../_lib/type-assert.ts';

// provided — the distributing version, for contrast
export type IsStringLoose<T> = T extends string ? true : false;

export type MyExclude<T, U> = T extends U ? never : T;
export type MyExtract<T, U> = T extends U ? T : never;
export type MyNonNullable<T> = T extends null | undefined ? never : T;
export type IsStringExact<T> = [T] extends [string] ? true : false;

// ─────────────────────────── runtime tests ───────────────────────────────

const kept: MyExclude<'a' | 'b', 'a'> = 'b';
const defined: MyNonNullable<string | null | undefined> = 'here';

test('the filtered types hold the values that survived', () => {
  eq(kept, 'b');
  eq(defined, 'here');
});

// ──────────────────────────── type tests ─────────────────────────────────

type _x1 = Expect<Equal<MyExclude<'a' | 'b' | 'c', 'a'>, 'b' | 'c'>>;
type _x2 = Expect<IsNever<MyExclude<'a' | 'b', 'a' | 'b'>>>;
type _x3 = Expect<Equal<MyExclude<string | number, boolean>, string | number>>;
// never is the empty union: nothing to run the filter on
type _x4 = Expect<IsNever<MyExclude<never, 'a'>>>;
type _x5 = Expect<Equal<MyExclude<'a' | 'b', 'a'>, Exclude<'a' | 'b', 'a'>>>;

type _e1 = Expect<Equal<MyExtract<'a' | 'b' | 1, string>, 'a' | 'b'>>;
type _e2 = Expect<IsNever<MyExtract<'a' | 'b', number>>>;
type _e3 = Expect<Equal<MyExtract<string | number, string>, Extract<string | number, string>>>;

type _n1 = Expect<Equal<MyNonNullable<string | null | undefined>, string>>;
type _n2 = Expect<IsNever<MyNonNullable<null>>>;
type _n3 = Expect<Equal<MyNonNullable<number | undefined>, number>>;

// the two halves of the same question, answered differently
type _b1 = Expect<Equal<IsStringLoose<string | number>, boolean>>;
type _b2 = Expect<Equal<IsStringExact<string | number>, false>>;
type _b3 = Expect<IsNever<IsStringLoose<never>>>;
// never is assignable to string, and bracketing asks about never itself
type _b4 = Expect<Equal<IsStringExact<never>, true>>;
type _b5 = Expect<Equal<IsStringExact<'lit'>, true>>;
type _b6 = Expect<Equal<IsStringExact<number>, false>>;

function _typeTests() {
  const b: MyExclude<'a' | 'b', 'a'> = 'b';
  use(b);

  // @ts-expect-error — 'a' was excluded from the union
  const gone: MyExclude<'a' | 'b', 'a'> = 'a';
  use(gone);

  // @ts-expect-error — MyNonNullable dropped null from the type
  const nulled: MyNonNullable<string | null> = null;
  use(nulled);
}
use(_typeTests);
