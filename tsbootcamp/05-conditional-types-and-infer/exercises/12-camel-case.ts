// ─────────────────────────────────────────────────────────────────────────
//  12 · CamelCase & PascalCase                              ★★★ stretch
//  concepts: recursive template inference · intrinsic string types
//  run: node ../run.js exercises/12-camel-case.ts
// ─────────────────────────────────────────────────────────────────────────
//
//  The type-level version of the rename you do to every API payload.
//
//      CamelCase<'foo_bar_baz'>  → 'fooBarBaz'
//      CamelCase<'created_at'>   → 'createdAt'
//      CamelCase<'foo'>          → 'foo'      (no underscore → unchanged)
//      CamelCase<''>             → ''
//      PascalCase<'user_id'>     → 'UserId'
//
//  TypeScript ships four intrinsic string types — Uppercase, Lowercase,
//  Capitalize, Uncapitalize — and you need one of them. PascalCase is a
//  one-liner on top of CamelCase; do not write a second recursion.
//
//  hint: match `${infer H}_${infer T}`, then recurse on Capitalize<T>

import { test, eq } from '../../_lib/check.ts';
import { use, type Expect, type Equal } from '../../_lib/type-assert.ts';

type TODO = any; // replace every TODO below with real types

export type CamelCase<S extends string> = TODO;
export type PascalCase<S extends string> = TODO;

// ─────────────────────────── runtime tests ───────────────────────────────

const key: CamelCase<'created_at'> = 'createdAt';
const typeName: PascalCase<'user_id'> = 'UserId';

test('the renamed keys are those exact strings', () => {
  eq(key, 'createdAt');
  eq(typeName, 'UserId');
});

// ──────────────────────────── type tests ─────────────────────────────────

type _c1 = Expect<Equal<CamelCase<'foo_bar_baz'>, 'fooBarBaz'>>;
type _c2 = Expect<Equal<CamelCase<'created_at'>, 'createdAt'>>;
type _c3 = Expect<Equal<CamelCase<'foo_bar'>, 'fooBar'>>;
type _c4 = Expect<Equal<CamelCase<'foo'>, 'foo'>>;
type _c5 = Expect<Equal<CamelCase<''>, ''>>;
// a trailing underscore has nothing after it to capitalise
type _c6 = Expect<Equal<CamelCase<'foo_'>, 'foo'>>;
type _c7 = Expect<Equal<CamelCase<'a_b_c_d'>, 'aBCD'>>;

type _p1 = Expect<Equal<PascalCase<'user_id'>, 'UserId'>>;
type _p2 = Expect<Equal<PascalCase<'foo'>, 'Foo'>>;
type _p3 = Expect<Equal<PascalCase<''>, ''>>;

function _typeTests() {
  const ok: CamelCase<'foo_bar'> = 'fooBar';
  use(ok);

  // @ts-expect-error — the underscore is exactly what CamelCase removes
  const wrong: CamelCase<'foo_bar'> = 'foo_bar';
  use(wrong);

  // @ts-expect-error — PascalCase capitalises the first letter too
  const lower: PascalCase<'user_id'> = 'userId';
  use(lower);
}
use(_typeTests);
