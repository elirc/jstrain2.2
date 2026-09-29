// ─────────────────────────────────────────────────────────────────────────
//  12 · CamelCase & PascalCase — SOLUTION                   ★★★ stretch
//  run: node ../run.js solutions/12-camel-case.ts
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: trace CamelCase<'foo_bar_baz'>.
//
//    pass 1  S = 'foo_bar_baz' matches `${infer H}_${infer T}`
//            the LEFTMOST underscore wins → H = 'foo', T = 'bar_baz'
//            → `foo${CamelCase<Capitalize<'bar_baz'>>}`
//                                       Capitalize → 'Bar_baz'
//    pass 2  S = 'Bar_baz'  → H = 'Bar', T = 'baz'
//            → `Bar${CamelCase<'Baz'>}`   (Capitalize<'baz'> = 'Baz')
//    pass 3  S = 'Baz' has no underscore → base case → 'Baz'
//    unwind  'Baz' → 'BarBaz' → 'fooBarBaz'
//
//  Capitalize is applied to the REST before recursing, so every segment
//  after the first gets its initial upper-cased exactly once and the very
//  first segment is never touched. Capitalize/Uncapitalize/Uppercase/
//  Lowercase are intrinsic: they have no TypeScript body, the compiler
//  implements them natively — you cannot write them yourself, and you
//  don't have to.
//
//  Edge cases the tests pin down:
//  · CamelCase<'foo_'> → H = 'foo', T = '' → Capitalize<''> is '' →
//    the recursive call on '' hits the base case → 'foo'.
//  · CamelCase<'a_b_c_d'> → 'aBCD'. Single-letter segments look wrong at
//    a glance but follow the rule exactly.
//
//  PascalCase composes: Capitalize<CamelCase<S>>. Recursing a second time
//  with different capitalisation rules would be twice the code and twice
//  the bugs — the same instinct as reusing a function.

import { test, eq } from '../../_lib/check.ts';
import { use, type Expect, type Equal } from '../../_lib/type-assert.ts';

export type CamelCase<S extends string> = S extends `${infer H}_${infer T}`
  ? `${H}${CamelCase<Capitalize<T>>}`
  : S;
export type PascalCase<S extends string> = Capitalize<CamelCase<S>>;

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
