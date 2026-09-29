// ─────────────────────────────────────────────────────────────────────────
//  05 · distributive conditionals                           ★★★ stretch
//  concepts: distribution over unions · the [T] extends [U] trick
//  run: node ../run.js exercises/05-distributive-conditionals.ts
// ─────────────────────────────────────────────────────────────────────────
//
//  A conditional whose checked type is a NAKED type parameter runs once
//  per union member. That is the whole implementation of Exclude and
//  friends — a filter with no loop in sight.
//
//      MyExclude<'a' | 'b' | 'c', 'a'>       → 'b' | 'c'
//      MyExtract<'a' | 'b' | 1, string>      → 'a' | 'b'
//      MyNonNullable<string | null>          → string
//
//  Then the opposite problem. IsStringLoose (provided below) distributes,
//  so it answers `boolean` for a mixed union and `never` for never.
//  Write IsStringExact so the union is judged AS ONE TYPE:
//
//      IsStringLoose<string | number>  → boolean     IsStringExact → false
//      IsStringLoose<never>            → never       IsStringExact → true
//
//  hint: wrapping both sides in a 1-tuple stops distribution dead

import { test, eq } from '../../_lib/check.ts';
import {
  use,
  type Expect,
  type Equal,
  type IsNever,
} from '../../_lib/type-assert.ts';

// provided — the distributing version, for contrast
export type IsStringLoose<T> = T extends string ? true : false;

type TODO = any; // replace every TODO below with real types

export type MyExclude<T, U> = TODO;
export type MyExtract<T, U> = TODO;
export type MyNonNullable<T> = TODO;
export type IsStringExact<T> = TODO;

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
