// ─────────────────────────────────────────────────────────────────────────
//  11 · StringToUnion & LengthOfString — SOLUTION           ★★★ stretch
//  run: node ../run.js solutions/11-string-to-union.ts
// ─────────────────────────────────────────────────────────────────────────
//
//  Walkthrough: trace StringToUnion<'abc'>.
//
//    pass 1  S = 'abc' matches `${infer C}${infer Rest}`
//            two adjacent holes → the first takes exactly ONE character
//            C = 'a', Rest = 'bc'   → 'a' | StringToUnion<'bc'>
//    pass 2  C = 'b', Rest = 'c'    → 'b' | StringToUnion<'c'>
//    pass 3  C = 'c', Rest = ''     → 'c' | StringToUnion<''>
//    pass 4  S = '' does NOT match — there is no character for the first
//            hole → base case → never
//    unwind  never | 'c' | 'b' | 'a' → 'a' | 'b' | 'c'   (never vanishes)
//
//  never as the base case is the point: it is the identity element of
//  union, so the last step contributes nothing. Return '' instead and
//  you get a stray '' member in every answer. And because a union is a
//  set, 'aa' collapses to 'a' — that is TypeScript, not a bug in your
//  recursion.
//
//  LengthOfString cannot count, because type land has no arithmetic. It
//  BORROWS the length of a tuple instead:
//
//    LengthOfString<'hi'>            Acc = []
//      → 'hi' matches, R = 'i'       Acc = [unknown]
//      → 'i'  matches, R = ''        Acc = [unknown, unknown]
//      → ''   does not match         → Acc['length'] → 2
//
//  The accumulator parameter with a default (`Acc extends unknown[] = []`)
//  is the standard loop-variable pattern in type land: callers never pass
//  it, each pass hands the next value to itself, and the base case reads
//  it out. `${string}${infer R}` says "one character, don't care which" —
//  a plain `string` in a template position still consumes exactly one
//  character when a placeholder follows it.
//
//  Accumulator recursion like this is also TAIL recursive, so tsc uses
//  its dedicated fast path — good for ~10 000 steps rather than ~1000.

import { test, eq } from '../../_lib/check.ts';
import { use, type Expect, type Equal, type IsNever } from '../../_lib/type-assert.ts';

export type StringToUnion<S extends string> = S extends `${infer C}${infer Rest}`
  ? C | StringToUnion<Rest>
  : never;
export type LengthOfString<
  S extends string,
  Acc extends unknown[] = [],
> = S extends `${string}${infer R}` ? LengthOfString<R, [...Acc, unknown]> : Acc['length'];

// ─────────────────────────── runtime tests ───────────────────────────────

const letter: StringToUnion<'abc'> = 'b';
const len: LengthOfString<'hello'> = 5;

test('the character types hold real characters', () => {
  eq(letter, 'b');
  eq(len, 5);
});

// ──────────────────────────── type tests ─────────────────────────────────

type _u1 = Expect<Equal<StringToUnion<'abc'>, 'a' | 'b' | 'c'>>;
type _u2 = Expect<Equal<StringToUnion<'hi'>, 'h' | 'i'>>;
// duplicates collapse: a union is a set
type _u3 = Expect<Equal<StringToUnion<'aa'>, 'a'>>;
// no characters, no members — the empty string is the base case
type _u4 = Expect<IsNever<StringToUnion<''>>>;
type _u5 = Expect<Equal<StringToUnion<'a b'>, 'a' | ' ' | 'b'>>;

type _l1 = Expect<Equal<LengthOfString<'hello'>, 5>>;
type _l2 = Expect<Equal<LengthOfString<''>, 0>>;
type _l3 = Expect<Equal<LengthOfString<'a'>, 1>>;
type _l4 = Expect<Equal<LengthOfString<'  '>, 2>>;

function _typeTests() {
  const c: StringToUnion<'abc'> = 'c';
  use(c);

  // @ts-expect-error — 'd' is not one of the characters of 'abc'
  const bad: StringToUnion<'abc'> = 'd';
  use(bad);

  // @ts-expect-error — the length is the literal 5, not any number
  const wrong: LengthOfString<'hello'> = 4;
  use(wrong);
}
use(_typeTests);
